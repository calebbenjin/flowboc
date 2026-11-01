import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { NEWSLETTER_CONSENT_SOURCES } from "@/lib/newsletter/consent";
import { prisma } from "@/lib/db";
import { getCurrentInstructor } from "@/lib/get-current-instructor";
import { readNewsletterContent } from "@/lib/newsletter/content";
import { ComposeClient } from "./compose-client";

export const metadata: Metadata = {
  title: "New campaign — Flowboc",
};

export default async function ComposePage({
  searchParams,
}: {
  searchParams: Promise<{ draft?: string }>;
}) {
  const instructor = await getCurrentInstructor();
  if (!instructor) redirect("/onboarding");

  const subscriberCount = await prisma.newsletterSubscriber.count({
    where: {
      instructorId: instructor.id,
      status: "SUBSCRIBED",
      source: { in: NEWSLETTER_CONSENT_SOURCES },
    },
  });

  const { draft: draftId } = await searchParams;
  const draft = draftId
    ? await prisma.newsletterCampaign.findFirst({
        where: { id: draftId, instructorId: instructor.id, status: "DRAFT" },
      })
    : null;
  if (draftId && !draft) notFound();
  const classes = await prisma.yogaClass.findMany({
    where: {
      instructorId: instructor.id,
      status: { in: ["PUBLISHED", "FULL"] },
      startAt: { gt: new Date() },
    },
    orderBy: { startAt: "asc" },
    select: {
      id: true,
      name: true,
      coverUrl: true,
      startAt: true,
      timezone: true,
      durationMinutes: true,
      price: true,
      mode: true,
      location: true,
    },
  });
  return (
    <ComposeClient
      key={draft?.id ?? "new"}
      subscriberCount={subscriberCount}
      classes={classes}
      initial={
        draft
          ? {
              id: draft.id,
              revision: draft.updatedAt.toISOString(),
              subject: draft.subject,
              ...readNewsletterContent(draft.bodyHtml),
            }
          : null
      }
    />
  );
}
