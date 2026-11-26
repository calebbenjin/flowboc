import { prisma } from "@/lib/db";
import { resolveBillingCurrency, SUBSCRIPTION_CURRENCIES } from "@/lib/billing-currency";
import type { BillingInterval, CurrencyCode, PlanTier } from "@/generated/prisma/enums";

export async function getActivePlan(
  currency: CurrencyCode,
  interval: BillingInterval,
  tier: PlanTier,
) {
  return prisma.subscriptionPlan.findFirst({ where: { currency, interval, tier, active: true } });
}

// Keyed by tier then interval — mirrors the shape the billing page and the
// admin pricing page both need (pick a tier, then a billing interval).
export async function getActivePlansForCurrency(
  currency: CurrencyCode,
): Promise<Record<PlanTier, Record<BillingInterval, { price: number; planCode: string } | null>>> {
  const rows = await prisma.subscriptionPlan.findMany({ where: { currency, active: true } });
  const forTier = (tier: PlanTier, interval: BillingInterval) => {
    const row = rows.find((r) => r.tier === tier && r.interval === interval);
    return row ? { price: row.price, planCode: row.providerPlanCode } : null;
  };
  const tiers: PlanTier[] = ["STARTER", "PRO", "PREMIUM"];
  return Object.fromEntries(
    tiers.map((tier) => [
      tier,
      { MONTHLY: forTier(tier, "MONTHLY"), ANNUAL: forTier(tier, "ANNUAL") },
    ]),
  ) as Record<PlanTier, Record<BillingInterval, { price: number; planCode: string } | null>>;
}

// Landing-page pricing for every subscription currency that has all four
// Starter/Pro × monthly/annual prices set — a half-configured currency is
// left out entirely rather than shown with gaps. Premium isn't on the
// landing page, so it isn't required.
export async function getLandingPlansByCurrency() {
  const entries = await Promise.all(
    SUBSCRIPTION_CURRENCIES.map(
      async (currency) => [currency, await getActivePlansForCurrency(currency)] as const,
    ),
  );
  return Object.fromEntries(
    entries.filter(([, plans]) =>
      (["STARTER", "PRO"] as const).every((tier) => plans[tier].MONTHLY && plans[tier].ANNUAL),
    ),
  ) as Partial<Record<CurrencyCode, Awaited<ReturnType<typeof getActivePlansForCurrency>>>>;
}

export async function getAllActivePlans() {
  return prisma.subscriptionPlan.findMany({ where: { active: true } });
}

// Searches every row ever created (not just the currently active one) so a
// webhook event for a subscriber on a now-superseded plan still resolves —
// see the model comment in prisma/schema.prisma.
export async function getPlanByCode(planCode: string) {
  return prisma.subscriptionPlan.findFirst({ where: { providerPlanCode: planCode } });
}

// Server-side wrapper around resolveBillingCurrency — looks up the currency
// of the plan the instructor is currently subscribed on, so an active
// subscriber's billing currency stays locked to it.
export async function getBillingCurrency(instructor: {
  currency: CurrencyCode;
  planStatus: string;
  subscriptionPlanCode: string | null;
}): Promise<CurrencyCode | null> {
  const activePlan =
    instructor.planStatus === "ACTIVE" && instructor.subscriptionPlanCode
      ? await getPlanByCode(instructor.subscriptionPlanCode)
      : null;
  return resolveBillingCurrency({
    currency: instructor.currency,
    planStatus: instructor.planStatus,
    activePlanCurrency: activePlan?.currency ?? null,
  });
}
