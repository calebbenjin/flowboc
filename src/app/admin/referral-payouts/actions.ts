"use server";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/require-admin";
import { logAdminActivity } from "@/lib/admin-activity";
import { createTransferRecipient, initiateTransfer, PaystackError } from "@/lib/paystack";

type ActionResult = { ok: true } | { ok: false; error: string };

// Admin review step for src/app/dashboard/referrals/actions.ts's
// requestReferralPayout. Approving actually moves money: it creates (or
// reuses) a Paystack transfer recipient pointed at the instructor's
// existing payout subaccount, then initiates a transfer into it. The
// request only reaches PAID/FAILED once Paystack's transfer.success /
// transfer.failed webhook confirms it (see
// src/app/api/webhooks/paystack/route.ts) — transfers aren't guaranteed to
// settle synchronously.
export async function adminApproveReferralPayout(requestId: string): Promise<ActionResult> {
  await requireAdmin();

  const request = await prisma.referralPayoutRequest.findUnique({
    where: { id: requestId },
    include: { instructor: true },
  });
  if (!request) return { ok: false, error: "Payout request not found." };
  if (request.status !== "PENDING") {
    return { ok: false, error: "This request has already been reviewed." };
  }

  const { instructor } = request;
  if (instructor.payoutStatus !== "CONNECTED" || !instructor.payoutAccountId) {
    return { ok: false, error: `${instructor.name} no longer has a connected payout account.` };
  }
  // The transfer recipient is created in (and cached for) the instructor's
  // currency, so a request made before they changed currency can't go out
  // as-is — reject it, which unlocks its referrals to be re-converted.
  if (request.currency !== instructor.currency) {
    return {
      ok: false,
      error: `This request is in ${request.currency} but ${instructor.name} now uses ${instructor.currency}. Reject it so they can request again.`,
    };
  }

  try {
    let recipientCode = instructor.paystackTransferRecipientCode;
    if (!recipientCode) {
      const recipient = await createTransferRecipient({
        subaccountCode: instructor.payoutAccountId,
        currency: instructor.currency,
      });
      recipientCode = recipient.recipientCode;
      await prisma.instructor.update({
        where: { id: instructor.id },
        data: { paystackTransferRecipientCode: recipientCode },
      });
    }

    const transfer = await initiateTransfer({
      recipientCode,
      amount: request.amount,
      reason: "Flowboc referral commission payout",
      reference: request.id,
    });

    await prisma.referralPayoutRequest.update({
      where: { id: request.id },
      data: {
        status: "APPROVED",
        reviewedAt: new Date(),
        paystackTransferCode: transfer.transferCode,
        paystackTransferReference: request.id,
      },
    });
  } catch (err) {
    if (err instanceof PaystackError) {
      return { ok: false, error: err.message };
    }
    throw err;
  }

  await logAdminActivity({
    type: "REFERRAL_PAYOUT_APPROVED",
    message: `Admin approved a referral payout for ${instructor.name}`,
    instructorId: instructor.id,
  });

  return { ok: true };
}

export async function adminRejectReferralPayout(
  requestId: string,
  note?: string,
): Promise<ActionResult> {
  await requireAdmin();

  const request = await prisma.referralPayoutRequest.findUnique({
    where: { id: requestId },
    include: { instructor: { select: { id: true, name: true } } },
  });
  if (!request) return { ok: false, error: "Payout request not found." };
  if (request.status !== "PENDING") {
    return { ok: false, error: "This request has already been reviewed." };
  }

  await prisma.$transaction([
    prisma.referralPayoutRequest.update({
      where: { id: request.id },
      data: { status: "REJECTED", reviewedAt: new Date(), reviewNote: note?.trim() || null },
    }),
    prisma.referral.updateMany({
      where: { payoutRequestId: request.id },
      data: { payoutRequestId: null },
    }),
  ]);

  await logAdminActivity({
    type: "REFERRAL_PAYOUT_REJECTED",
    message: `Admin rejected a referral payout request for ${request.instructor.name}`,
    instructorId: request.instructor.id,
  });

  return { ok: true };
}
