"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";
import { payoutProviderForCurrency } from "@/lib/payout";
import { requireInstructor } from "@/lib/require-instructor";
import { checkSlugAvailable } from "@/app/onboarding/actions";
import type { CurrencyCode, SocialPlatform } from "@/generated/prisma/enums";

type ActionResult = { ok: true } | { ok: false; error: string };

export async function updateProfile(input: {
  name: string;
  location?: string;
  bio?: string;
  email: string;
  phone?: string;
  currency: CurrencyCode;
  slug: string;
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

  try {
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
      },
    });
  } catch (err) {
    // checkSlugAvailable above can't close the gap to this write by itself —
    // another instructor claiming the same slug at the same instant hits the
    // unique constraint here instead of an unhandled 500.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { ok: false, error: "That link was just taken. Try another." };
    }
    throw err;
  }

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

export async function updateVideoCallOffer(input: {
  enabled: boolean;
  title?: string;
  description?: string;
  imageUrl?: string | null;
  price?: number | null;
  meetingLink?: string;
}): Promise<ActionResult> {
  const instructor = await requireInstructor();
  const meetingLink = input.meetingLink?.trim() || null;

  if (input.enabled && !meetingLink) {
    return { ok: false, error: "Add a meeting link before enabling the video call card." };
  }
  if (meetingLink && !/^https?:\/\//.test(meetingLink)) {
    return { ok: false, error: "Meeting link must start with http:// or https://." };
  }

  await prisma.instructor.update({
    where: { id: instructor.id },
    data: {
      videoCallEnabled: input.enabled,
      videoCallTitle: input.title?.trim() || null,
      videoCallDescription: input.description?.trim() || null,
      videoCallImageUrl: input.imageUrl || null,
      videoCallPrice: input.price ?? null,
      consultationLink: meetingLink,
    },
  });

  return { ok: true };
}

export async function updateEbookOffer(input: {
  enabled: boolean;
  title?: string;
  description?: string;
  coverUrl?: string | null;
  fileUrl?: string | null;
  price?: number | null;
}): Promise<ActionResult> {
  const instructor = await requireInstructor();
  const fileUrl = input.fileUrl?.trim() || null;

  if (input.enabled && !fileUrl) {
    return { ok: false, error: "Upload an ebook file before enabling the ebook card." };
  }

  await prisma.instructor.update({
    where: { id: instructor.id },
    data: {
      ebookEnabled: input.enabled,
      ebookTitle: input.title?.trim() || null,
      ebookDescription: input.description?.trim() || null,
      ebookCoverUrl: input.coverUrl || null,
      ebookFileUrl: fileUrl,
      ebookPrice: input.price ?? null,
    },
  });

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
