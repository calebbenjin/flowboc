import type { BillingInterval, CurrencyCode } from "@/generated/prisma/enums";

export type MrrSummary = {
  // Sorted largest USD-equivalent first; mrr is in the currency's own units.
  byCurrency: {
    currency: CurrencyCode;
    subscribers: number;
    mrr: number;
    usdMrr: number | null;
  }[];
  // Sum of every currency whose USD rate was available — see missingRates.
  usdTotal: number;
  // Currencies left out of usdTotal because their rate couldn't be fetched,
  // so the page can say the total is partial rather than silently low.
  missingRates: CurrencyCode[];
};

// Monthly recurring revenue across paying subscribers, each normalized to
// a monthly amount (annual ÷ 12) in its plan's currency, then converted to
// USD only for the headline total — subscriptions bill in several local
// currencies, which can't be added up as-is. usdRates maps each currency to
// its → USD rate, null when unavailable.
export function summarizeMrr(
  subscriptions: { price: number; interval: BillingInterval; currency: CurrencyCode }[],
  usdRates: Partial<Record<CurrencyCode, number | null>>,
): MrrSummary {
  const totals = new Map<CurrencyCode, { subscribers: number; mrr: number }>();
  for (const sub of subscriptions) {
    const monthly = sub.interval === "ANNUAL" ? sub.price / 12 : sub.price;
    const entry = totals.get(sub.currency) ?? { subscribers: 0, mrr: 0 };
    entry.subscribers += 1;
    entry.mrr += monthly;
    totals.set(sub.currency, entry);
  }

  const byCurrency = [...totals].map(([currency, { subscribers, mrr }]) => {
    const rate = usdRates[currency] ?? null;
    return {
      currency,
      subscribers,
      mrr: Math.round(mrr),
      usdMrr: rate === null ? null : Math.round(mrr * rate),
    };
  });
  byCurrency.sort((a, b) => (b.usdMrr ?? -1) - (a.usdMrr ?? -1));

  return {
    byCurrency,
    usdTotal: byCurrency.reduce((sum, c) => sum + (c.usdMrr ?? 0), 0),
    missingRates: byCurrency.filter((c) => c.usdMrr === null).map((c) => c.currency),
  };
}
