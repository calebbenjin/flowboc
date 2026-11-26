"use client";

import * as React from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { currencies, money } from "@/lib/demo";
import { useLaunchDialog } from "./LaunchDialogContext";
import { useAuthCta } from "./useAuthCta";
import type { PlanKey } from "./data";

import { starterFeatures, proFeatures } from "@/lib/plan-features";

export function Plans() {
  const {
    selectedPlan,
    setSelectedPlan,
    billingInterval,
    setBillingInterval,
    planPrices,
    pricingCurrency,
    availableCurrencies,
    setPricingCurrency,
  } = useLaunchDialog();
  const { authed, rememberedDevice } = useAuthCta();

  const trialCta = (plan: PlanKey) =>
    authed
      ? { href: "/dashboard", label: "Go to my account" }
      : rememberedDevice
        ? { href: "/auth?mode=login", label: "Log in" }
        : { href: `/auth?plan=${plan}`, label: `Start my ${planPrices[plan].label} trial` };

  const currencyLabel =
    currencies.find((c) => c.code === pricingCurrency)?.label ?? pricingCurrency;
  const price = (plan: PlanKey) => money(planPrices[plan][billingInterval], pricingCurrency);
  // Only the USD fallback prices are small enough for cents to matter in the
  // monthly equivalent — local-currency prices round to whole units.
  const monthlyEquivalent = (plan: PlanKey) => {
    const amount = planPrices[plan].annual / 12;
    return pricingCurrency === "USD"
      ? `$${amount.toFixed(2)}`
      : money(Math.round(amount), pricingCurrency);
  };
  const billingDetail = (plan: PlanKey) =>
    billingInterval === "annual"
      ? `Billed upfront · ${monthlyEquivalent(plan)}/month equivalent · Save ${money(
          planPrices[plan].monthly * 12 - planPrices[plan].annual,
          pricingCurrency,
        )}/year`
      : `Billed monthly in ${pricingCurrency}.`;

  return (
    <section id="pricing" className="bg-[#f3efe5] px-5 py-16 sm:px-8 lg:py-24">
      <div className="mx-auto w-full max-w-[1230px]">
        <div className="mx-auto max-w-[650px] text-center">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.17em] text-[#6355ff]">
            A foundation for your business
          </p>
          <h2 className="display mt-4 text-4xl leading-[1.08] tracking-tight text-[#272334] sm:text-5xl">
            Invest in the business
            <br />
            <em className="font-normal italic text-[#6355ff]">you are building.</em>
          </h2>
          <p className="mt-5 text-sm leading-[1.85] text-[#716277]">
            Give your teaching a professional home. Start with a 14-day free trial, then choose the
            plan that fits your business.
          </p>
        </div>

        <div className="mt-8 text-center">
          <div className="inline-flex gap-1 rounded-full border border-[#e3d8e7] bg-[#ebe5ed] p-1">
            {(["monthly", "annual"] as const).map((interval) => (
              <button
                key={interval}
                onClick={() => setBillingInterval(interval)}
                className={cn(
                  "flex items-center gap-2 rounded-full px-5 py-2.5 text-sm",
                  billingInterval === interval ? "bg-[#6355ff] text-white" : "text-[#4a4152]",
                )}
              >
                {interval === "monthly" ? "Monthly" : "Annual"}
                {interval === "annual" && (
                  <span className="rounded bg-[#dcf5d5] px-1.5 py-0.5 text-[0.6rem] text-[#58724b]">
                    2 months free
                  </span>
                )}
              </button>
            ))}
          </div>
          {availableCurrencies.length > 1 ? (
            <label className="mt-3 inline-flex items-center gap-2 text-xs text-[#a08ba7]">
              Prices in
              <select
                value={pricingCurrency}
                onChange={(e) => setPricingCurrency(e.target.value as typeof pricingCurrency)}
                className="rounded-full border border-[#e3d8e7] bg-[#fffdf8] px-3 py-1.5 text-xs text-[#4a4152]"
              >
                {availableCurrencies.map((code) => (
                  <option key={code} value={code}>
                    {currencies.find((c) => c.code === code)?.label ?? code} ({code})
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <p className="mt-3 text-xs text-[#a08ba7]">
              All subscription prices are in {currencyLabel} ({pricingCurrency}).
            </p>
          )}
        </div>

        <div className="mx-auto mt-8 max-w-[500px] text-center">
          <span className="text-xs text-[#ab95b1]">Find your starting point</span>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {(
              [
                ["starter", "I want to run my classes"],
                ["pro", "I want to grow my brand & offers"],
              ] as [PlanKey, string][]
            ).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setSelectedPlan(key)}
                className={cn(
                  "rounded-full border border-[#e4d9e7] px-4 py-2 text-xs text-[#a38bab]",
                  selectedPlan === key && "border-[#d9c9e9] bg-[#e9e0f5] text-[#8e6db4]",
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="mt-3 min-h-[18px] text-xs text-[#a28aaa]" aria-live="polite">
            {selectedPlan === "pro"
              ? "Pro adds custom page design, newsletters, additional offers, and detailed business insights."
              : "Starter brings your classes, recurring schedule, and bookings together."}
          </p>
        </div>

        <div className="mx-auto mt-10 grid max-w-[890px] gap-6 sm:grid-cols-2">
          <article
            className={cn(
              "flex flex-col rounded-[21px] border border-[#e7dce9] bg-[#fffdf8] p-8",
              selectedPlan === "starter" && "border-[#a98cbf] shadow-[0_0_0_1px_#a98cbf]",
            )}
          >
            <div className="flex min-h-[22px] items-center justify-between text-[0.6rem] font-semibold tracking-[0.05em] text-[#9e80b5]">
              <span>STARTER</span>
              {selectedPlan === "starter" && (
                <span className="rounded-md bg-[#f0e5fa] px-2 py-1 text-[0.5rem] text-[#a580c4]">
                  YOUR STARTING POINT
                </span>
              )}
            </div>
            <h3 className="display mt-5 text-3xl leading-tight text-[#493150]">
              A professional
              <br />
              place to begin.
            </h3>
            <p className="mt-4 text-sm text-[#806187]">
              Run your classes with a simpler everyday workflow.
            </p>
            <div className="mt-6">
              <div className="flex items-baseline gap-2">
                <strong className="display text-5xl text-[#493150]">{price("starter")}</strong>
                <span className="text-sm text-[#ac90b3]">
                  / {billingInterval === "annual" ? "year" : "month"}
                </span>
              </div>
              <p className="mt-2 min-h-[17px] text-xs text-[#b096b9]">{billingDetail("starter")}</p>
            </div>
            <ul className="mt-5 flex-1 space-y-2.5 border-t border-[#eadfed] py-5 text-sm text-[#806187]">
              {starterFeatures.map((f) => (
                <li key={f} className="flex items-start gap-2.5">
                  <Check className="mt-0.5 size-3.5 shrink-0 text-[#af8dc1]" />
                  {f}
                </li>
              ))}
            </ul>
            <Button
              asChild
              variant="outline"
              className="w-full border-[#6355ff] text-[#6355ff] hover:bg-[#eeebff]"
            >
              <Link href={trialCta("starter").href}>{trialCta("starter").label}</Link>
            </Button>
          </article>

          <article className="flex flex-col rounded-[21px] border border-[#322640] bg-[#322640] p-8 text-[#f8f1fc] shadow-[0_15px_35px_rgba(55,35,67,0.18)]">
            <div className="flex min-h-[22px] items-center justify-between text-[0.6rem] font-semibold tracking-[0.05em] text-[#c4aed6]">
              <span>PRO</span>
              {selectedPlan === "pro" && (
                <span className="rounded-md bg-[#665078] px-2 py-1 text-[0.5rem] text-[#e0caee]">
                  YOUR STARTING POINT
                </span>
              )}
            </div>
            <h3 className="display mt-5 text-3xl leading-tight text-[#fff9f1]">
              Your brand.
              <br />
              Room to grow.
            </h3>
            <p className="mt-4 text-sm text-[#c1a7cb]">
              Build your presence and offer more of what you teach.
            </p>
            <div className="mt-6">
              <div className="flex items-baseline gap-2">
                <strong className="display text-5xl text-[#fff9f1]">{price("pro")}</strong>
                <span className="text-sm text-[#c1a7cb]">
                  / {billingInterval === "annual" ? "year" : "month"}
                </span>
              </div>
              <p className="mt-2 min-h-[17px] text-xs text-[#af94bf]">{billingDetail("pro")}</p>
            </div>
            <ul className="mt-5 flex-1 space-y-2.5 border-t border-[#574061] py-5 text-sm text-[#d2bbda]">
              {proFeatures.map((f) => (
                <li key={f} className="flex items-start gap-2.5">
                  <Check className="mt-0.5 size-3.5 shrink-0 text-[#c2e6a0]" />
                  {f}
                </li>
              ))}
            </ul>
            <Button asChild className="w-full bg-[#d5ecb4] text-[#3e4935] hover:bg-[#e3f6c9]">
              <Link href={trialCta("pro").href}>{trialCta("pro").label}</Link>
            </Button>
          </article>
        </div>

        <p className="mx-auto mt-8 max-w-[500px] text-center text-xs leading-[2] text-[#9f83aa]">
          <strong className="font-medium text-[#84618f]">0% Flowboc commission on sales.</strong>{" "}
          Payment processor fees apply.
          <br />
          14-day free trial · No card required
          <br />
          <span className="text-[0.65rem] text-[#b198bb]">
            Annual plans are billed upfront when you subscribe. Online payments require a supported
            country and currency and completed payout setup.
          </span>
        </p>
      </div>
    </section>
  );
}
