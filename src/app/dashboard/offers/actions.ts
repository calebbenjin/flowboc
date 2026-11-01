"use server";
import { needsPayoutSetup } from "@/lib/payout-setup";
import { canUseProOffers } from "@/lib/offer-access";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireInstructor } from "@/lib/require-instructor";
type ActionResult = { ok: true } | { ok: false; error: string };
export async function updateVideoCallOffer(input: {
  enabled: boolean;
  title?: string;
  description?: string;
  imageUrl?: string | null;
  price?: number | null;
  meetingLink?: string;
}): Promise<ActionResult> {
  const instructor = await requireInstructor();
  if (!canUseProOffers(instructor))
    return {
      ok: false,
      error: "An active Pro plan is required for consultation and ebook offers.",
    };
  if (needsPayoutSetup(instructor, input.price ?? 0, input.enabled))
    return { ok: false, error: "Connect your payout account before enabling a paid offer." };
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

  revalidatePath("/dashboard/offers");
  revalidatePath("/dashboard");
  revalidatePath(`/${instructor.slug}`);
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
  if (!canUseProOffers(instructor))
    return {
      ok: false,
      error: "An active Pro plan is required for consultation and ebook offers.",
    };
  if (needsPayoutSetup(instructor, input.price ?? 0, input.enabled))
    return { ok: false, error: "Connect your payout account before enabling a paid offer." };
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

  revalidatePath("/dashboard/offers");
  revalidatePath("/dashboard");
  revalidatePath(`/${instructor.slug}`);
  return { ok: true };
}
