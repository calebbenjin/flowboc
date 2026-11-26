"use server";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/require-admin";
import type { ReferralStatus } from "@/generated/prisma/enums";

type ActionResult = { ok: true } | { ok: false; error: string };

// Manual override for when the automatic one-time crediting (see the
// Startbutton webhook) gets it wrong — a misread plan price, a disputed
// referral, etc. The webhook remains the primary path; this is the safety
// valve, same pattern as adminGrantComp/adminExtendTrial in admin/billing.
export async function adminAdjustReferral(input: {
  referralId: string;
  status: ReferralStatus;
  commissionEarned: number;
}): Promise<ActionResult> {
  await requireAdmin();

  if (!Number.isInteger(input.commissionEarned) || input.commissionEarned < 0) {
    return { ok: false, error: "Commission must be a non-negative whole number." };
  }

  const referral = await prisma.referral.findUnique({
    where: { id: input.referralId },
    include: { referrerInstructor: { select: { currency: true } } },
  });
  if (!referral) return { ok: false, error: "Referral not found." };

  // The admin's amount is in the referrer's current currency, and becomes
  // the new bonus source too — otherwise settlePendingReferralBonuses would
  // recompute over it from the original source after a currency change.
  // A non-zero amount also marks the bonus credited so the webhook can't
  // credit it a second time on top.
  const currency = referral.referrerInstructor.currency;
  await prisma.referral.update({
    where: { id: input.referralId },
    data: {
      status: input.status,
      commissionEarned: input.commissionEarned,
      commissionCurrency: currency,
      bonusSourceAmount: input.commissionEarned,
      bonusSourceCurrency: currency,
      bonusFxRate: 1,
      ...(input.commissionEarned > 0 && !referral.bonusCreditedAt
        ? { bonusCreditedAt: new Date() }
        : {}),
    },
  });

  return { ok: true };
}
