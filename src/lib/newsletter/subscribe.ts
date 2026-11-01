import { randomBytes } from "node:crypto";
import type { Prisma } from "@/generated/prisma/client";

// Consent is given when submitting checkout, independently of payment completion.
// Run within the checkout transaction so rejected checkouts do not create subscribers.
export async function recordCheckoutNewsletterConsent(
  tx: Pick<Prisma.TransactionClient, "newsletterSubscriber">,
  input: {
    instructorId: string;
    email: string;
    name: string;
    newsletterOptIn?: boolean;
    source: "class_checkout" | "ebook_checkout" | "video_call_checkout";
  },
): Promise<void> {
  if (input.newsletterOptIn !== true) return;
  const email = input.email.trim().toLowerCase();
  await tx.newsletterSubscriber.upsert({
    where: { instructorId_email: { instructorId: input.instructorId, email } },
    create: {
      instructorId: input.instructorId,
      email,
      name: input.name.trim(),
      source: input.source,
      status: "SUBSCRIBED",
      unsubscribeToken: randomBytes(24).toString("hex"),
    },
    // A fresh, explicit opt-in may re-subscribe; an unchecked box never changes status.
    update: {
      name: input.name.trim(),
      source: input.source,
      status: "SUBSCRIBED",
      subscribedAt: new Date(),
      unsubscribedAt: null,
    },
  });
}
