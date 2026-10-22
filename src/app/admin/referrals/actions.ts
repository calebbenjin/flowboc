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

  await prisma.referral.update({
    where: { id: input.referralId },
    data: { status: input.status, commissionEarned: input.commissionEarned },
  });

  return { ok: true };
}
