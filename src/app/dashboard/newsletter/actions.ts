"use server";

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
