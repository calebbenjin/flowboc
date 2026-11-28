export const siteUrl = process.env["NEXT_PUBLIC_SITE_URL"] ?? "https://www.flowboc.com";

// Bare host, no protocol — for display strings like "flowboc.com/{slug}".
// Derived from siteUrl rather than hardcoded again so the domain only ever
// lives in one place.
export const siteHost = siteUrl.replace(/^https?:\/\//, "");

export const siteName = "Flowboc";

export const supportEmail = "hello@flowboc.com";
export const contactEmail = "mail@flowboc.com";

export const siteTitle = "Flowboc — Booking and payments for yoga instructors in Africa";

export const siteDescription =
  "Create your class, share your booking link, get paid in naira, cedi, shilling, rand or CFA. Booking software for independent yoga instructors in Nigeria, Ghana, Kenya, South Africa and West Africa.";

export const siteKeywords = [
  "yoga booking software",
  "yoga booking app Nigeria",
  "yoga class booking Lagos",
  "yoga booking software Ghana",
  "yoga booking software Kenya",
  "yoga booking software South Africa",
  "accept payments for yoga classes",
  "Paystack booking page",
  "mobile money class payments",
  "independent yoga instructor tools",
];

// Where online payments and subscriptions are live — kept in step with
// PAYSTACK_CURRENCIES / SUBSCRIPTION_CURRENCIES. Feeds areaServed in the
// landing page's structured data so search engines see the actual market.
export const siteMarkets = [
  { country: "Nigeria", code: "NG" },
  { country: "Ghana", code: "GH" },
  { country: "Kenya", code: "KE" },
  { country: "South Africa", code: "ZA" },
  { country: "Côte d'Ivoire", code: "CI" },
];
