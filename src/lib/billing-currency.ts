import type { CurrencyCode } from "@/generated/prisma/enums";

// Currencies Flowboc subscriptions can bill in. Startbutton doesn't support
// USD, so instructors pay in their own local currency instead — each one
// needs its own set of plans priced by hand on /admin/pricing (no live FX
// conversion: Startbutton plans are immutable, so a moving rate would mean
// a new plan every time it moved). Keep this list to currencies confirmed
// to support recurring subscriptions in the Startbutton sandbox, not just
// one-off payments.
export const SUBSCRIPTION_CURRENCIES: CurrencyCode[] = ["NGN", "GHS", "KES", "ZAR", "XOF"];

export function isSubscriptionCurrency(currency: CurrencyCode): boolean {
  return SUBSCRIPTION_CURRENCIES.includes(currency);
}

// Which currency an instructor's subscription bills in — null means paid
// plans aren't available in their currency yet (e.g. USD/GBP/EUR), and the
// billing page shows a "coming to your region" message instead of plans.
//
// While ACTIVE, the currency stays locked to the plan they're actually
// subscribed on (activePlanCurrency, resolved from subscriptionPlanCode),
// so switching tiers keeps billing in the same currency even if they've
// since changed Instructor.currency for their students. Otherwise it's
// just their current Instructor.currency.
export function resolveBillingCurrency(instructor: {
  currency: CurrencyCode;
  planStatus: string;
  activePlanCurrency: CurrencyCode | null;
}): CurrencyCode | null {
  if (
    instructor.planStatus === "ACTIVE" &&
    instructor.activePlanCurrency &&
    isSubscriptionCurrency(instructor.activePlanCurrency)
  ) {
    return instructor.activePlanCurrency;
  }
  return isSubscriptionCurrency(instructor.currency) ? instructor.currency : null;
}

// ISO 3166 country (e.g. Vercel's x-vercel-ip-country header) → the
// subscription currency visitors there most likely pay in. Used only to
// pick the landing page's default pricing currency — visitors can still
// switch, and what an instructor is actually billed in comes from
// resolveBillingCurrency above, not their location.
const COUNTRY_CURRENCY: Record<string, CurrencyCode> = {
  NG: "NGN",
  GH: "GHS",
  KE: "KES",
  ZA: "ZAR",
  // WAEMU member states, which all use the West African CFA franc.
  BJ: "XOF",
  BF: "XOF",
  CI: "XOF",
  GW: "XOF",
  ML: "XOF",
  NE: "XOF",
  SN: "XOF",
  TG: "XOF",
};

export function currencyForCountry(country: string | null | undefined): CurrencyCode | null {
  return (country && COUNTRY_CURRENCY[country.toUpperCase()]) || null;
}
