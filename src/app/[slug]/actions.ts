"use server";

import { randomBytes } from "node:crypto";
import { headers } from "next/headers";
import { z } from "zod";
import { prisma } from "@/lib/db";

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
