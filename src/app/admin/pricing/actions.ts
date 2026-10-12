"use server";

import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/require-admin";
import { getActivePlan } from "@/lib/subscription-plans";
import { createSubscriptionPlan, StartbuttonError } from "@/lib/startbutton";
import { siteUrl } from "@/lib/site";
import type { CurrencyCode } from "@/generated/prisma/enums";

type SetPriceResult = { ok: true; planCode: string } | { ok: false; error: string };

type ActionResult =
  { ok: true; monthlyPlanCode: string; annualPlanCode: string } | { ok: false; error: string };

async function setPriceForInterval(
  currency: CurrencyCode,
  interval: "MONTHLY" | "ANNUAL",
  price: number,
): Promise<SetPriceResult> {
  const current = await getActivePlan(currency, interval);
  if (current && current.price === price) return { ok: true, planCode: current.providerPlanCode };

  let planCode: string;
  let checkoutLink: string;
  try {
    const result = await createSubscriptionPlan({
      name: `Flowbuk Pro (${interval === "MONTHLY" ? "monthly" : "annual"}, ${currency})`,
      description: `Flowbuk Pro subscription — ${interval === "MONTHLY" ? "monthly" : "annual"} billing in ${currency}`,
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
    prisma.subscriptionPlan.updateMany({
      where: { currency, interval, active: true },
      data: { active: false },
    }),
    prisma.subscriptionPlan.create({
      data: { currency, interval, price, providerPlanCode: planCode, checkoutLink, active: true },
    }),
  ]);

  return { ok: true, planCode };
}

export async function adminSetPrices(input: {
  currency: CurrencyCode;
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

  const monthlyResult = await setPriceForInterval(input.currency, "MONTHLY", input.monthly);
  if (!monthlyResult.ok) return monthlyResult;

  const annualResult = await setPriceForInterval(input.currency, "ANNUAL", input.annual);
  if (!annualResult.ok) return annualResult;

  return {
    ok: true,
    monthlyPlanCode: monthlyResult.planCode,
    annualPlanCode: annualResult.planCode,
  };
}
