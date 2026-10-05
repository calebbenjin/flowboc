"use server";

import { randomBytes } from "node:crypto";
import { headers } from "next/headers";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { sendVideoCallBookingEmail, sendInstructorNewVideoCallBookingEmail } from "@/lib/email";

type ActionResult = { ok: true } | { ok: false; error: string };

export async function joinWaitlist(input: {
  slug: string;
  classId: string;
  name: string;
  email: string;
}): Promise<ActionResult> {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();

  if (!name || !email) {
    return { ok: false, error: "Please enter your name and email." };
  }

  const cls = await prisma.yogaClass.findUnique({
    where: { id: input.classId },
    include: { instructor: { select: { slug: true } } },
  });

  if (!cls || cls.instructor.slug !== input.slug) {
    return { ok: false, error: "This class could not be found." };
  }

  await prisma.waitlistEntry.upsert({
    where: { classId_email: { classId: cls.id, email } },
    create: { classId: cls.id, name, email },
    update: { name },
  });

  return { ok: true };
}

const newsletterSchema = z.object({
  slug: z.string().trim().min(1),
  email: z.string().trim().email("Please enter a valid email."),
  name: z.string().trim().max(200).optional(),
  website: z.string().optional(), // honeypot — real users never fill this
});

const NEWSLETTER_RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const NEWSLETTER_RATE_LIMIT_MAX_PER_WINDOW = 5;

async function getClientIp(): Promise<string | null> {
  const h = await headers();
  const forwardedFor = h.get("x-forwarded-for");
  return forwardedFor?.split(",")[0]?.trim() ?? null;
}

export async function subscribeToNewsletter(input: {
  slug: string;
  email: string;
  name?: string;
  website?: string;
}): Promise<ActionResult> {
  const parsed = newsletterSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check your details." };
  }

  // Honeypot tripped — pretend success so bots don't learn to avoid it.
  if (parsed.data.website) return { ok: true };

  const email = parsed.data.email.toLowerCase();
  const name = parsed.data.name || null;

  const instructor = await prisma.instructor.findUnique({
    where: { slug: parsed.data.slug },
    select: { id: true },
  });
  if (!instructor) return { ok: false, error: "This page could not be found." };

  const ip = await getClientIp();
  const since = new Date(Date.now() - NEWSLETTER_RATE_LIMIT_WINDOW_MS);
  const recentCount = await prisma.newsletterSubscriber.count({
    where: {
      createdAt: { gte: since },
      OR: [{ email }, ...(ip ? [{ ip }] : [])],
    },
  });
  if (recentCount >= NEWSLETTER_RATE_LIMIT_MAX_PER_WINDOW) {
    return {
      ok: false,
      error: "You've signed up a few times already — please wait a bit before trying again.",
    };
  }

  await prisma.newsletterSubscriber.upsert({
    where: { instructorId_email: { instructorId: instructor.id, email } },
    create: {
      instructorId: instructor.id,
      email,
      name,
      ip,
      source: "public_signup_form",
      unsubscribeToken: randomBytes(24).toString("hex"),
    },
    update: { status: "SUBSCRIBED", unsubscribedAt: null, ...(name ? { name } : {}) },
  });

  return { ok: true };
}

const videoCallSchema = z.object({
  slug: z.string().trim().min(1),
  name: z.string().trim().min(1, "Please enter your name.").max(200),
  email: z.string().trim().email("Please enter a valid email."),
  website: z.string().optional(), // honeypot — real users never fill this
});

const VIDEO_CALL_RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;
const VIDEO_CALL_RATE_LIMIT_MAX_PER_WINDOW = 3;

type BookVideoCallResult = ActionResult | { ok: true; meetingLink: string };

export async function bookVideoCall(input: {
  slug: string;
  name: string;
  email: string;
  website?: string;
}): Promise<BookVideoCallResult> {
  const parsed = videoCallSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check your details." };
  }

  // Honeypot tripped — pretend success so bots don't learn to avoid it.
  if (parsed.data.website) return { ok: true };

  const name = parsed.data.name;
  const email = parsed.data.email.toLowerCase();

  const instructor = await prisma.instructor.findUnique({
    where: { slug: parsed.data.slug },
    select: {
      id: true,
      name: true,
      email: true,
      videoCallEnabled: true,
      videoCallTitle: true,
      videoCallPrice: true,
      consultationLink: true,
    },
  });
  if (!instructor) return { ok: false, error: "This page could not be found." };

  // Server-side enforcement that paid offers can never be booked — the UI
  // already disables this, but the real guard lives here since there's no
  // payment processing to actually charge for a priced offer yet.
  const meetingLink = instructor.consultationLink;
  if (!instructor.videoCallEnabled || !meetingLink || (instructor.videoCallPrice ?? 0) > 0) {
    return { ok: false, error: "This video call isn't available to book right now." };
  }

  const since = new Date(Date.now() - VIDEO_CALL_RATE_LIMIT_WINDOW_MS);
  const recentCount = await prisma.videoCallBooking.count({
    where: { instructorId: instructor.id, studentEmail: email, createdAt: { gte: since } },
  });
  if (recentCount >= VIDEO_CALL_RATE_LIMIT_MAX_PER_WINDOW) {
    return { ok: false, error: "You've already requested this — check your email." };
  }

  await prisma.videoCallBooking.create({
    data: { instructorId: instructor.id, studentName: name, studentEmail: email },
  });

  const offerTitle = instructor.videoCallTitle || "Video Call";

  await sendVideoCallBookingEmail({
    to: email,
    studentName: name,
    instructorName: instructor.name,
    offerTitle,
    meetingLink,
  }).catch((err) => console.error("Failed to send student video call email:", err));

  await sendInstructorNewVideoCallBookingEmail({
    to: instructor.email,
    studentName: name,
    studentEmail: email,
    offerTitle,
  }).catch((err) => console.error("Failed to send instructor video call notification:", err));

  return { ok: true, meetingLink };
}
