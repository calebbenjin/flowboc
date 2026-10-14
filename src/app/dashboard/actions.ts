"use server";

import { prisma } from "@/lib/db";
import { requireInstructor } from "@/lib/require-instructor";

export async function dismissChecklist(): Promise<{ ok: true }> {
  const instructor = await requireInstructor();
  await prisma.instructor.update({
    where: { id: instructor.id },
    data: { checklistDismissedAt: new Date() },
  });
  return { ok: true };
}
