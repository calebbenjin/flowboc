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

// Fires once per instructor, the moment their booking count first ticks up
// to a paid booking — the activation signal that matters for outreach: did
// this instructor actually get used, not just signed up. Idempotent by
// construction (only logs when the paid count is exactly 1) so callers on
// both booking-confirmation paths (free bookings, Paystack webhook) can call
// it without tracking "have I already logged this" themselves.
export async function recordFirstPaidBookingMilestone(instructorId: string): Promise<void> {
  const paidCount = await prisma.booking.count({
    where: { instructorId, status: "CONFIRMED", paymentStatus: "PAID" },
  });
  if (paidCount !== 1) return;

  const instructor = await prisma.instructor.findUnique({
    where: { id: instructorId },
    select: { name: true },
  });
  if (!instructor) return;

  await logAdminActivity({
    type: "INSTRUCTOR_FIRST_BOOKING",
    message: `${instructor.name} got their first booking`,
    instructorId,
  });
}
