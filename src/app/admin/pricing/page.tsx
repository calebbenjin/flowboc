import type { Metadata } from "next";
import { SUBSCRIPTION_CURRENCIES } from "@/lib/billing-currency";
import { getAllActivePlans } from "@/lib/subscription-plans";
import type { PlanTier } from "@/generated/prisma/enums";
import { PricingClient } from "./pricing-client";

export const metadata: Metadata = {
  title: "Pricing admin — Flowboc",
};

const TIERS: PlanTier[] = ["STARTER", "PRO", "PREMIUM"];

export default async function AdminPricingPage() {
  const plans = await getAllActivePlans();

  const rows = SUBSCRIPTION_CURRENCIES.flatMap((currency) =>
    TIERS.map((tier) => {
      const monthly = plans.find(
        (p) => p.currency === currency && p.tier === tier && p.interval === "MONTHLY",
      );
      const annual = plans.find(
        (p) => p.currency === currency && p.tier === tier && p.interval === "ANNUAL",
      );
      return {
        currency,
        tier,
        monthly: monthly ? { price: monthly.price, planCode: monthly.providerPlanCode } : null,
        annual: annual ? { price: annual.price, planCode: annual.providerPlanCode } : null,
      };
    }),
  );

  return <PricingClient rows={rows} />;
}
