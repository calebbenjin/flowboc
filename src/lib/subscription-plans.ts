import { prisma } from "@/lib/db";
import type { BillingInterval, CurrencyCode } from "@/generated/prisma/enums";

export async function getActivePlan(currency: CurrencyCode, interval: BillingInterval) {
  return prisma.subscriptionPlan.findFirst({ where: { currency, interval, active: true } });
}

export async function getActivePlansForCurrency(
  currency: CurrencyCode,
): Promise<Record<BillingInterval, { price: number; planCode: string } | null>> {
  const rows = await prisma.subscriptionPlan.findMany({ where: { currency, active: true } });
  const monthly = rows.find((r) => r.interval === "MONTHLY") ?? null;
  const annual = rows.find((r) => r.interval === "ANNUAL") ?? null;
  return {
    MONTHLY: monthly ? { price: monthly.price, planCode: monthly.providerPlanCode } : null,
    ANNUAL: annual ? { price: annual.price, planCode: annual.providerPlanCode } : null,
  };
}

export async function getAllActivePlans() {
  return prisma.subscriptionPlan.findMany({ where: { active: true } });
}

// Searches every row ever created (not just the currently active one) so a
// webhook event for a subscriber on a now-superseded plan still resolves —
// see the model comment in prisma/schema.prisma.
export async function intervalForPlanCode(planCode: string): Promise<BillingInterval | null> {
  const plan = await prisma.subscriptionPlan.findFirst({ where: { providerPlanCode: planCode } });
  return plan?.interval ?? null;
}
