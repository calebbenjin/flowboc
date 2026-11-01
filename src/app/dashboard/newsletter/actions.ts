"use server";

import { revalidatePath } from "next/cache";
import { canUseNewsletter } from "@/lib/newsletter/access";
import { prisma } from "@/lib/db";
import { requireInstructor } from "@/lib/require-instructor";

type ActionResult = { ok: true } | { ok: false; error: string };

export async function deleteSubscriber(id: string): Promise<ActionResult> {
  const instructor = await requireInstructor();

  const result = await prisma.newsletterSubscriber.deleteMany({
    where: { id, instructorId: instructor.id },
  });
  if (result.count === 0) return { ok: false, error: "Subscriber not found." };

  return { ok: true };
}

export async function unsubscribeManually(id: string): Promise<ActionResult> {
  const instructor = await requireInstructor();

  const result = await prisma.newsletterSubscriber.updateMany({
    where: { id, instructorId: instructor.id },
    data: { status: "UNSUBSCRIBED", unsubscribedAt: new Date() },
  });
  if (result.count === 0) return { ok: false, error: "Subscriber not found." };

  return { ok: true };
}

export async function setNewsletterVisibility(enabled: boolean): Promise<ActionResult> {
  if (typeof enabled !== "boolean")
    return { ok: false, error: "Choose whether to show the newsletter button." };
  const instructor = await requireInstructor();
  if (!canUseNewsletter(instructor))
    return {
      ok: false,
      error: "An active Pro plan is required to show the newsletter signup button.",
    };
  await prisma.instructor.update({
    where: { id: instructor.id },
    data: { newsletterEnabled: enabled },
  });
  revalidatePath(`/${instructor.slug}`);
  revalidatePath("/dashboard/newsletter");
  revalidatePath("/dashboard/booking-page");
  return { ok: true };
}
