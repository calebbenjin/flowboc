import { prisma } from "@/lib/db";
import type { CurrencyCode, ReferralStatus } from "@/generated/prisma/enums";

export type AdminReferralRow = {
  id: string;
  referrerName: string;
  referrerEmail: string;
  referrerCurrency: CurrencyCode;
  referredName: string;
  referredEmail: string;
  status: ReferralStatus;
  plan: string | null;
  commissionEarned: number;
  joinedAt: Date;
};

export async function getAllReferrals(): Promise<AdminReferralRow[]> {
  const rows = await prisma.referral.findMany({
    include: {
      referrerInstructor: { select: { name: true, email: true, currency: true } },
      referredInstructor: { select: { name: true, email: true } },
    },
    orderBy: { joinedAt: "desc" },
  });

  return rows.map((r) => ({
    id: r.id,
    referrerName: r.referrerInstructor.name,
    referrerEmail: r.referrerInstructor.email,
    referrerCurrency: r.referrerInstructor.currency,
    referredName: r.referredInstructor.name,
    referredEmail: r.referredInstructor.email,
    status: r.status,
    plan: r.plan,
    commissionEarned: r.commissionEarned,
    joinedAt: r.joinedAt,
  }));
}
