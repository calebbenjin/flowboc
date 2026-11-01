import { ONBOARDING_MOODS, type OnboardingMood } from "@/lib/onboarding-appearance";
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

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ onboardingMood?: string }>;
}) {
  const { onboardingMood: requestedMood } = await searchParams;
  const onboardingMood =
    requestedMood && Object.hasOwn(ONBOARDING_MOODS, requestedMood)
      ? (requestedMood as OnboardingMood)
      : null;
  const instructor = await getCurrentInstructor();
  // Subscriptions always bill in USD, regardless of the currency the
  // instructor charges their own students in.
  const plans = instructor ? await getActivePlansForCurrency("USD") : EMPTY_PLANS;

  return <BillingClient plans={plans} onboardingMood={onboardingMood} />;
}
