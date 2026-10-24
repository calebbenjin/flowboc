"use client";

import Link from "next/link";
import { Check, Star, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Reveal, Section } from "./primitives";
import type { BillingInterval, PlanTier } from "@/generated/prisma/enums";

type Feature = string | { label: string; soon: true };
type PlanTierKey = "STARTER" | "PRO" | "PREMIUM";
type PlanInfo = { price: number; planCode: string } | null;
type PlansByTier = Record<PlanTier, Record<BillingInterval, PlanInfo>>;

type Tier = {
  name: string;
  tierKey: PlanTierKey;
  recommended?: boolean;
  annual: number;
  monthly: number;
  includesLabel: string;
  features: Feature[];
  excludedLabel?: string;
  excludedFeatures?: string[];
  cta: string;
};

function featureLabel(f: Feature) {
  return typeof f === "string" ? f : f.label;
}

function featureIsSoon(f: Feature) {
  return typeof f !== "string" && f.soon;
}

const PRO_FEATURES = [
  "0% transaction fees",
  "Sell and earn from classes",
  "Custom page design & themes",
  "Recurring classes",
  "Newsletter for students",
  "Attendance tracking",
  "Revenue analytics & exports",
];

const tiers: Tier[] = [
  {
    name: "Starter",
    tierKey: "STARTER",
    annual: 7,
    monthly: 9,
    includesLabel: "Perfect for getting started:",
    features: [
      "Personalized booking page",
      "Unlimited classes",
      "Online payments",
      "Attendance tracking",
    ],
    excludedLabel: "Not included — upgrade to Pro for:",
    // excludedFeatures: PRO_FEATURES,
    cta: "Get started",
  },
  {
    name: "Pro",
    tierKey: "PRO",
    recommended: true,
    annual: 14,
    monthly: 17,
    includesLabel: "Everything in Starter, plus:",
    features: PRO_FEATURES,
    cta: "Try free for 7 days",
  },
  {
    name: "Premium",
    tierKey: "PREMIUM",
    annual: 30,
    monthly: 35,
    includesLabel: "Everything in Pro, plus:",
    features: [
      "Memberships & subscriptions",
      "Sell and earn merchandise/kits",
      "Equipment/room booking",
      "Gift classes & vouchers",
      "Create class AI assistant",
      "Multi-location studio management",
      "Priority support",
      // { label: "AI booking assistant", soon: true },
      // { label: "Multi-location studio management", soon: true },
    ],
    cta: "Try free for 7 days",
  },
];

function PricingCard({
  tier,
  live,
}: {
  tier: Tier;
  live: Record<BillingInterval, PlanInfo> | undefined;
}) {
  const monthlyPlan = live?.MONTHLY ?? null;
  const annualPlan = live?.ANNUAL ?? null;

  // The ANNUAL row's price is already the per-month rate for annual
  // billing (set directly in the admin pricing panel, independent of the
  // MONTHLY row) — not a yearly total, so no conversion here.
  const annualDisplay = annualPlan ? `$${annualPlan.price}` : `$${tier.annual}`;
  const monthlyDisplay = monthlyPlan ? `$${monthlyPlan.price}` : `$${tier.monthly}`;

  return (
    <div className="relative">
      {tier.recommended && (
        <span className="absolute -top-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1. border border-primary rounded-full bg-violet-100 px-3.5 py-1.5 text-md font-bold text-clay shadow-[var(--shadow-soft)]">
          <Star className="size-4 fill-current mr-2" /> Recommended
        </span>
      )}

      <div
        className={cn(
          "flex h-full flex-col overflow-hidden rounded-2xl border bg-card",
          tier.recommended ? "border-2 border-clay" : "border-border",
        )}
      >
        <div
          className={cn(
            "border-b px-7 pb-6 pt-8",
            tier.recommended ? "border-clay/15 bg-primary" : "border-border bg-foreground/5",
          )}
        >
          <h3
            className={cn(
              "font-sans text-3xl font-extrabold",
              tier.recommended ? "text-white" : "text-foreground",
            )}
          >
            {tier.name}
          </h3>
        </div>

        <div className={cn("flex flex-1 flex-col px-7 pb-7 pt-6", tier.recommended && "bg-clay/5")}>
          <p className="flex items-end gap-1">
            <span className="font-sans sm:text-6xl text-4xl font-extrabold text-foreground">
              {annualDisplay}
            </span>
            <span className="pb-1 text-base sm:text-lg text-muted-foreground">/mo</span>
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Billed annually, or {monthlyDisplay} monthly
          </p>

          <Button
            asChild
            size="lg"
            variant={tier.recommended ? "clay" : "outline"}
            className="mt-6 w-full rounded-full font-bold"
          >
            <Link href={`/auth?plan=${tier.name.toLowerCase()}`}>{tier.cta}</Link>
          </Button>

          <div
            className={cn("my-7 border-t", tier.recommended ? "border-clay/15" : "border-border")}
          />

          <ul className="flex-1 space-y-2">
            <li className="text-sm text-muted-foreground">{tier.includesLabel}</li>
            {tier.features.map((f) => {
              const label = featureLabel(f);
              const soon = featureIsSoon(f);
              return (
                <li
                  key={label}
                  className={cn(
                    "flex items-center gap-3 text-base font-bold",
                    soon ? "text-muted-foreground" : "text-foreground",
                  )}
                >
                  <span
                    className={cn(
                      "grid size-6 shrink-0 place-items-center rounded-full",
                      soon
                        ? "bg-foreground/5 text-muted-foreground/60"
                        : tier.recommended
                          ? "bg-clay/20 text-clay"
                          : "bg-foreground/8 text-foreground",
                    )}
                  >
                    <Check className="size-3.5" />
                  </span>
                  {label}
                  {soon && (
                    <span className="rounded-full bg-foreground/5 px-2 py-0.5 text-[0.65rem] font-medium text-muted-foreground">
                      Coming soon
                    </span>
                  )}
                </li>
              );
            })}

            {tier.excludedFeatures && tier.excludedFeatures.length > 0 && (
              <>
                <li className="pt-3 text-sm text-muted-foreground">{tier.excludedLabel}</li>
                {tier.excludedFeatures.map((f) => (
                  <li key={f} className="flex items-center gap-3 text-base text-muted-foreground">
                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-foreground/5 text-muted-foreground/60">
                      <X className="size-3.5" />
                    </span>
                    {f}
                  </li>
                ))}
              </>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}

export function Pricing({ plans }: { plans: PlansByTier }) {
  return (
    <Section id="pricing" className="bg-sand/30">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="font-sans text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
          Pick your plan. Make it yours.
        </h2>
        <p className="mt-4 text-lg text-muted-foreground">
          Simple pricing with powerful features, cancel anytime.
        </p>
      </div>

      <div className="mx-auto mt-14 grid max-w-6xl grid-cols-1 items-start gap-8 lg:grid-cols-3">
        {tiers.map((tier, i) => (
          <Reveal key={tier.name} delay={i * 0.1}>
            <PricingCard tier={tier} live={plans[tier.tierKey]} />
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
