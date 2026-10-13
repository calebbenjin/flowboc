import { prisma } from "@/lib/db";
import type { AdminEventType } from "@/generated/prisma/enums";

export async function logAdminActivity(input: {
  type: AdminEventType;
  message: string;
  instructorId?: string;
}): Promise<void> {
  await prisma.adminActivityEvent.create({
    data: { type: input.type, message: input.message, instructorId: input.instructorId ?? null },
  });
}
