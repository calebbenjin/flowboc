import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyWebhookSignature } from "@/lib/paystack";

type PaystackEvent = {
  event: string;
  data: {
    reference?: string;
    fees?: number | null;
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

  try {
    switch (event.event) {
      case "charge.success": {
        const booking = event.data.reference
          ? await prisma.booking.findUnique({ where: { paystackReference: event.data.reference } })
          : null;

        if (booking && booking.paymentStatus !== "PAID") {
          await prisma.booking.update({
            where: { id: booking.id },
            data: {
              paymentStatus: "PAID",
              paystackFee: event.data.fees != null ? event.data.fees / 100 : null,
            },
          });
        }
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
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }

  // Always 200 once the signature's verified and the event's been handled —
  // Paystack retries on anything else.
  return NextResponse.json({ ok: true });
}
