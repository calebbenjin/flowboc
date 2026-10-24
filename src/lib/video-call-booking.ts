import { prisma } from "@/lib/db";
import { sendInstructorNewVideoCallBookingEmail, sendVideoCallBookingEmail } from "@/lib/email";

// Shared between verifyVideoCallPayment (src/app/[slug]/actions.ts, the
// student's browser returning from Paystack checkout) and the Paystack
// webhook (src/app/api/webhooks/paystack/route.ts, the authoritative
// confirmation that doesn't depend on the browser making it back) — same
// "two paths converge on one idempotent finalizer" pattern as class
// bookings. Emails only go out here, once payment is actually confirmed —
// not at checkout-intent time — since the meeting-scheduling link is the
// thing being paid for.
export async function finalizeVideoCallPayment(input: {
  bookingId: string;
  paystackFee: number | null; // major units
}): Promise<{ meetingLink: string; offerTitle: string } | null> {
  const booking = await prisma.videoCallBooking.findUnique({
    where: { id: input.bookingId },
    include: { instructor: true },
  });
  if (!booking) return null;

  const meetingLink = booking.instructor.consultationLink;
  if (!meetingLink) return null;
  const offerTitle = booking.instructor.videoCallTitle || "Video Call";

  if (booking.paymentStatus !== "PAID") {
    await prisma.videoCallBooking.update({
      where: { id: booking.id },
      data: { paymentStatus: "PAID", paystackFee: input.paystackFee },
    });

    await sendVideoCallBookingEmail({
      to: booking.studentEmail,
      studentName: booking.studentName,
      instructorName: booking.instructor.name,
      instructorEmail: booking.instructor.email,
      offerTitle,
      meetingLink,
      amount: booking.amount,
      currency: booking.currency,
    }).catch((err: unknown) => console.error("Failed to send student video call email:", err));

    await sendInstructorNewVideoCallBookingEmail({
      to: booking.instructor.email,
      studentName: booking.studentName,
      studentEmail: booking.studentEmail,
      offerTitle,
      amount: booking.amount,
      currency: booking.currency,
    }).catch((err: unknown) =>
      console.error("Failed to send instructor video call notification:", err),
    );
  }

  return { meetingLink, offerTitle };
}
