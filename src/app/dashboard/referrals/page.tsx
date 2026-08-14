import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentInstructor } from "@/lib/get-current-instructor";
import { getReferrals } from "./queries";
import { ReferralsClient } from "./referrals-client";

export const metadata: Metadata = {
  title: "Referrals — Flowbuk",
  description: "Share your referral link and earn 20% commission on every subscription you refer.",
  openGraph: {
    title: "Referrals — Flowbuk",
    description: "Earn 20% commission on every subscription you refer.",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export default async function ReferralsPage() {
  const instructor = await getCurrentInstructor();
  if (!instructor) redirect("/onboarding");

  const referrals = await getReferrals(instructor.id);
  const stats = {
    totalReferred: referrals.length,
    activeReferrals: referrals.filter((r) => r.status === "ACTIVE").length,
    totalCommission: referrals.reduce((sum, r) => sum + r.commissionEarned, 0),
  };

  return <ReferralsClient referrals={referrals} stats={stats} />;
}
