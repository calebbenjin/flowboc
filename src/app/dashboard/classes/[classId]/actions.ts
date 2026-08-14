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

  const confirmedCount = await prisma.booking.count({
    where: { classId, status: "CONFIRMED", paymentStatus: { in: ["PAID", "PENDING"] } },
  });
  if (confirmedCount >= cls.capacity) {
    return { ok: false, error: "This class is already full." };
  }

  const existing = await prisma.booking.findFirst({
    where: { classId, studentEmail: email, status: "CONFIRMED" },
  });
  if (existing) {
    return { ok: false, error: "This student is already booked into this class." };
  }

  await prisma.booking.create({
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

  const justFilled = cls.status === "PUBLISHED" && confirmedCount + 1 >= cls.capacity;
  if (justFilled) {
    await prisma.yogaClass.update({ where: { id: classId }, data: { status: "FULL" } });
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

  await prisma.booking.update({ where: { id: bookingId }, data: { status: "CANCELLED" } });

  // Cancelling frees a spot — flip a FULL class back to PUBLISHED. Actually
  // refunding the payment waits on the payments batch.
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
  const confirmedCount = await prisma.booking.count({
    where: { classId: cls.id, status: "CONFIRMED", paymentStatus: { in: ["PAID", "PENDING"] } },
  });
  if (confirmedCount >= cls.capacity) {
    return { ok: false, error: "This class is already full." };
  }

  await prisma.$transaction([
    prisma.booking.create({
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
    }),
    prisma.waitlistEntry.delete({ where: { id: entryId } }),
  ]);

  const justFilled = cls.status === "PUBLISHED" && confirmedCount + 1 >= cls.capacity;
  if (justFilled) {
    await prisma.yogaClass.update({ where: { id: cls.id }, data: { status: "FULL" } });
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
