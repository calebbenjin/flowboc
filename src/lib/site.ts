export const siteUrl = process.env["NEXT_PUBLIC_SITE_URL"] ?? "https://www.flowboc.com";

// Bare host, no protocol — for display strings like "flowboc.com/{slug}".
// Derived from siteUrl rather than hardcoded again so the domain only ever
// lives in one place.
export const siteHost = siteUrl.replace(/^https?:\/\//, "");

export const siteName = "Flowboc";

export const supportEmail = "hello@flowboc.com";
export const contactEmail = "mail@flowboc.com";

export const siteTitle = "Flowboc — Simple booking for yoga instructors";

export const siteDescription =
  "Create your class, share your booking link, get paid. Booking software for independent yoga teachers.";

export const siteKeywords = [
  "yoga booking software",
  "yoga class scheduling",
  "booking link for yoga teachers",
  "independent yoga instructor tools",
  "yoga class payments",
];
