"use server";

import { prisma } from "@/lib/db";
import { requireInstructor } from "@/lib/require-instructor";
import { logAdminActivity } from "@/lib/admin-activity";

type ActionResult = { ok: true } | { ok: false; error: string };

// Instructor-initiated request to withdraw accrued referral commission. The
// commission on eligible Referral rows is locked (payoutRequestId set) the
// instant this request is created, so it can't be claimed twice by a second
// concurrent request — adminRejectReferralPayout unlocks it again if an
// admin turns the request down. See src/app/admin/referral-payouts/actions.ts
// for the approve/reject side and the Paystack transfer that actually moves
// the money once approved.
export async function requestReferralPayout(): Promise<ActionResult> {
  const instructor = await requireInstructor();

  if (instructor.payoutStatus !== "CONNECTED" || !instructor.payoutAccountId) {
    return {
      ok: false,
      error: "Connect your payout account on the Payouts page before requesting a referral payout.",
    };
  }

  const inFlight = await prisma.referralPayoutRequest.findFirst({
    where: { instructorId: instructor.id, status: { in: ["PENDING", "APPROVED"] } },
  });
  if (inFlight) {
    return { ok: false, error: "You already have a payout request in progress." };
  }

  const eligible = await prisma.referral.findMany({
    where: {
      referrerInstructorId: instructor.id,
      payoutRequestId: null,
      commissionEarned: { gt: 0 },
    },
    select: { id: true, commissionEarned: true },
  });
  const amount = eligible.reduce((sum, r) => sum + r.commissionEarned, 0);
  if (amount <= 0) {
    return { ok: false, error: "Nothing available to withdraw yet." };
  }

  await prisma.$transaction(async (tx) => {
    const request = await tx.referralPayoutRequest.create({
      data: { instructorId: instructor.id, amount },
    });
    await tx.referral.updateMany({
      where: { id: { in: eligible.map((r) => r.id) } },
      data: { payoutRequestId: request.id },
    });
  });

  await logAdminActivity({
    type: "REFERRAL_PAYOUT_REQUESTED",
    message: `${instructor.name} requested a referral payout`,
    instructorId: instructor.id,
  });

  return { ok: true };
}
