import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentInstructor } from "@/lib/get-current-instructor";
import { settlePendingReferralBonuses } from "@/lib/referral-code";
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

  // Converts any bonus still pending into the instructor's current
  // currency before the balance is read — see settlePendingReferralBonuses.
  await settlePendingReferralBonuses(instructor.id);
  const [referrals, payoutSummary] = await Promise.all([
    getReferrals(instructor.id),
    getReferralPayoutSummary(instructor),
  ]);
  const stats = {
    totalReferred: referrals.length,
    activeReferrals: referrals.filter((r) => r.status === "ACTIVE").length,
    // Lifetime total in the current currency only — commission paid out
    // before a currency change can't be summed with it meaningfully.
    totalCommission: referrals
      .filter((r) => r.commissionCurrency === instructor.currency)
      .reduce((sum, r) => sum + r.commissionEarned, 0),
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
