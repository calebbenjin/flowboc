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

  const event = JSON.parse(rawBody) as PaystackEvent;

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

  // Always 200 once the signature's verified and the event's been handled —
  // Paystack retries on anything else.
  return NextResponse.json({ ok: true });
}
