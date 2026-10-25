import { prisma } from "@/lib/db";
import type { ReferralPayoutStatus, ReferralStatus } from "@/generated/prisma/enums";

export type ReferralRow = {
  id: string;
  name: string;
  joinedAt: Date;
  status: ReferralStatus;
  plan: string | null;
  commissionEarned: number;
};

export async function getReferrals(instructorId: string): Promise<ReferralRow[]> {
  const rows = await prisma.referral.findMany({
    where: { referrerInstructorId: instructorId },
    include: { referredInstructor: { select: { name: true } } },
    orderBy: { joinedAt: "desc" },
  });

  return rows.map((r) => ({
    id: r.id,
    name: r.referredInstructor.name,
    joinedAt: r.joinedAt,
    status: r.status,
    plan: r.plan,
    commissionEarned: r.commissionEarned,
  }));
}

export type PayoutRequestRow = {
  id: string;
  amount: number;
  status: ReferralPayoutStatus;
  requestedAt: Date;
  failureReason: string | null;
};

// "Available to withdraw" is the sum of commission not yet claimed by a
// payout request — see Referral.payoutRequestId, set the instant a request
// is created and cleared back to null if that request is rejected.
export async function getReferralPayoutSummary(instructorId: string): Promise<{
  availableBalance: number;
  requests: PayoutRequestRow[];
}> {
  const [unclaimed, requests] = await Promise.all([
    prisma.referral.aggregate({
      where: { referrerInstructorId: instructorId, payoutRequestId: null },
      _sum: { commissionEarned: true },
    }),
    prisma.referralPayoutRequest.findMany({
      where: { instructorId },
      orderBy: { requestedAt: "desc" },
    }),
  ]);

  return {
    availableBalance: unclaimed._sum.commissionEarned ?? 0,
    requests: requests.map((r) => ({
      id: r.id,
      amount: r.amount,
      status: r.status,
      requestedAt: r.requestedAt,
      failureReason: r.failureReason,
    })),
  };
}
