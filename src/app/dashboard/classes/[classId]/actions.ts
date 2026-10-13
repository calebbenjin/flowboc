"use server";

import { prisma } from "@/lib/db";
import { requireInstructor } from "@/lib/require-instructor";
import { siteUrl } from "@/lib/site";
import {
  sendBookingConfirmationEmail,
  sendCancellationEmail,
  sendCapacityReachedEmail,
  sendInstructorNewBookingEmail,
  sendWaitlistSpotOpenEmail,
} from "@/lib/email";
import type { PaymentStatus } from "@/generated/prisma/enums";

type ActionResult = { ok: true } | { ok: false; error: string };

class ManualActionError extends Error {}

async function requireOwnedClass(classId: string) {
  const instructor = await requireInstructor();
  const cls = await prisma.yogaClass.findUnique({ where: { id: classId } });
  if (!cls || cls.instructorId !== instructor.id) throw new Error("Class not found");
  return { instructor, cls };
}

export async function addStudentManually(
  classId: string,
  input: { studentName: string; studentEmail: string; studentPhone?: string; paid: boolean },
): Promise<ActionResult> {
  const { instructor, cls } = await requireOwnedClass(classId);
  const name = input.studentName.trim();
  const email = input.studentEmail.trim().toLowerCase();

  if (!name || !email) {
    return { ok: false, error: "Please enter a name and email." };
  }
  if (cls.status === "CANCELLED" || cls.status === "COMPLETED") {
    return { ok: false, error: "This class is no longer open for booking." };
  }

  let justFilled = false;
  try {
    await prisma.$transaction(async (tx) => {
      // Serializes concurrent adds for this class — see createBookingIntent
      // in src/app/[slug]/book/[classId]/actions.ts for the same pattern.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${classId}))`;

      const confirmedCount = await tx.booking.count({
        where: { classId, status: "CONFIRMED", paymentStatus: { in: ["PAID", "PENDING"] } },
      });
      if (confirmedCount >= cls.capacity) {
        throw new ManualActionError("This class is already full.");
      }

      const existing = await tx.booking.findFirst({
        where: { classId, studentEmail: email, status: "CONFIRMED" },
      });
      if (existing) {
        throw new ManualActionError("This student is already booked into this class.");
      }

      await tx.booking.create({
        data: {
          classId,
          instructorId: instructor.id,
          studentName: name,
          studentEmail: email,
          studentPhone: input.studentPhone?.trim() || null,
          status: "CONFIRMED",
          paymentStatus: (input.paid ? "PAID" : "PENDING") satisfies PaymentStatus,
          amount: cls.price,
          currency: instructor.currency,
          source: "MANUAL",
        },
      });

      justFilled = cls.status === "PUBLISHED" && confirmedCount + 1 >= cls.capacity;
      if (justFilled) {
        await tx.yogaClass.update({ where: { id: classId }, data: { status: "FULL" } });
      }
    });
  } catch (err) {
    if (err instanceof ManualActionError) return { ok: false, error: err.message };
    throw err;
  }

  await sendBookingConfirmationEmail({
    to: email,
    studentName: name,
    className: cls.name,
    startAt: cls.startAt,
    timezone: cls.timezone,
    location: cls.location,
    instructorName: instructor.name,
  }).catch((err: unknown) => console.error("Failed to send manual-booking confirmation:", err));

  if (justFilled) {
    await sendCapacityReachedEmail({
      to: instructor.email,
      className: cls.name,
      startAt: cls.startAt,
      timezone: cls.timezone,
      capacity: cls.capacity,
    }).catch((err: unknown) => console.error("Failed to send capacity-reached notice:", err));
  }

  return { ok: true };
}

export async function markAttendance(bookingId: string, attended: boolean): Promise<ActionResult> {
  const instructor = await requireInstructor();
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking || booking.instructorId !== instructor.id) throw new Error("Booking not found");

  await prisma.booking.update({ where: { id: bookingId }, data: { attended } });
  return { ok: true };
}

