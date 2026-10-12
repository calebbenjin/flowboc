"use server";

import { prisma } from "@/lib/db";
import {
  sendBookingConfirmationEmail,
  sendCapacityReachedEmail,
  sendInstructorNewBookingEmail,
} from "@/lib/email";
import { accessBlockedReason } from "@/lib/trial";
import { payoutProviderForCurrency } from "@/lib/payout";
import { initializeTransaction, verifyTransaction, PaystackError } from "@/lib/paystack";
import { siteUrl } from "@/lib/site";

type ActionResult = { ok: true; bookingId: string; isFree: boolean } | { ok: false; error: string };

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
              compedUntil: true,
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
      const blockedReason = accessBlockedReason(cls.instructor);
      if (blockedReason) {
        throw new BookingError(blockedReason);
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

      // Nothing to charge for a free class — skip straight to PAID so the
      // client never shows a payment step, and no reservation hold is
      // needed since there's no payment step to abandon.
      const isFree = cls.price === 0;

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
          paymentStatus: isFree ? "PAID" : "PENDING",
          amount: cls.price,
          currency: cls.instructor.currency,
          source: "ONLINE",
          reservationExpiresAt: isFree ? null : new Date(Date.now() + RESERVATION_HOLD_MS),
        },
      });

      const justFilled = cls.status === "PUBLISHED" && confirmedCount + 1 >= cls.capacity;
      if (justFilled) {
        await tx.yogaClass.update({ where: { id: cls.id }, data: { status: "FULL" } });
      }

      return { bookingId: booking.id, cls, justFilled, isFree };
    });

    const { bookingId, cls, justFilled, isFree } = result;

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

    return { ok: true, bookingId, isFree };
  } catch (err) {
    if (err instanceof BookingError) return { ok: false, error: err.message };
    throw err;
  }
}

type PaymentResult = { ok: true; authorizationUrl: string } | { ok: false; error: string };

export async function initiatePayment(bookingId: string): Promise<PaymentResult> {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      class: { include: { instructor: true } },
    },
  });

  if (!booking) return { ok: false, error: "This booking could not be found." };
  if (booking.paymentStatus === "PAID") {
    return { ok: false, error: "This booking has already been paid for." };
  }
  if (booking.status !== "CONFIRMED" || booking.paymentStatus !== "PENDING") {
    return { ok: false, error: "This booking is no longer available." };
  }
  if (booking.reservationExpiresAt && booking.reservationExpiresAt < new Date()) {
    return { ok: false, error: "Your reservation expired — please book again." };
  }

  const instructor = booking.class.instructor;

  if (payoutProviderForCurrency(instructor.currency) !== "PAYSTACK") {
    return { ok: false, error: "Payments for this currency aren't available yet." };
  }
  if (instructor.payoutStatus !== "CONNECTED" || !instructor.payoutAccountId) {
    return { ok: false, error: "This instructor hasn't finished setting up payments yet." };
  }

  try {
    const { authorizationUrl, reference } = await initializeTransaction({
      email: booking.studentEmail,
      amount: booking.amount,
      currency: instructor.currency,
      subaccount: instructor.payoutAccountId,
      callbackUrl: `${siteUrl}/${instructor.slug}/book/${booking.classId}`,
      metadata: { bookingId: booking.id, classId: booking.classId },
    });

    await prisma.booking.update({
      where: { id: booking.id },
      data: { paystackReference: reference },
    });

    return { ok: true, authorizationUrl };
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof PaystackError ? err.message : "Couldn't start payment. Please try again.",
    };
  }
}

// Paystack only appends ?reference= to the callback URL on a completed
// checkout — closing the widget or a declined attempt leaves the visitor
// back on this page with no signal at all. This lets the client recognize
// "that's actually my own still-valid reservation" rather than showing a
// false "class is full" dead end while the booking's hold is still active.
export async function checkResumableBooking(
  bookingId: string,
): Promise<{ ok: true; step: "payment" | "done" } | { ok: false }> {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) return { ok: false };

  if (booking.paymentStatus === "PAID") return { ok: true, step: "done" };

  if (
    booking.status === "CONFIRMED" &&
    booking.paymentStatus === "PENDING" &&
    booking.reservationExpiresAt &&
    booking.reservationExpiresAt > new Date()
  ) {
    return { ok: true, step: "payment" };
  }

  return { ok: false };
}

type VerifyResult =
  { ok: true; bookingId: string } | { ok: false; error: string; bookingId?: string };

export async function verifyPayment(reference: string): Promise<VerifyResult> {
  const booking = await prisma.booking.findUnique({ where: { paystackReference: reference } });
  if (!booking) return { ok: false, error: "This payment could not be found." };

  // Idempotent — the webhook may have already confirmed this before the
  // student's browser made it back from Paystack's checkout page.
  if (booking.paymentStatus === "PAID") {
    return { ok: true, bookingId: booking.id };
  }

  try {
    const result = await verifyTransaction(reference);
    if (result.status === "success") {
      await prisma.booking.update({
        where: { id: booking.id },
        data: {
          paymentStatus: "PAID",
          paystackFee: result.fees !== null ? result.fees / 100 : null,
        },
      });
      return { ok: true, bookingId: booking.id };
    }

    // Marking FAILED (rather than leaving it PENDING) immediately frees the
    // capacity slot for other students — createBookingIntent's count query
    // only counts PAID/PENDING bookings — while this student can still
    // retry via initiatePayment as long as the reservation hold hasn't
    // expired.
    await prisma.booking.update({
      where: { id: booking.id },
      data: { paymentStatus: "FAILED" },
    });
    return {
      ok: false,
      error: "Payment wasn't completed. You can try again.",
      bookingId: booking.id,
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof PaystackError ? err.message : "Couldn't confirm payment.",
      bookingId: booking.id,
    };
  }
}
