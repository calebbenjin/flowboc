import { accessBlockedReason } from "./trial.ts";

export const PAGE_TEMPLATES = ["STANDARD", "SAGE"] as const;
export type PublicPageTemplate = (typeof PAGE_TEMPLATES)[number];
export const PAGE_FONTS = ["EDITORIAL", "LITERARY", "MODERN"] as const;
export type PublicPageFont = (typeof PAGE_FONTS)[number];
export const SAGE_COVER = "/themes/sage/cover.png";
export const SAGE_PREVIEW = "/themes/sage/preview.png";
export const PUBLIC_FONT_OPTIONS = [
  {
    value: "EDITORIAL",
    label: "Editorial",
    description: "Fraunces headings · DM Sans text",
    heading: "var(--font-fraunces), Georgia, serif",
    body: "var(--font-dm-sans), sans-serif",
  },
  {
    value: "LITERARY",
    label: "Literary",
    description: "Georgia headings · DM Sans text",
    heading: "Georgia, 'Times New Roman', serif",
    body: "var(--font-dm-sans), sans-serif",
  },
  {
    value: "MODERN",
    label: "Modern",
    description: "DM Sans throughout",
    heading: "var(--font-dm-sans), sans-serif",
    body: "var(--font-dm-sans), sans-serif",
  },
] as const;

export function publicFont(value?: string) {
  return PUBLIC_FONT_OPTIONS.find((font) => font.value === value) ?? PUBLIC_FONT_OPTIONS[0];
}
export function canUseProDesign(
  instructor: Parameters<typeof accessBlockedReason>[0] & { planTier: string },
): boolean {
  return (
    ["PRO", "PREMIUM"].includes(instructor.planTier) && accessBlockedReason(instructor) === null
  );
}
export function effectivePublicTheme(
  instructor: Parameters<typeof canUseProDesign>[0] & {
    pageTemplate: string;
    pageFont: string;
    coverImageUrl: string | null;
  },
) {
  if (!canUseProDesign(instructor))
    return {
      pageTemplate: "STANDARD" as PublicPageTemplate,
      pageFont: "EDITORIAL" as PublicPageFont,
      coverImageUrl: null,
    };
  return {
    pageTemplate: (PAGE_TEMPLATES.includes(instructor.pageTemplate as PublicPageTemplate)
      ? instructor.pageTemplate
      : "STANDARD") as PublicPageTemplate,
    pageFont: (PAGE_FONTS.includes(instructor.pageFont as PublicPageFont)
      ? instructor.pageFont
      : "EDITORIAL") as PublicPageFont,
    coverImageUrl: instructor.coverImageUrl,
  };
}
