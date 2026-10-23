import { prisma } from "@/lib/db";
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

export async function getAllActivePlans() {
  return prisma.subscriptionPlan.findMany({ where: { active: true } });
}

// Searches every row ever created (not just the currently active one) so a
// webhook event for a subscriber on a now-superseded plan still resolves —
// see the model comment in prisma/schema.prisma.
export async function getPlanByCode(planCode: string) {
  return prisma.subscriptionPlan.findFirst({ where: { providerPlanCode: planCode } });
}
