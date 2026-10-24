import { prisma } from "@/lib/db";
import { sendBookingConfirmationEmail, sendInstructorNewBookingEmail } from "@/lib/email";

// Shared between verifyPayment (src/app/[slug]/book/[classId]/actions.ts,
// the student's browser returning from Paystack checkout) and the Paystack
// webhook (src/app/api/webhooks/paystack/route.ts, the authoritative
// confirmation that doesn't depend on the browser making it back) — same
// "two paths converge on one idempotent finalizer" pattern as video call
// bookings (see src/lib/video-call-booking.ts). The confirmation email only
// goes out here, once payment is actually confirmed — not at reservation
// time — since for an online class it carries the real meeting link, and
// handing that out before payment clears defeats the point of charging for
// the class at all.
export async function finalizeClassBookingPayment(input: {
  bookingId: string;
  paystackFee: number | null; // major units
}): Promise<void> {
  const booking = await prisma.booking.findUnique({
    where: { id: input.bookingId },
    include: { class: { include: { instructor: true } } },
  });
  if (!booking || booking.paymentStatus === "PAID") return;

  await prisma.booking.update({
    where: { id: booking.id },
    data: { paymentStatus: "PAID", paystackFee: input.paystackFee },
  });

  // Cancelled mid-checkout (by the instructor, or the expired-reservation
  // cron) — the charge is still recorded above for a manual refund, but
  // don't send a "you're booked" email for a class that no longer exists.
  if (booking.status !== "CONFIRMED") return;

  const cls = booking.class;

  await sendBookingConfirmationEmail({
    to: booking.studentEmail,
    studentName: booking.studentName,
    className: cls.name,
    startAt: cls.startAt,
    timezone: cls.timezone,
    location: cls.location,
    instructorName: cls.instructor.name,
  }).catch((err: unknown) => console.error("Failed to send student booking confirmation:", err));

  await sendInstructorNewBookingEmail({
    to: cls.instructor.email,
    studentName: booking.studentName,
    className: cls.name,
    startAt: cls.startAt,
    timezone: cls.timezone,
  }).catch((err: unknown) => console.error("Failed to send instructor new-booking notice:", err));
}
