"use server";

import { prisma } from "@/lib/db";
import { requireInstructor } from "@/lib/require-instructor";
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

  if (cls.status === "PUBLISHED" && confirmedCount + 1 >= cls.capacity) {
    await prisma.yogaClass.update({ where: { id: classId }, data: { status: "FULL" } });
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

  if (cls.status === "PUBLISHED" && confirmedCount + 1 >= cls.capacity) {
    await prisma.yogaClass.update({ where: { id: cls.id }, data: { status: "FULL" } });
  }

  return { ok: true };
}
