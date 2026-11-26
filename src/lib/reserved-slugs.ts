// Mirrors every top-level route under src/app — an instructor's public
// booking page lives at /{slug}, so the slug can't collide with these.
export const RESERVED_SLUGS = new Set([
  "home", // landing page segment (served at "/" via rewrite)
  "about",
  "api",
  "auth",
  "contact",
  "dashboard",
  "guides",
  "onboarding",
  "privacy",
  "r",
  "referral-program",
  "terms",
  "unsubscribe",
  "_next",
  "favicon.ico",
  "robots.txt",
  "sitemap.xml",
  "icon",
  "apple-icon",
  "opengraph-image",
]);

const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,48}[a-z0-9])?$/;

export function isValidSlugFormat(slug: string): boolean {
  return SLUG_PATTERN.test(slug);
}

export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.has(slug.toLowerCase());
}