export async function cancelBooking(bookingId: string): Promise<ActionResult> {
  const instructor = await requireInstructor();
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking || booking.instructorId !== instructor.id) throw new Error("Booking not found");

  await prisma.booking.update({
    where: { id: bookingId },
    data: {
      status: "CANCELLED",
      // Mark it for refund tracking — this doesn't call Paystack's refund
      // API, just records that money was taken for a booking that no longer
      // stands, so revenue/payout views stop showing it as a clean PAID sale.
      paymentStatus: booking.paymentStatus === "PAID" ? "REFUNDED" : booking.paymentStatus,
    },
  });

  // Cancelling frees a spot — flip a FULL class back to PUBLISHED.
  const cls = await prisma.yogaClass.findUnique({ where: { id: booking.classId } });
  if (cls?.status === "FULL") {
    await prisma.yogaClass.update({ where: { id: cls.id }, data: { status: "PUBLISHED" } });
  }

  if (cls) {
    await sendCancellationEmail({
      to: booking.studentEmail,
      studentName: booking.studentName,
      className: cls.name,
      instructorName: instructor.name,
      startAt: cls.startAt,
      timezone: cls.timezone,
    }).catch((err: unknown) => console.error("Failed to send booking-cancellation email:", err));

    // Waitlist notify-on-opening: email only, no auto-promotion — the
    // instructor still moves someone over manually.
    const nextWaiting = await prisma.waitlistEntry.findFirst({
      where: { classId: cls.id, notifiedAt: null },
      orderBy: { joinedAt: "asc" },
    });
    if (nextWaiting) {
      await sendWaitlistSpotOpenEmail({
        to: nextWaiting.email,
        name: nextWaiting.name,
        className: cls.name,
        startAt: cls.startAt,
        timezone: cls.timezone,
        bookUrl: `${siteUrl}/${instructor.slug}`,
      }).catch((err: unknown) => console.error("Failed to send waitlist spot-open email:", err));
      await prisma.waitlistEntry.update({
        where: { id: nextWaiting.id },
        data: { notifiedAt: new Date() },
      });
    }
  }

  return { ok: true };
}

export async function promoteWaitlistEntry(entryId: string): Promise<ActionResult> {
  const instructor = await requireInstructor();
  const entry = await prisma.waitlistEntry.findUnique({
    where: { id: entryId },
    include: { class: true },
  });
  if (!entry || entry.class.instructorId !== instructor.id) {
    throw new Error("Waitlist entry not found");
  }

  const cls = entry.class;
  if (cls.status === "CANCELLED" || cls.status === "COMPLETED") {
    return { ok: false, error: "This class is no longer open for booking." };
  }

  let justFilled = false;
  try {
    await prisma.$transaction(async (tx) => {
      // Serializes concurrent promotions/bookings for this class — see
      // createBookingIntent in src/app/[slug]/book/[classId]/actions.ts.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${cls.id}))`;

      // Re-check the entry hasn't already been promoted/removed by a
      // concurrent call while we were waiting on the lock.
      const stillWaiting = await tx.waitlistEntry.findUnique({ where: { id: entryId } });
      if (!stillWaiting) {
        throw new ManualActionError("This waitlist entry has already been handled.");
      }

      const confirmedCount = await tx.booking.count({
        where: { classId: cls.id, status: "CONFIRMED", paymentStatus: { in: ["PAID", "PENDING"] } },
      });
      if (confirmedCount >= cls.capacity) {
        throw new ManualActionError("This class is already full.");
      }

      await tx.booking.create({
        data: {
          classId: cls.id,
          instructorId: instructor.id,
          studentName: entry.name,
          studentEmail: entry.email,
          status: "CONFIRMED",
          paymentStatus: "PENDING",
          amount: cls.price,
          currency: instructor.currency,
          source: "MANUAL",
        },
      });
      await tx.waitlistEntry.delete({ where: { id: entryId } });

      justFilled = cls.status === "PUBLISHED" && confirmedCount + 1 >= cls.capacity;
      if (justFilled) {
        await tx.yogaClass.update({ where: { id: cls.id }, data: { status: "FULL" } });
      }
    });
  } catch (err) {
    if (err instanceof ManualActionError) return { ok: false, error: err.message };
    throw err;
  }

  await sendBookingConfirmationEmail({
    to: entry.email,
    studentName: entry.name,
    className: cls.name,
    startAt: cls.startAt,
    timezone: cls.timezone,
    location: cls.location,
    instructorName: instructor.name,
  }).catch((err: unknown) => console.error("Failed to send waitlist-promotion confirmation:", err));

  await sendInstructorNewBookingEmail({
    to: instructor.email,
    studentName: entry.name,
    className: cls.name,
    startAt: cls.startAt,
    timezone: cls.timezone,
  }).catch((err: unknown) => console.error("Failed to send instructor new-booking notice:", err));

  return { ok: true };
}
