import { NextResponse } from "next/server";
import { subscriptionCurrencyForCountry } from "@/lib/geo-currency";
import { getActivePlansForCurrency } from "@/lib/subscription-plans";
import type { PlanTier } from "@/generated/prisma/enums";

// Vercel's edge network injects this header on every request in production;
// it's absent in local dev, so localized pricing simply won't appear there.
const TIERS: PlanTier[] = ["STARTER", "PRO", "PREMIUM"];

type TierPricing = { annual: number; monthly: number } | null;

export async function GET(request: Request) {
  const country = request.headers.get("x-vercel-ip-country");
  const currency = subscriptionCurrencyForCountry(country);

  if (!currency) {
    return NextResponse.json({ country, currency: null, tiers: null });
  }

  const plans = await getActivePlansForCurrency(currency);

  const tiers = Object.fromEntries(
    TIERS.map((tier) => {
      const monthly = plans[tier].MONTHLY;
      const annual = plans[tier].ANNUAL;
      const pricing: TierPricing =
        monthly && annual
          ? // SubscriptionPlan.price for an ANNUAL row is the full once-a-year
            // charge (same convention createSubscriptionPlan bills Startbutton
            // with) — displayed as its per-month equivalent, same as the
            // static "$14/mo, billed annually" cards.
            { annual: Math.round(annual.price / 12), monthly: monthly.price }
          : null;
      return [tier, pricing];
    }),
  ) as Record<PlanTier, TierPricing>;

  return NextResponse.json({ country, currency, tiers });
}
