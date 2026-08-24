"use server";

import { prisma } from "@/lib/db";
import {
  sendBookingConfirmationEmail,
  sendCapacityReachedEmail,
  sendInstructorNewBookingEmail,
} from "@/lib/email";
import { isTrialExpired } from "@/lib/trial";

type ActionResult = { ok: true; bookingId: string } | { ok: false; error: string };

class BookingError extends Error {}

const RESERVATION_HOLD_MS = 15 * 60 * 1000;

export async function createBookingIntent(input: {
  slug: string;
  classId: string;
  studentName: string;
  studentEmail: string;
  studentPhone: string;
  emergencyContact?: string;
  notes?: string;
}): Promise<ActionResult> {
  const name = input.studentName.trim();
  const email = input.studentEmail.trim().toLowerCase();
  const phone = input.studentPhone.trim();

  if (!name || !email || !phone) {
    return { ok: false, error: "Please fill in your name, email and phone number." };
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // Serializes concurrent booking attempts for this class so the
      // capacity check below can't race — two requests for the last spot
      // can't both read "1 remaining" and both succeed.
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${input.classId}))`;

      const cls = await tx.yogaClass.findUnique({
        where: { id: input.classId },
        include: {
          instructor: {
            select: {
              slug: true,
              currency: true,
              name: true,
              email: true,
              planStatus: true,
              trialEndsAt: true,
            },
          },
        },
      });

      if (!cls || cls.instructor.slug !== input.slug) {
        throw new BookingError("This class could not be found.");
      }
      if (cls.status !== "PUBLISHED" && cls.status !== "FULL") {
        throw new BookingError("This class is no longer open for booking.");
      }
      if (isTrialExpired(cls.instructor)) {
        throw new BookingError(
          "This instructor's trial has ended, so new bookings are paused. Please check back soon.",
        );
      }

      const deadline = new Date(cls.startAt.getTime() - cls.deadlineMinutesBeforeStart * 60_000);
      if (new Date() > deadline) {
        throw new BookingError("The booking window for this class has closed.");
      }

      const confirmedCount = await tx.booking.count({
        where: {
          classId: cls.id,
          status: "CONFIRMED",
          paymentStatus: { in: ["PAID", "PENDING"] },
        },
      });
      if (confirmedCount >= cls.capacity) {
        throw new BookingError("This class just filled up. Try joining the waitlist.");
      }

      const existing = await tx.booking.findFirst({
        where: { classId: cls.id, studentEmail: email, status: "CONFIRMED" },
      });
      if (existing) {
        throw new BookingError("You've already booked this class with this email.");
      }

      const booking = await tx.booking.create({
        data: {
          classId: cls.id,
          instructorId: cls.instructorId,
          studentName: name,
          studentEmail: email,
          studentPhone: phone,
          emergencyContact: input.emergencyContact?.trim() || null,
          notes: input.notes?.trim() || null,
          status: "CONFIRMED",
          paymentStatus: "PENDING",
          amount: cls.price,
          currency: cls.instructor.currency,
          source: "ONLINE",
          reservationExpiresAt: new Date(Date.now() + RESERVATION_HOLD_MS),
        },
      });

      const justFilled = cls.status === "PUBLISHED" && confirmedCount + 1 >= cls.capacity;
      if (justFilled) {
        await tx.yogaClass.update({ where: { id: cls.id }, data: { status: "FULL" } });
      }

      return { bookingId: booking.id, cls, justFilled };
    });

    const { bookingId, cls, justFilled } = result;

    // Fired after the transaction commits — email delivery is slow and
    // external, and shouldn't hold the advisory lock or booking row open.
    // Each send is independently caught: one recipient's address bouncing
    // (e.g. Resend's sandbox rejecting a non-whitelisted "to") shouldn't
    // skip the others.
    await sendBookingConfirmationEmail({
      to: email,
      studentName: name,
      className: cls.name,
      startAt: cls.startAt,
      timezone: cls.timezone,
      location: cls.location,
      instructorName: cls.instructor.name,
    }).catch((err: unknown) => console.error("Failed to send student booking confirmation:", err));

    await sendInstructorNewBookingEmail({
      to: cls.instructor.email,
      studentName: name,
      className: cls.name,
      startAt: cls.startAt,
      timezone: cls.timezone,
    }).catch((err: unknown) => console.error("Failed to send instructor new-booking notice:", err));

    if (justFilled) {
      await sendCapacityReachedEmail({
        to: cls.instructor.email,
        className: cls.name,
        startAt: cls.startAt,
        timezone: cls.timezone,
        capacity: cls.capacity,
      }).catch((err: unknown) => console.error("Failed to send capacity-reached notice:", err));
    }

    return { ok: true, bookingId };
  } catch (err) {
    if (err instanceof BookingError) return { ok: false, error: err.message };
    throw err;
  }
}
