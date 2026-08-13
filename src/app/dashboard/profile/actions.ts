"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { payoutProviderForCurrency } from "@/lib/payout";
import { checkSlugAvailable } from "@/app/onboarding/actions";
import type { CurrencyCode, SocialPlatform } from "@/generated/prisma/enums";

type ActionResult = { ok: true } | { ok: false; error: string };

async function requireInstructor() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");
  const instructor = await prisma.instructor.findUnique({ where: { userId: session.user.id } });
  if (!instructor) throw new Error("No instructor profile for this account");
  return instructor;
}

export async function updateProfile(input: {
  name: string;
  location?: string;
  bio?: string;
  email: string;
  phone?: string;
  currency: CurrencyCode;
  slug: string;
  consultationLink?: string;
}): Promise<ActionResult> {
  const instructor = await requireInstructor();
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  const slug = input.slug.trim().toLowerCase();

  if (!name || !email) {
    return { ok: false, error: "Please provide a name and email." };
  }

  if (slug !== instructor.slug) {
    const slugCheck = await checkSlugAvailable(slug);
    if (!slugCheck.available) {
      return { ok: false, error: slugCheck.reason ?? "That link isn't available." };
    }
  }

  await prisma.instructor.update({
    where: { id: instructor.id },
    data: {
      name,
      email,
      slug,
      location: input.location?.trim() || null,
      bio: input.bio?.trim() || null,
      phone: input.phone?.trim() || null,
      currency: input.currency,
      payoutProvider: payoutProviderForCurrency(input.currency),
      consultationLink: input.consultationLink?.trim() || null,
    },
  });

  return { ok: true };
}

export async function updateSocials(
  handles: Partial<Record<SocialPlatform, string>>,
): Promise<ActionResult> {
  const instructor = await requireInstructor();

  await prisma.$transaction(
    Object.entries(handles).map(([platform, handle]) => {
      const trimmed = handle?.trim();
      const platformValue = platform as SocialPlatform;
      return trimmed
        ? prisma.instructorSocial.upsert({
            where: {
              instructorId_platform: { instructorId: instructor.id, platform: platformValue },
            },
            create: { instructorId: instructor.id, platform: platformValue, handle: trimmed },
            update: { handle: trimmed },
          })
        : prisma.instructorSocial.deleteMany({
            where: { instructorId: instructor.id, platform: platformValue },
          });
    }),
  );

  return { ok: true };
}

export async function updatePhoto(photoUrl: string): Promise<ActionResult> {
  const instructor = await requireInstructor();
  await prisma.instructor.update({ where: { id: instructor.id }, data: { photoUrl } });
  return { ok: true };
}

export async function deleteAccount(): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Not authenticated");

  // Cascades through Instructor -> InstructorSocial/classes/bookings via
  // onDelete: Cascade on each relation back to User.
  await prisma.user.delete({ where: { id: session.user.id } });
  return { ok: true };
}
