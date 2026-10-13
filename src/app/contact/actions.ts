"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { logAdminActivity } from "@/lib/admin-activity";
import { sendContactNotificationEmail } from "@/lib/email";

type ActionResult = { ok: true } | { ok: false; error: string };

const contactSchema = z.object({
  name: z.string().trim().min(1, "Please enter your name.").max(200),
  email: z.string().trim().email("Please enter a valid email."),
  subject: z.string().trim().max(200).optional(),
  message: z.string().trim().min(1, "Please enter a message.").max(5000),
});

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX_PER_WINDOW = 3;

// On Vercel, x-forwarded-for is set by the edge network from the real
// connecting client and isn't attacker-controllable the way it would be on
// an arbitrary self-hosted reverse proxy. x-real-ip is checked as a fallback
// for the (rare) case the former is missing, so the rate limit doesn't
// silently degrade to email-only — which the submitter does control — when
// an IP is available under a different header.
async function getClientIp(): Promise<string | null> {
  const h = await headers();
  const forwardedFor = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwardedFor || h.get("x-real-ip")?.trim() || null;
}

export async function submitContactForm(input: {
  name: string;
  email: string;
  subject?: string;
  message: string;
}): Promise<ActionResult> {
  const parsed = contactSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check your details." };
  }
  const { name, email, subject, message } = parsed.data;

  const ip = await getClientIp();
  const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MS);
  const recentCount = await prisma.contactMessage.count({
    where: {
      createdAt: { gte: since },
      OR: [{ email }, ...(ip ? [{ ip }] : [])],
    },
  });
  if (recentCount >= RATE_LIMIT_MAX_PER_WINDOW) {
    return {
      ok: false,
      error: "You've sent a few messages already — please wait a bit before sending another.",
    };
  }

  await prisma.contactMessage.create({
    data: { name, email, subject: subject || null, message, ip },
  });

  await logAdminActivity({
    type: "CONTACT_MESSAGE",
    message: `${name} sent a contact message`,
  });

  try {
    await sendContactNotificationEmail({ name, email, subject: subject || null, message });
  } catch (err) {
    // The message is already stored — don't fail the user's submission
    // over a transient email-provider issue.
    console.error("Failed to send contact notification email:", err);
  }

  return { ok: true };
}
