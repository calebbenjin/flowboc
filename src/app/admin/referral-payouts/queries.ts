import { prisma } from "@/lib/db";
import type { CurrencyCode, ReferralPayoutStatus } from "@/generated/prisma/enums";

export type AdminReferralPayoutRow = {
  id: string;
  instructorId: string;
  instructorName: string;
  instructorEmail: string;
  // The request's own currency — what the transfer goes out in.
  currency: CurrencyCode;
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
        select: { name: true, email: true, payoutBankLabel: true },
      },
    },
    orderBy: { requestedAt: "desc" },
  });

  return rows.map((r) => ({
    id: r.id,
    instructorId: r.instructorId,
    instructorName: r.instructor.name,
    instructorEmail: r.instructor.email,
    currency: r.currency,
    payoutBankLabel: r.instructor.payoutBankLabel,
    amount: r.amount,
    status: r.status,
    requestedAt: r.requestedAt,
    reviewedAt: r.reviewedAt,
    failureReason: r.failureReason,
  }));
}
