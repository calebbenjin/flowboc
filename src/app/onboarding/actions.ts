"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { payoutProviderForCurrency } from "@/lib/payout";
import { isReservedSlug, isValidSlugFormat } from "@/lib/reserved-slugs";
import { slugify } from "@/lib/slug";
import type { CurrencyCode } from "@/generated/prisma/enums";

type ActionResult = { ok: true } | { ok: false; error: string };

async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  return session.user.id;
}

export async function checkSlugAvailable(
  slug: string,
): Promise<{ available: boolean; reason?: string }> {
  const normalized = slug.trim().toLowerCase();

  if (!isValidSlugFormat(normalized)) {
    return { available: false, reason: "Use lowercase letters, numbers and hyphens only." };
  }
  if (isReservedSlug(normalized)) {
    return { available: false, reason: "This link is reserved. Try something else." };
  }

  const userId = await requireUserId();
  const existing = await prisma.instructor.findUnique({ where: { slug: normalized } });
  if (existing && existing.userId !== userId) {
    return { available: false, reason: "This link is already taken." };
  }

  return { available: true };
}

export async function saveProfile(input: {
  name: string;
  location?: string;
  bio?: string;
  phone?: string;
  instagramHandle?: string;
  specialties: string[];
  slug: string;
  currency: CurrencyCode;
}): Promise<ActionResult> {
  const userId = await requireUserId();
  const name = input.name.trim();
  const slug = input.slug.trim().toLowerCase();

  if (!name) {
    return { ok: false, error: "Please enter a display name." };
  }

  const slugCheck = await checkSlugAvailable(slug);
  if (!slugCheck.available) {
    return { ok: false, error: slugCheck.reason ?? "That link isn't available." };
  }

  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const payoutProvider = payoutProviderForCurrency(input.currency);

  const instructor = await prisma.instructor.upsert({
    where: { userId },
    create: {
      userId,
      name,
      slug,
      email: user.email,
      location: input.location?.trim() || null,
      bio: input.bio?.trim() || null,
      phone: input.phone?.trim() || null,
      specialties: input.specialties,
      currency: input.currency,
      payoutProvider,
    },
    update: {
      name,
      slug,
      location: input.location?.trim() || null,
      bio: input.bio?.trim() || null,
      phone: input.phone?.trim() || null,
      specialties: input.specialties,
      currency: input.currency,
      payoutProvider,
    },
  });

  const instagramHandle = input.instagramHandle?.trim();
  if (instagramHandle) {
    await prisma.instructorSocial.upsert({
      where: { instructorId_platform: { instructorId: instructor.id, platform: "INSTAGRAM" } },
      create: { instructorId: instructor.id, platform: "INSTAGRAM", handle: instagramHandle },
      update: { handle: instagramHandle },
    });
  }

  return { ok: true };
}

// Fires once the wizard reaches its final ("done") step — after the profile
// step and whatever happened on the payout step (connected or skipped).
export async function completeOnboarding(): Promise<ActionResult> {
  const userId = await requireUserId();
  await prisma.instructor.update({
    where: { userId },
    data: { onboardingCompletedAt: new Date() },
  });
  return { ok: true };
}

// "Skip for now" on the profile step bypasses both steps entirely. An
// Instructor row still has to exist (the dashboard and middleware's
// onboarding gate both depend on one), so this creates a minimal one from
// the account's name/email rather than leaving the user stuck in a redirect
// loop back to /onboarding.
export async function skipOnboarding(): Promise<ActionResult> {
  const userId = await requireUserId();

  const existing = await prisma.instructor.findUnique({ where: { userId } });
  if (existing) {
    await prisma.instructor.update({
      where: { userId },
      data: { onboardingCompletedAt: new Date() },
    });
    return { ok: true };
  }

  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const base = slugify(user.name || user.email.split("@")[0] || "instructor");
  let slug = base;
  let suffix = 1;
  while (await prisma.instructor.findUnique({ where: { slug } })) {
    slug = `${base}-${suffix++}`;
  }

  await prisma.instructor.create({
    data: {
      userId,
      name: user.name || "Instructor",
      slug,
      email: user.email,
      currency: "NGN",
      payoutProvider: payoutProviderForCurrency("NGN"),
      onboardingCompletedAt: new Date(),
    },
  });

  return { ok: true };
}
