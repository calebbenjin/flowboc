import type { CurrencyCode, PayoutProvider } from "@/generated/prisma/enums";

// NGN/GHS/ZAR/KES/XOF settle through Paystack (the countries Paystack
// supports); the rest go through Stripe. Mirrors the mapping in
// src/lib/demo.ts's `currencies`.
export const PAYSTACK_CURRENCIES: CurrencyCode[] = ["NGN", "GHS", "ZAR", "KES", "XOF"];
const PAYSTACK_CURRENCIES_SET = new Set<CurrencyCode>(PAYSTACK_CURRENCIES);

export function payoutProviderForCurrency(currency: CurrencyCode): PayoutProvider {
  return PAYSTACK_CURRENCIES_SET.has(currency) ? "PAYSTACK" : "STRIPE";
}

// Countries where Paystack can pay out to a mobile money wallet instead of
// a bank account — confirmed against the live API.
const MOBILE_MONEY_CURRENCIES = new Set<CurrencyCode>(["GHS", "KES", "XOF"]);

export function supportsMobileMoney(currency: CurrencyCode): boolean {
  return MOBILE_MONEY_CURRENCIES.has(currency);
}

// Countries where Paystack's /bank/resolve (live account-name verification
// before saving) is available — confirmed against the live API. ZAR and
// XOF bank accounts can't be pre-verified; Paystack validates them only
// when it actually tries to settle funds.
const ACCOUNT_RESOLVE_CURRENCIES = new Set<CurrencyCode>(["NGN", "GHS", "KES"]);

export function supportsAccountResolve(currency: CurrencyCode): boolean {
  return ACCOUNT_RESOLVE_CURRENCIES.has(currency);
}

function nameWords(name: string): Set<string> {
  return new Set(
    name
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z\s]/g, " ")
      .split(/\s+/)
      // Drops initials ("A.") and titles-as-single-letters so "Sarah A
      // Boone" still matches "Sarah Boone" without weakening the check.
      .filter((w) => w.length > 1),
  );
}

// Fuzzy on purpose — bank-held names are often formatted differently
// (surname first, a middle name dropped, extra spacing) than the name an
// instructor types into their profile, so this isn't full identity
// verification. It checks that every word in the shorter name also appears
// in the longer one, which catches "wrong person's account" (near-zero
// overlap) while tolerating formatting differences for the same person.
export function namesLikelyMatch(profileName: string, bankAccountName: string): boolean {
  const a = nameWords(profileName);
  const b = nameWords(bankAccountName);
  if (a.size === 0 || b.size === 0) return false;

  const [shorter, longer] = a.size <= b.size ? [a, b] : [b, a];
  for (const word of shorter) {
    if (!longer.has(word)) return false;
  }
  return true;
}

// Paystack's published local-card rate per currency (support.paystack.com/
// en/articles/2130306, checked Oct 2026). Card rate is used as the estimate
// since it's the common case and the more conservative (higher) one — the
// actual fee Paystack settles can be lower for mobile money (e.g. Kenya
// M-PESA is 1.5% vs card's 2.9%). This only ever informs the instructor's
// estimate while setting a price; the real fee is always computed by
// Paystack itself at checkout and settlement.
type PaystackFeeFormula = { percent: number; flat?: number; cap?: number; waiveFlatUnder?: number };

const PAYSTACK_FEES: Partial<Record<CurrencyCode, PaystackFeeFormula>> = {
  NGN: { percent: 0.015, flat: 100, cap: 2000, waiveFlatUnder: 2500 },
  GHS: { percent: 0.0195 },
  KES: { percent: 0.029 },
  ZAR: { percent: 0.029, flat: 1 },
  XOF: { percent: 0.032 },
};

// Estimated Paystack fee for a given charge amount, or null for currencies
// Paystack doesn't handle (Stripe-routed) or a non-positive amount.
export function estimatePaystackFee(amount: number, currency: CurrencyCode): number | null {
  const formula = PAYSTACK_FEES[currency];
  if (!formula || amount <= 0) return null;

  let fee = amount * formula.percent;
  if (formula.flat && (!formula.waiveFlatUnder || amount >= formula.waiveFlatUnder)) {
    fee += formula.flat;
  }
  if (formula.cap) fee = Math.min(fee, formula.cap);

  return Math.round(fee * 100) / 100;
}
