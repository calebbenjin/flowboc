"use server";

import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireInstructor } from "@/lib/require-instructor";
import { buildNewsletterEmail, sendNewsletterBatch, stripHtml } from "@/lib/email";
import { siteUrl } from "@/lib/site";
import { syncSubscribersFromBookings } from "../queries";

type ActionResult = { ok: true; sent: number } | { ok: false; error: string };

const composeSchema = z.object({
  subject: z.string().trim().min(1, "Please enter a subject.").max(200),
  bodyHtml: z
    .string()
    .max(50000)
    .refine((html) => stripHtml(html).length > 0, "Please enter a message."),
});

export async function sendNewsletterCampaign(input: {
  subject: string;
  bodyHtml: string;
}): Promise<ActionResult> {
  const instructor = await requireInstructor();

  const parsed = composeSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check your details." };
  }
  const { subject, bodyHtml } = parsed.data;

  await syncSubscribersFromBookings(instructor.id);

  const subscribers = await prisma.newsletterSubscriber.findMany({
    where: { instructorId: instructor.id, status: "SUBSCRIBED" },
    select: { email: true, unsubscribeToken: true },
  });

  if (subscribers.length === 0) {
    return { ok: false, error: "You don't have any students or subscribers to send to yet." };
  }

  const campaign = await prisma.newsletterCampaign.create({
    data: {
      instructorId: instructor.id,
      subject,
      bodyHtml,
      status: "SENDING",
      recipientCount: subscribers.length,
    },
  });

  try {
    const emails = subscribers.map((s) =>
      buildNewsletterEmail({
        to: s.email,
        subject,
        bodyHtml,
        instructorName: instructor.name,
        unsubscribeUrl: `${siteUrl}/unsubscribe?token=${s.unsubscribeToken}`,
      }),
    );

    const { sent, failed } = await sendNewsletterBatch(emails);

    await prisma.newsletterCampaign.update({
      where: { id: campaign.id },
      data: { status: "SENT", sentAt: new Date(), sentCount: sent, failedCount: failed },
    });

    return { ok: true, sent };
  } catch (err) {
    await prisma.newsletterCampaign.update({
      where: { id: campaign.id },
      data: {
        status: "FAILED",
        errorMessage: err instanceof Error ? err.message : "Unknown error",
      },
    });
    return { ok: false, error: "Something went wrong sending your campaign. Please try again." };
  }
}
