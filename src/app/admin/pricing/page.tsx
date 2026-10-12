import type { Metadata } from "next";
import { SUBSCRIPTION_CURRENCIES } from "@/lib/startbutton";
import { getAllActivePlans } from "@/lib/subscription-plans";
import { PricingClient } from "./pricing-client";

export const metadata: Metadata = {
  title: "Pricing admin — Flowbuk",
};

export default async function AdminPricingPage() {
  const plans = await getAllActivePlans();

  const byCurrency = SUBSCRIPTION_CURRENCIES.map((currency) => {
    const monthly = plans.find((p) => p.currency === currency && p.interval === "MONTHLY");
    const annual = plans.find((p) => p.currency === currency && p.interval === "ANNUAL");
    return {
      currency,
      monthly: monthly ? { price: monthly.price, planCode: monthly.providerPlanCode } : null,
      annual: annual ? { price: annual.price, planCode: annual.providerPlanCode } : null,
    };
  });

  return <PricingClient rows={byCurrency} />;
}
