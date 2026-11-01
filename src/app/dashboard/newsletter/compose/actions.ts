"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { NEWSLETTER_CONSENT_SOURCES } from "@/lib/newsletter/consent";
import { prisma } from "@/lib/db";
import { requireInstructor } from "@/lib/require-instructor";
import { buildNewsletterEmail, sendNewsletterBatch, stripHtml } from "@/lib/email";
import { siteUrl } from "@/lib/site";
import { newsletterSendError } from "@/lib/newsletter/access";
import {
  MAX_CAMPAIGN_CLASSES,
  storeNewsletterContent,
  readNewsletterContent,
} from "@/lib/newsletter/content";
import { renderNewsletterBody } from "@/lib/newsletter/render";

const contentSchema = z.object({
  subject: z.string().trim().max(200),
  bodyHtml: z.string().max(50000),
  classIds: z
    .array(z.string().regex(/^[a-zA-Z0-9_-]+$/))
    .max(MAX_CAMPAIGN_CLASSES)
    .transform((ids) => [...new Set(ids)]),
});
const sendableSchema = contentSchema
  .refine((data) => data.subject.length > 0, "Please enter a subject.")
  .refine(
    (data) => stripHtml(data.bodyHtml).length > 0 || data.classIds.length > 0,
    "Please enter a message or insert a class.",
  );
export type NewsletterContentInput = z.input<typeof contentSchema>;

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong. Please try again.";
}

export async function saveNewsletterDraft(
  input: NewsletterContentInput & { id?: string; revision?: string },
): Promise<{ ok: true; id: string; revision: string } | { ok: false; error: string }> {
  const instructor = await requireInstructor();
  const parsed = contentSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Check your campaign details." };
  const { subject, bodyHtml, classIds } = parsed.data;
  // A draft can retain a class that later becomes unavailable; previews/sends validate availability.
  const ownedCount = await prisma.yogaClass.count({
    where: { id: { in: classIds }, instructorId: instructor.id },
  });
  if (ownedCount !== classIds.length)
    return { ok: false, error: "Choose classes from your own schedule." };
  const data = { subject, bodyHtml: storeNewsletterContent(bodyHtml, classIds) };
  if (input.id) {
    if (!input.revision || !Number.isFinite(Date.parse(input.revision)))
      return { ok: false, error: "Reload this draft before saving." };
    const revision = new Date();
    const result = await prisma.newsletterCampaign.updateMany({
      where: {
        id: input.id,
        instructorId: instructor.id,
        status: "DRAFT",
        updatedAt: new Date(input.revision),
      },
      data: { ...data, updatedAt: revision },
    });
    if (!result.count)
      return {
        ok: false,
        error: "This draft changed or has already been sent. Reload it before continuing.",
      };
    revalidatePath("/dashboard/newsletter");
    return { ok: true, id: input.id, revision: revision.toISOString() };
  }
  const draft = await prisma.newsletterCampaign.create({
    data: { ...data, instructorId: instructor.id, status: "DRAFT" },
  });
  revalidatePath("/dashboard/newsletter");
  return { ok: true, id: draft.id, revision: draft.updatedAt.toISOString() };
}

export async function previewNewsletter(
  input: NewsletterContentInput,
): Promise<{ ok: true; html: string } | { ok: false; error: string }> {
  const instructor = await requireInstructor();
  const parsed = sendableSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Check your message." };
  try {
    const bodyHtml = await renderNewsletterBody(parsed.data, instructor);
    const email = buildNewsletterEmail({
      to: instructor.email,
      subject: parsed.data.subject,
      bodyHtml,
      instructorName: instructor.name,
      unsubscribeUrl: "#unsubscribe-preview",
    });
    return { ok: true, html: email.html };
  } catch (error) {
    return { ok: false, error: errorMessage(error) };
  }
}

