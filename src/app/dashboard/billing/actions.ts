"use server";

import { prisma } from "@/lib/db";
import { requireInstructor } from "@/lib/require-instructor";
import { getActivePlan } from "@/lib/subscription-plans";
import { cancelSubscriber, StartbuttonError } from "@/lib/startbutton";
import type { BillingInterval } from "@/generated/prisma/enums";

type ActionResult = { ok: true } | { ok: false; error: string };

// Unlike Paystack, Startbutton returns one reusable hosted checkout link per
// plan at creation time (stored on SubscriptionPlan.checkoutLink) rather
// than requiring a per-transaction "initialize" call — so this just looks
// the link up, no API call needed. The checkout page isn't pre-filled with
// the instructor's email (Startbutton has no metadata/reference param for
// this flow), so the webhook matches the subscriber back to an instructor
// by email — the billing page's copy tells the instructor to use their
// Flowboc account email when subscribing.
export async function startSubscription(
  interval: BillingInterval,
): Promise<{ ok: true; authorizationUrl: string } | { ok: false; error: string }> {
  const instructor = await requireInstructor();

  const plan = await getActivePlan(instructor.currency, interval);
  if (!plan) {
    return { ok: false, error: "Subscriptions for your currency aren't available yet." };
  }

  return { ok: true, authorizationUrl: plan.checkoutLink };
}

// Cosmetic only — the status flip on first charge happens via the
// Startbutton webhook (src/app/api/webhooks/startbutton/route.ts, same
// "webhook is truth" pattern as the Paystack booking-payment webhook); this
// just lets the UI poll briefly after redirecting back rather than show a
// stale "Trialing" state.
export async function refreshBillingStatus(): Promise<{ planStatus: string }> {
  const instructor = await requireInstructor();
  return { planStatus: instructor.planStatus };
}

export async function cancelSubscription(): Promise<ActionResult> {
  const instructor = await requireInstructor();

  if (!instructor.subscriptionProviderId) {
    return { ok: false, error: "No active subscription to cancel." };
  }

  try {
    await cancelSubscriber({
      subscriberId: instructor.subscriptionProviderId,
      reason: "Canceled by instructor from Flowboc billing dashboard",
    });
  } catch (err) {
    return {
      ok: false,
      error: err instanceof StartbuttonError ? err.message : "Couldn't cancel subscription.",
    };
  }

  // Cancel is user-initiated and synchronous, unlike the fraud-sensitive
  // booking flow — set status directly rather than waiting on the
  // subscription.canceled.customer webhook (it'll arrive too and no-op).
  await prisma.instructor.update({
    where: { id: instructor.id },
    data: { planStatus: "CANCELED" },
  });

  return { ok: true };
}
