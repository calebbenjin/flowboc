import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyWebhookSignature } from "@/lib/startbutton";
import { intervalForPlanCode } from "@/lib/subscription-plans";

// Startbutton's docs only document one subscription-specific webhook event
// (subscription.canceled.customer) — nothing for a successful recurring
// charge, unlike Paystack's subscription.create/invoice.*. Best inference
// from the docs: a successful charge (first or renewal) fires the same
// collection.verified/collection.completed events used for one-time
// payment links, with `isRecurrent: true` and a plan reference on the
// transaction. UNCONFIRMED — verify by registering this URL in the
// Startbutton sandbox dashboard, completing one real test charge in the
// browser, and reading the `[startbutton webhook] unhandled event` log line
// below if the inferred branch doesn't match. Adjust the field names here
// once the real payload is known.
type StartbuttonEvent = {
  event: string;
  data: {
    status?: string;
    email?: string;
    customer?: { email?: string };
    isRecurrent?: boolean;
    subscriptionPlanId?: string;
    planId?: string;
    plan?: { code?: string } | null;
    planCode?: string;
    subscriberId?: string;
    _id?: string;
    nextPaymentDate?: string | null;
    reason?: string;
    cancellationOrigin?: string;
  };
};

function emailOf(data: StartbuttonEvent["data"]): string | undefined {
  return data.email ?? data.customer?.email;
}

function planCodeOf(data: StartbuttonEvent["data"]): string | undefined {
  return data.plan?.code ?? data.planCode ?? data.subscriptionPlanId ?? data.planId;
}

// The authoritative confirmation that a subscription charge succeeded, same
// "webhook is truth" pattern as the Paystack booking-payment webhook. Must
// be registered manually in the Startbutton dashboard — there's no API for
// registering it (same as Paystack's).
export async function POST(request: Request): Promise<NextResponse> {
  const rawBody = await request.text();
  const signature = request.headers.get("x-startbutton-signature");

  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(rawBody) as StartbuttonEvent;

  switch (event.event) {
    case "collection.verified":
    case "collection.completed": {
      // Only subscription charges concern this webhook — one-time booking
      // payments go through Paystack directly, not Startbutton.
      if (!event.data.isRecurrent) break;

      const email = emailOf(event.data);
      const planCode = planCodeOf(event.data);
      if (!email || !planCode) break;

      // Instructor.email isn't DB-unique, but is always set from the
      // 1:1-owning User.email (which is unique) at onboarding — findFirst
      // is safe here in practice.
      const instructor = await prisma.instructor.findFirst({ where: { email } });
      if (!instructor) break;

      const interval = await intervalForPlanCode(planCode);

      await prisma.instructor.update({
        where: { id: instructor.id },
        data: {
          planStatus: "ACTIVE",
          billingInterval: interval,
          subscriptionPlanCode: planCode,
          subscriptionProviderId:
            event.data.subscriberId ?? event.data._id ?? instructor.subscriptionProviderId,
          subscriptionRenewsAt: event.data.nextPaymentDate
            ? new Date(event.data.nextPaymentDate)
            : null,
        },
      });
      break;
    }

    case "subscription.canceled.customer": {
      const email = emailOf(event.data);
      if (!email) break;

      await prisma.instructor.updateMany({
        where: { email, planStatus: { not: "CANCELED" } },
        data: { planStatus: "CANCELED" },
      });
      break;
    }

    default:
      // Not yet handled — log the raw event so its real shape is visible
      // during manual webhook verification instead of silently dropping it.
      console.warn(`[startbutton webhook] unhandled event: ${event.event}`, rawBody.slice(0, 2000));
      break;
  }

  // Always 200 once the signature's verified and the event's been handled —
  // Startbutton retries on anything else (same convention as Paystack's).
  return NextResponse.json({ ok: true });
}
