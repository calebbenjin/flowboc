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
