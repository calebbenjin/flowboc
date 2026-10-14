"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";
import { logAdminActivity } from "@/lib/admin-activity";
import { payoutProviderForCurrency } from "@/lib/payout";
import { consumeReferralCode, generateReferralCode } from "@/lib/referral-code";
import { isReservedSlug, isValidSlugFormat } from "@/lib/reserved-slugs";
import { slugify } from "@/lib/slug";
import { newTrialEndsAt } from "@/lib/trial";
import type { CurrencyCode } from "@/generated/prisma/enums";

// Referral attribution only makes sense the moment an Instructor is first
// created — clears the code either way so it can't be consumed twice or
// linger on the User row.
async function consumePendingReferral(
  userId: string,
  instructorId: string,
  pendingCode: string | null,
) {
  if (!pendingCode) return;
  await consumeReferralCode(instructorId, pendingCode);
  await prisma.user.update({ where: { id: userId }, data: { pendingReferralCode: null } });
}

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

  let user;
  try {
    user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      return { ok: false, error: "Your session has expired. Please sign in again." };
    }
    throw err;
  }

  const payoutProvider = payoutProviderForCurrency(input.currency);
  const existingInstructor = await prisma.instructor.findUnique({ where: { userId } });

  let instructor;
  try {
    instructor = existingInstructor
      ? await prisma.instructor.update({
          where: { userId },
          data: {
            name,
            slug,
            location: input.location?.trim() || null,
            bio: input.bio?.trim() || null,
            phone: input.phone?.trim() || null,
            specialties: input.specialties,
            currency: input.currency,
            payoutProvider,
          },
        })
      : await prisma.instructor.create({
          data: {
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
            trialEndsAt: newTrialEndsAt(),
            referralCode: await generateReferralCode(name),
          },
        });
  } catch (err) {
    // checkSlugAvailable above can't close the gap to this write by itself —
    // two submissions landing on the same slug at the same instant both pass
    // that check; the loser hits the unique constraint here instead of
    // throwing an unhandled 500.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { ok: false, error: "That link was just taken. Try another." };
    }
    throw err;
  }

  if (!existingInstructor) {
    await consumePendingReferral(userId, instructor.id, user.pendingReferralCode);
    await logAdminActivity({
      type: "INSTRUCTOR_SIGNED_UP",
      message: `${instructor.name} signed up`,
      instructorId: instructor.id,
    });
  }

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

  let user;
  try {
    user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      return { ok: false, error: "Your session has expired. Please sign in again." };
    }
    throw err;
  }

  const base = slugify(user.name || user.email.split("@")[0] || "instructor");
  let slug = base;
  let suffix = 1;
  while (await prisma.instructor.findUnique({ where: { slug } })) {
    slug = `${base}-${suffix++}`;
  }

  const name = user.name || "Instructor";
  let instructor;
  try {
    instructor = await prisma.instructor.create({
      data: {
        userId,
        name,
        slug,
        email: user.email,
        currency: "NGN",
        payoutProvider: payoutProviderForCurrency("NGN"),
        onboardingCompletedAt: new Date(),
        trialEndsAt: newTrialEndsAt(),
        referralCode: await generateReferralCode(name),
      },
    });
  } catch (err) {
    // Same slug TOCTOU as saveProfile above — the suggestion loop checks
    // availability before this create, which another concurrent onboarding
    // completion can still beat.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { ok: false, error: "That link was just taken. Please try onboarding again." };
    }
    throw err;
  }

  await consumePendingReferral(userId, instructor.id, user.pendingReferralCode);
  await logAdminActivity({
    type: "INSTRUCTOR_SIGNED_UP",
    message: `${instructor.name} signed up`,
    instructorId: instructor.id,
  });

  return { ok: true };
}
