import type { CurrencyCode, PayoutProvider } from "@/generated/prisma/enums";

// NGN/ZAR/KES settle better through Paystack than Stripe; the rest go
// through Stripe. Mirrors the mapping in src/lib/demo.ts's `currencies`.
const PAYSTACK_CURRENCIES = new Set<CurrencyCode>(["NGN", "ZAR", "KES"]);

export function payoutProviderForCurrency(currency: CurrencyCode): PayoutProvider {
  return PAYSTACK_CURRENCIES.has(currency) ? "PAYSTACK" : "STRIPE";
}
