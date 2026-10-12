import type { Metadata } from "next";
import { PayoutsClient } from "./payouts-client";

export const metadata: Metadata = {
  title: "Payouts — Flowboc",
  description: "Connect a payout account to get paid directly for every class you teach.",
  openGraph: {
    title: "Payouts — Flowboc",
    description: "Class payments go straight to your account.",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export default function PayoutsPage() {
  return <PayoutsClient />;
}
