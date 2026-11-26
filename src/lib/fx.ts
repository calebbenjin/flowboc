import type { CurrencyCode } from "@/generated/prisma/enums";

// Exchange rates for converting referral commissions between currencies
// (see src/lib/referral-code.ts). Uses ExchangeRate-API's free, keyless
// open endpoint — official mid-market rates updated daily, which covers
// every CurrencyCode. Cached for an hour so a burst of webhooks doesn't
// refetch the same table.
const FX_BASE = "https://open.er-api.com/v6/latest";

// Null when the rate can't be fetched — callers must leave the conversion
// pending and retry later rather than guess.
export async function getFxRate(from: CurrencyCode, to: CurrencyCode): Promise<number | null> {
  if (from === to) return 1;
  try {
    const res = await fetch(`${FX_BASE}/${from}`, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const body = (await res.json()) as { result?: string; rates?: Record<string, number> };
    const rate = body.result === "success" ? body.rates?.[to] : undefined;
    return typeof rate === "number" && rate > 0 ? rate : null;
  } catch {
    return null;
  }
}

// Whole-unit amounts throughout, same convention as every price/commission.
export function convertAmount(amount: number, rate: number): number {
  return Math.round(amount * rate);
}
