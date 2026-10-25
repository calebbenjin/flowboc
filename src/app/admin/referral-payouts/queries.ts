import { prisma } from "@/lib/db";
import type { CurrencyCode, ReferralPayoutStatus } from "@/generated/prisma/enums";

export type AdminReferralPayoutRow = {
  id: string;
  instructorId: string;
  instructorName: string;
  instructorEmail: string;
  instructorCurrency: CurrencyCode;
  payoutBankLabel: string | null;
  amount: number;
  status: ReferralPayoutStatus;
  requestedAt: Date;
  reviewedAt: Date | null;
  failureReason: string | null;
};

export async function getAllReferralPayoutRequests(): Promise<AdminReferralPayoutRow[]> {
  const rows = await prisma.referralPayoutRequest.findMany({
    include: {
      instructor: {
        select: { name: true, email: true, currency: true, payoutBankLabel: true },
      },
    },
    orderBy: { requestedAt: "desc" },
  });

  return rows.map((r) => ({
    id: r.id,
    instructorId: r.instructorId,
    instructorName: r.instructor.name,
    instructorEmail: r.instructor.email,
    instructorCurrency: r.instructor.currency,
    payoutBankLabel: r.instructor.payoutBankLabel,
    amount: r.amount,
    status: r.status,
    requestedAt: r.requestedAt,
    reviewedAt: r.reviewedAt,
    failureReason: r.failureReason,
  }));
}
