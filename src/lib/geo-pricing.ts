// ISO 3166-1 alpha-2 codes for the 54 UN-recognized African states.
const AFRICAN_COUNTRY_CODES = new Set([
  "DZ",
  "AO",
  "BJ",
  "BW",
  "BF",
  "BI",
  "CV",
  "CM",
  "CF",
  "TD",
  "KM",
  "CG",
  "CD",
  "CI",
  "DJ",
  "EG",
  "GQ",
  "ER",
  "SZ",
  "ET",
  "GA",
  "GM",
  "GH",
  "GN",
  "GW",
  "KE",
  "LS",
  "LR",
  "LY",
  "MG",
  "MW",
  "ML",
  "MR",
  "MU",
  "MA",
  "MZ",
  "NA",
  "NE",
  "NG",
  "RW",
  "ST",
  "SN",
  "SC",
  "SL",
  "SO",
  "ZA",
  "SS",
  "SD",
  "TZ",
  "TG",
  "TN",
  "UG",
  "ZM",
  "ZW",
]);

export function isAfricanCountry(countryCode: string | null | undefined): boolean {
  return !!countryCode && AFRICAN_COUNTRY_CODES.has(countryCode.toUpperCase());
}

export function countryName(countryCode: string): string {
  return new Intl.DisplayNames(["en"], { type: "region" }).of(countryCode) ?? countryCode;
}

export const STANDARD_MONTHLY_PRICE = 19;
export const REGIONAL_DISCOUNT_MONTHLY_PRICE = 15;

// Countries that use the West African CFA franc — Paystack's XOF support is
// scoped to Côte d'Ivoire operationally (see COUNTRY_BY_CURRENCY in
// src/lib/paystack.ts), but the currency itself is shared across all of
// these, so any of them gets shown the real XOF price.
const XOF_COUNTRY_CODES = ["BJ", "BF", "CI", "GW", "ML", "NE", "SN", "TG"];

// Maps a visitor's IP country to one of the 5 currencies Flowboc actually
// bills subscriptions in (see src/lib/payout.ts's PAYSTACK_CURRENCIES).
// Everything else falls back to the USD estimate below (isAfricanCountry).
const COUNTRY_TO_PAYSTACK_CURRENCY: Record<string, "NGN" | "GHS" | "ZAR" | "KES" | "XOF"> = {
  NG: "NGN",
  GH: "GHS",
  ZA: "ZAR",
  KE: "KES",
  ...Object.fromEntries(XOF_COUNTRY_CODES.map((code) => [code, "XOF" as const])),
};

export function paystackCurrencyForCountry(
  countryCode: string | null | undefined,
): "NGN" | "GHS" | "ZAR" | "KES" | "XOF" | null {
  if (!countryCode) return null;
  return COUNTRY_TO_PAYSTACK_CURRENCY[countryCode.toUpperCase()] ?? null;
}
