"use server";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/require-admin";
import { getActivePlan } from "@/lib/subscription-plans";
import { createSubscriptionPlan, StartbuttonError } from "@/lib/startbutton";
import { siteUrl } from "@/lib/site";
import type { CurrencyCode, PlanTier } from "@/generated/prisma/enums";

type SetPriceResult = { ok: true; planCode: string } | { ok: false; error: string };

type ActionResult =
  { ok: true; monthlyPlanCode: string; annualPlanCode: string } | { ok: false; error: string };

const TIER_LABEL: Record<PlanTier, string> = {
  STARTER: "Starter",
  PRO: "Pro",
  PREMIUM: "Premium",
};

async function setPriceForInterval(
  currency: CurrencyCode,
  tier: PlanTier,
  interval: "MONTHLY" | "ANNUAL",
  price: number,
): Promise<SetPriceResult> {
  const current = await getActivePlan(currency, interval, tier);
  if (current && current.price === price) return { ok: true, planCode: current.providerPlanCode };

  const tierLabel = TIER_LABEL[tier];
  const intervalLabel = interval === "MONTHLY" ? "monthly" : "annual";

  let planCode: string;
  let checkoutLink: string;
  try {
    const result = await createSubscriptionPlan({
      // Startbutton plan names must be unique and plans are immutable, so a
      // name keyed only on tier/interval/currency collides with whatever was
      // last created for that combo (even if it's since been deactivated
      // here — Startbutton still has it on file). Suffixing the price and a
      // timestamp keeps every create call unique, including re-selecting a
      // price that was used before.
      name: `Flowboc ${tierLabel} (${intervalLabel}, ${currency}) — ${price} — ${Date.now()}`,
      description: `Flowboc ${tierLabel} subscription — ${intervalLabel} billing in ${currency}`,
      amount: price,
      currency,
      interval,
      redirectUrl: `${siteUrl}/dashboard/billing`,
    });
    planCode = result.providerPlanCode;
    checkoutLink = result.checkoutLink;
  } catch (err) {
    return {
      ok: false,
      error: err instanceof StartbuttonError ? err.message : "Couldn't create Startbutton plan.",
    };
  }

  await prisma.$transaction([
    // Scoped to this tier only — Starter/Pro/Premium each keep their own
    // active plan per currency+interval; deactivating here must not touch
    // the other two tiers' rows.
    prisma.subscriptionPlan.updateMany({
      where: { currency, interval, tier, active: true },
      data: { active: false },
    }),
    prisma.subscriptionPlan.create({
      data: {
        currency,
        interval,
        tier,
        price,
        providerPlanCode: planCode,
        checkoutLink,
        active: true,
      },
    }),
  ]);

  return { ok: true, planCode };
}

export async function adminSetPrices(input: {
  currency: CurrencyCode;
  tier: PlanTier;
  monthly: number;
  annual: number;
}): Promise<ActionResult> {
  await requireAdmin();

  if (!Number.isInteger(input.monthly) || input.monthly <= 0) {
    return { ok: false, error: "Monthly price must be a positive whole number." };
  }
  if (!Number.isInteger(input.annual) || input.annual <= 0) {
    return { ok: false, error: "Annual price must be a positive whole number." };
  }

  const monthlyResult = await setPriceForInterval(
    input.currency,
    input.tier,
    "MONTHLY",
    input.monthly,
  );
  if (!monthlyResult.ok) return monthlyResult;

  const annualResult = await setPriceForInterval(
    input.currency,
    input.tier,
    "ANNUAL",
    input.annual,
  );
  if (!annualResult.ok) return annualResult;

  return {
    ok: true,
    monthlyPlanCode: monthlyResult.planCode,
    annualPlanCode: annualResult.planCode,
  };
}
