import type { Metadata } from "next";
import { getCurrentInstructor } from "@/lib/get-current-instructor";
import { getActivePlansForCurrency } from "@/lib/subscription-plans";
import { BillingClient } from "./billing-client";

export const metadata: Metadata = {
  title: "Billing — Flowboc",
  description: "Manage your Flowboc subscription.",
  openGraph: {
    title: "Billing — Flowboc",
    description: "Manage your Flowboc subscription.",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

const EMPTY_PLANS = {
  STARTER: { MONTHLY: null, ANNUAL: null },
  PRO: { MONTHLY: null, ANNUAL: null },
  PREMIUM: { MONTHLY: null, ANNUAL: null },
} as const;

export default async function BillingPage() {
  const instructor = await getCurrentInstructor();
  const plans = instructor ? await getActivePlansForCurrency(instructor.currency) : EMPTY_PLANS;

  return <BillingClient plans={plans} />;
}
