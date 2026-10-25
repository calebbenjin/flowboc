import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentInstructor } from "@/lib/get-current-instructor";
import { getReferralPayoutSummary, getReferrals } from "./queries";
import { ReferralsClient } from "./referrals-client";

export const metadata: Metadata = {
  title: "Referrals — Flowboc",
  description: "Share your referral link and earn 20% commission on every subscription you refer.",
  openGraph: {
    title: "Referrals — Flowboc",
    description: "Earn 20% commission on every subscription you refer.",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export default async function ReferralsPage() {
  const instructor = await getCurrentInstructor();
  if (!instructor) redirect("/onboarding");

  const [referrals, payoutSummary] = await Promise.all([
    getReferrals(instructor.id),
    getReferralPayoutSummary(instructor.id),
  ]);
  const stats = {
    totalReferred: referrals.length,
    activeReferrals: referrals.filter((r) => r.status === "ACTIVE").length,
    totalCommission: referrals.reduce((sum, r) => sum + r.commissionEarned, 0),
  };

  return (
    <ReferralsClient
      referrals={referrals}
      stats={stats}
      availableBalance={payoutSummary.availableBalance}
      payoutRequests={payoutSummary.requests}
    />
  );
}
