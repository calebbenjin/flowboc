import type { CurrencyCode } from "@/generated/prisma/enums";
import { SUBSCRIPTION_CURRENCIES } from "./startbutton";

// Only the handful of countries that map 1:1 onto a currency Startbutton
// actually bills subscriptions in (see SUBSCRIPTION_CURRENCIES) — anyone
// else (including the rest of Africa) falls back to the static USD pricing
// shown by default, rather than guessing at a currency with no real plan
// behind it.
const COUNTRY_TO_SUBSCRIPTION_CURRENCY: Partial<Record<string, CurrencyCode>> = {
  NG: "NGN",
  GH: "GHS",
  KE: "KES",
  ZA: "ZAR",
};

export function subscriptionCurrencyForCountry(
  countryCode: string | null | undefined,
): CurrencyCode | null {
  if (!countryCode) return null;
  const currency = COUNTRY_TO_SUBSCRIPTION_CURRENCY[countryCode.toUpperCase()];
  if (!currency) return null;
  return SUBSCRIPTION_CURRENCIES.includes(currency) ? currency : null;
}