export async function sendNewsletterTest(
  input: NewsletterContentInput,
): Promise<{ ok: true; email: string } | { ok: false; error: string }> {
  const instructor = await requireInstructor();
  const blocked = newsletterSendError(instructor);
  if (blocked) return { ok: false, error: blocked };
  const parsed = sendableSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Check your message." };
  try {
    const body = await renderNewsletterBody(parsed.data, instructor);
    const email = buildNewsletterEmail({
      to: instructor.email,
      subject: `[Test] ${parsed.data.subject}`,
      bodyHtml: `<p><strong>Test email — only you received this.</strong></p>${body}`,
      instructorName: instructor.name,
      unsubscribeUrl: `${siteUrl}/dashboard/newsletter`,
    });
    const result = await sendNewsletterBatch([email]);
    if (result.sent !== 1)
      return { ok: false, error: "The test email could not be sent. Please try again." };
    return { ok: true, email: instructor.email };
  } catch (error) {
    return { ok: false, error: errorMessage(error) };
  }
}

export async function sendNewsletterCampaign(input: {
  id: string;
  revision: string;
}): Promise<{ ok: true; sent: number; failed: number } | { ok: false; error: string }> {
  const instructor = await requireInstructor();
  const blocked = newsletterSendError(instructor);
  if (blocked) return { ok: false, error: blocked };
  const draft = await prisma.newsletterCampaign.findFirst({
    where: { id: input.id, instructorId: instructor.id, status: "DRAFT" },
  });
  if (!draft || draft.updatedAt.toISOString() !== input.revision)
    return {
      ok: false,
      error: "This draft changed or has already been sent. Save the latest version and try again.",
    };
  const parsed = sendableSchema.safeParse({
    subject: draft.subject,
    ...readNewsletterContent(draft.bodyHtml),
  });
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Check your message." };
  let bodyHtml: string;
  try {
    bodyHtml = await renderNewsletterBody(parsed.data, instructor);
  } catch (error) {
    return { ok: false, error: errorMessage(error) };
  }
  const subscribers = await prisma.newsletterSubscriber.findMany({
    where: {
      instructorId: instructor.id,
      status: "SUBSCRIBED",
      source: { in: NEWSLETTER_CONSENT_SOURCES },
    },
    select: { email: true, unsubscribeToken: true },
  });
  if (!subscribers.length)
    return { ok: false, error: "You don't have any subscribed recipients yet." };

  // Serialize campaign claims per instructor, so concurrent requests cannot send two campaigns.
  const claimed = await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT "id" FROM "Instructor" WHERE "id" = ${instructor.id} FOR UPDATE`;
    const sending = await tx.newsletterCampaign.findFirst({
      where: { instructorId: instructor.id, status: "SENDING" },
    });
    if (sending) return false;
    const result = await tx.newsletterCampaign.updateMany({
      where: {
        id: draft.id,
        instructorId: instructor.id,
        status: "DRAFT",
        updatedAt: draft.updatedAt,
      },
      data: { status: "SENDING", recipientCount: subscribers.length },
    });
    return result.count === 1;
  });
  if (!claimed)
    return {
      ok: false,
      error: "A campaign is already sending or this draft changed. Refresh before trying again.",
    };
  try {
    const emails = subscribers.map((subscriber) =>
      buildNewsletterEmail({
        to: subscriber.email,
        subject: draft.subject,
        bodyHtml,
        instructorName: instructor.name,
        unsubscribeUrl: `${siteUrl}/unsubscribe?token=${subscriber.unsubscribeToken}`,
      }),
    );
    const { sent, failed } = await sendNewsletterBatch(emails);
    await prisma.newsletterCampaign.update({
      where: { id: draft.id },
      data: {
        status: failed > 0 ? "FAILED" : "SENT",
        sentAt: new Date(),
        sentCount: sent,
        failedCount: failed,
        errorMessage: failed
          ? `${failed} emails were not sent. ${sent} were accepted by the email provider.`
          : null,
      },
    });
    revalidatePath("/dashboard/newsletter");
    return { ok: true, sent, failed };
  } catch (error) {
    await prisma.newsletterCampaign.update({
      where: { id: draft.id },
      data: { status: "FAILED", errorMessage: errorMessage(error) },
    });
    revalidatePath("/dashboard/newsletter");
    return {
      ok: false,
      error: "The campaign could not be completed. Check campaign history before trying again.",
    };
  }
}
