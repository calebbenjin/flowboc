import { prisma } from "@/lib/db";
import type { ReferralStatus } from "@/generated/prisma/enums";

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
