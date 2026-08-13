import type { Metadata } from "next";
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

export default function ReferralsPage() {
  return <ReferralsClient />;
}
