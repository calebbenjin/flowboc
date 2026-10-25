import { after, NextResponse } from "next/server";
import { getPostHogLogger, loggerProvider, SeverityNumber } from "@/instrumentation";
import { prisma } from "@/lib/db";
import { recordFirstPaidBookingMilestone } from "@/lib/admin-activity";
import { verifyWebhookSignature } from "@/lib/paystack";
import { finalizeVideoCallPayment } from "@/lib/video-call-booking";
import { finalizeClassBookingPayment } from "@/lib/class-booking";
import { finalizeEbookPurchase } from "@/lib/ebook-purchase";

const posthogLogger = getPostHogLogger();

type PaystackEvent = {
  event: string;
  data: {
    reference?: string;
    fees?: number | null;
    reason?: string | null;
  };
};

// The authoritative confirmation that a booking charge succeeded — doesn't
// depend on the student's browser making it back to the callback URL. Must
// be registered manually in Paystack Dashboard → Settings → API Keys &
// Webhooks (there's no API for registering it). Flowboc's own subscription
// billing moved to Startbutton (see src/app/api/webhooks/startbutton) — this
// route now only ever handles student booking payments.
export async function POST(request: Request): Promise<NextResponse> {
  const rawBody = await request.text();
  const signature = request.headers.get("x-paystack-signature");

  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: PaystackEvent;
  try {
    event = JSON.parse(rawBody) as PaystackEvent;
  } catch (err) {
    // Malformed JSON will never parse differently on retry — log and 200 so
    // Paystack doesn't hammer us with the same unprocessable payload forever.
    console.error("Failed to parse Paystack webhook payload:", err);
    return NextResponse.json({ ok: true });
  }

  // Route handlers can finish before the batch processor exports logs.
  after(async () => {
    await loggerProvider?.forceFlush();
  });

  posthogLogger?.emit({
    body: "payment_webhook_verified",
    severityNumber: SeverityNumber.INFO,
    attributes: { provider: "paystack", is_charge_success: event.event === "charge.success" },
  });

  let paymentUpdated = false;
  try {
    switch (event.event) {
      case "charge.success": {
        const booking = event.data.reference
          ? await prisma.booking.findUnique({ where: { paystackReference: event.data.reference } })
          : null;

        if (booking && booking.paymentStatus !== "PAID") {
          await finalizeClassBookingPayment({
            bookingId: booking.id,
            paystackFee: event.data.fees != null ? event.data.fees / 100 : null,
          });
          paymentUpdated = true;
          await recordFirstPaidBookingMilestone(booking.instructorId).catch((err: unknown) =>
            console.error("Failed to record first-booking milestone:", err),
          );
        }

        // Class bookings, video call bookings, and ebook purchases all share
        // one reference namespace (all three come from initializeTransaction),
        // so only one of these lookups ever matches a given reference.
        if (!booking && event.data.reference) {
          const videoCallBooking = await prisma.videoCallBooking.findUnique({
            where: { paystackReference: event.data.reference },
          });
          if (videoCallBooking) {
            if (videoCallBooking.paymentStatus !== "PAID") {
              const result = await finalizeVideoCallPayment({
                bookingId: videoCallBooking.id,
                paystackFee: event.data.fees != null ? event.data.fees / 100 : null,
              });
              paymentUpdated = result !== null;
            }
          } else {
            const ebookPurchase = await prisma.ebookPurchase.findUnique({
              where: { paystackReference: event.data.reference },
            });
            if (ebookPurchase && ebookPurchase.paymentStatus !== "PAID") {
              const result = await finalizeEbookPurchase({
                purchaseId: ebookPurchase.id,
                paystackFee: event.data.fees != null ? event.data.fees / 100 : null,
              });
              paymentUpdated = result !== null;
            }
          }
        }

        posthogLogger?.emit({
          body: "booking_payment_confirmed",
          severityNumber: SeverityNumber.INFO,
          attributes: { provider: "paystack", payment_updated: paymentUpdated },
        });
        break;
      }

      // Resolves a referral payout request from APPROVED (transfer
      // initiated by an admin, see src/app/admin/referral-payouts/actions.ts)
      // to its final PAID/FAILED state — transfers aren't guaranteed to
      // settle synchronously, so this is the authoritative confirmation.
      case "transfer.success":
      case "transfer.failed":
      case "transfer.reversed": {
        const request = event.data.reference
          ? await prisma.referralPayoutRequest.findUnique({
              where: { paystackTransferReference: event.data.reference },
            })
          : null;

        if (request && request.status === "APPROVED") {
          await prisma.referralPayoutRequest.update({
            where: { id: request.id },
            data:
              event.event === "transfer.success"
                ? { status: "PAID" }
                : { status: "FAILED", failureReason: event.data.reason ?? null },
          });
          paymentUpdated = true;
        }

        posthogLogger?.emit({
          body: "referral_payout_transfer_resolved",
          severityNumber: SeverityNumber.INFO,
          attributes: {
            provider: "paystack",
            transfer_event: event.event,
            resolved: paymentUpdated,
          },
        });
        break;
      }

      default:
        break;
    }
  } catch (err) {
    // Unlike a parse error, this may well be transient (DB hiccup) — return
    // a 500 so Paystack retries instead of silently dropping a real payment
    // confirmation.
    console.error("Failed to process Paystack webhook event:", err);
    posthogLogger?.emit({
      body: "webhook_processing_failed",
      severityNumber: SeverityNumber.ERROR,
      attributes: {
        provider: "paystack",
        event: event.event,
        error: err instanceof Error ? err.message : String(err),
      },
    });
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }

  // Always 200 once the signature's verified and the event's been handled —
  // Paystack retries on anything else.
  return NextResponse.json({ ok: true });
}
