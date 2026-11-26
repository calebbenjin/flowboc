import { prisma } from "@/lib/db";
import { convertAmount, getFxRate } from "@/lib/fx";
import type { CurrencyCode } from "@/generated/prisma/enums";

function randomDigits(length: number): string {
  const chars = "0123456789";
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export async function generateReferralCode(name: string): Promise<string> {
  const base =
    (name.split(" ")[0] ?? "")
      .replace(/[^a-zA-Z]/g, "")
      .toUpperCase()
      .slice(0, 12) || "INSTRUCTOR";

  for (let attempt = 0; attempt < 20; attempt++) {
    const code = `${base}${randomDigits(attempt === 0 ? 2 : 4)}`;
    const existing = await prisma.instructor.findUnique({ where: { referralCode: code } });
    if (!existing) return code;
  }

  // Astronomically unlikely to be reached, but keep it deterministically unique.
  return `${base}${Date.now().toString(36).toUpperCase()}`;
}

// Lets signUp() give the user feedback on a bad code immediately, instead of
// consumeReferralCode's deliberately-silent no-op at onboarding time.
export async function referralCodeExists(rawCode: string): Promise<boolean> {
  const code = rawCode.trim().toUpperCase();
  if (!code) return false;
  const referrer = await prisma.instructor.findUnique({ where: { referralCode: code } });
  return referrer !== null;
}

// Turns a signup-time referral code into a PENDING Referral row once the
// referred instructor's own Instructor record exists. Silently no-ops on an
// invalid code, a self-referral, or a missing code — this runs as part of
// onboarding completion and shouldn't block it over a bad ?ref= value.
export async function consumeReferralCode(
  referredInstructorId: string,
  rawCode: string | null | undefined,
): Promise<void> {
  const code = rawCode?.trim().toUpperCase();
  if (!code) return;

  const referrer = await prisma.instructor.findUnique({ where: { referralCode: code } });
  if (!referrer || referrer.id === referredInstructorId) return;

  await prisma.referral.upsert({
    where: { referredInstructorId },
    create: { referrerInstructorId: referrer.id, referredInstructorId },
    update: {},
  });
}

// Called from the Startbutton webhook when a referred instructor's
// subscription activates. The bonus is one-time — paid out of the
// referred instructor's *first* successful subscription payment only, never
// on renewals or on reactivating after a churn. bonusCreditedAt is
// therefore the "already credited" marker; a later reactivation just flips
// status back to ACTIVE without re-crediting.
//
// The bonus is earned in the subscription's currency but credited in the
// referrer's, converted at today's rate. If the rate can't be fetched the
// bonus is still marked credited (with its source amount recorded) and
// settlePendingReferralBonuses converts it later — this runs inside the
// webhook, after the subscription has already been activated, so it must
// never throw over an FX outage.
export async function creditOneTimeReferralBonus(
  referredInstructorId: string,
  subscription: { price: number; interval: string; currency: CurrencyCode } | null,
): Promise<void> {
  const referral = await prisma.referral.findUnique({
    where: { referredInstructorId },
    include: { referrerInstructor: { select: { commissionRate: true, currency: true } } },
  });
  if (!referral) return;

  if (referral.bonusCreditedAt || !subscription) {
    if (referral.status !== "ACTIVE") {
      await prisma.referral.update({ where: { referredInstructorId }, data: { status: "ACTIVE" } });
    }
    return;
  }

  const { commissionRate, currency: referrerCurrency } = referral.referrerInstructor;
  const sourceAmount = Math.round((subscription.price * commissionRate) / 100);
  const rate = await getFxRate(subscription.currency, referrerCurrency);

  // Guarded on bonusCreditedAt so two concurrent webhook deliveries for the
  // same first charge can't both credit it.
  await prisma.referral.updateMany({
    where: { referredInstructorId, bonusCreditedAt: null },
    data: {
      status: "ACTIVE",
      plan: subscription.interval,
      bonusSourceAmount: sourceAmount,
      bonusSourceCurrency: subscription.currency,
      bonusCreditedAt: new Date(),
      ...(rate === null
        ? {}
        : {
            commissionEarned: convertAmount(sourceAmount, rate),
            commissionCurrency: referrerCurrency,
            bonusFxRate: rate,
          }),
    },
  });
}

// Converts a referrer's unclaimed bonuses into their current currency —
// both ones whose conversion failed at credit time and ones credited
// before they changed Instructor.currency, since a payout can only go out
// in the currency of their Paystack transfer recipient. Always recomputed
// from the original bonus source, never from a previous conversion, so
// rates don't compound. Called before reading or claiming the balance;
// cheap when there's nothing pending.
export async function settlePendingReferralBonuses(referrerInstructorId: string): Promise<void> {
  const referrer = await prisma.instructor.findUnique({
    where: { id: referrerInstructorId },
    select: { currency: true },
  });
  if (!referrer) return;

  const pending = await prisma.referral.findMany({
    where: {
      referrerInstructorId,
      payoutRequestId: null,
      bonusCreditedAt: { not: null },
      bonusSourceAmount: { not: null },
      bonusSourceCurrency: { not: null },
      OR: [{ commissionCurrency: null }, { commissionCurrency: { not: referrer.currency } }],
    },
  });

  for (const referral of pending) {
    const rate = await getFxRate(referral.bonusSourceCurrency!, referrer.currency);
    if (rate === null) continue;
    // Guarded on payoutRequestId so a payout request claiming this row in
    // the meantime can't have its amount change underneath it.
    await prisma.referral.updateMany({
      where: { id: referral.id, payoutRequestId: null },
      data: {
        commissionEarned: convertAmount(referral.bonusSourceAmount!, rate),
        commissionCurrency: referrer.currency,
        bonusFxRate: rate,
      },
    });
  }
}

// Called from the Startbutton webhook on cancellation. The one-time bonus
// already paid is never clawed back — only the status reflects churn.
export async function markReferralChurned(referredInstructorId: string): Promise<void> {
  await prisma.referral.updateMany({
    where: { referredInstructorId, status: "ACTIVE" },
    data: { status: "CHURNED" },
  });
}
