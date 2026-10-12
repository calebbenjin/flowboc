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

export default async function BillingPage() {
  const instructor = await getCurrentInstructor();
  const plans = instructor
    ? await getActivePlansForCurrency(instructor.currency)
    : { MONTHLY: null, ANNUAL: null };

  return <BillingClient plans={plans} />;
}
