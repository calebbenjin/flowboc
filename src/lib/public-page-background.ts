export type BackgroundType = "IMAGE" | "COLOR" | "GRADIENT";

export type PageBackground = {
  backgroundType: BackgroundType;
  backgroundImageUrl: string | null;
  backgroundColor: string | null;
  backgroundGradientFrom: string | null;
  backgroundGradientTo: string | null;
};

// Matches useIsBrightImage's BRIGHT_THRESHOLD (src/lib/use-image-brightness.ts)
// so a flat color/gradient background flips hero text dark at the same
// perceived-brightness point a sampled photo would.
const BRIGHT_THRESHOLD = 140;

// Widths must be in next.config's default deviceSizes/imageSizes list, or the
// optimizer rejects the request.
export const BACKGROUND_IMAGE_WIDTH = 1920;
export const BRIGHTNESS_SAMPLE_WIDTH = 64;

// Routes an uploaded (Vercel Blob) image through Next's image optimizer so a
// CSS background — which can't use <Image> — is still served resized and
// re-encoded. Other hosts aren't in `images.remotePatterns`, so they pass
// through untouched rather than 400 at /_next/image.
export function optimizedImageUrl(src: string, width: number, quality = 70): string {
  let host: string;
  try {
    host = new URL(src).hostname;
  } catch {
    return src;
  }
  if (!host.endsWith(".public.blob.vercel-storage.com")) return src;
  return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=${quality}`;
}

function hexLuminance(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

export function isColorBright(hex: string): boolean {
  return hexLuminance(hex) > BRIGHT_THRESHOLD;
}

// Whether a background is actually showing right now, vs. falling back to
// the page's default background — an IMAGE type with no url yet, or a
// COLOR/GRADIENT type whose color(s) haven't been picked yet, render
// nothing special.
export function hasActiveBackground(bg: PageBackground): boolean {
  if (bg.backgroundType === "IMAGE") return !!bg.backgroundImageUrl;
  if (bg.backgroundType === "COLOR") return !!bg.backgroundColor;
  return !!bg.backgroundGradientFrom && !!bg.backgroundGradientTo;
}

// CSS `background-image` value for IMAGE/GRADIENT — COLOR goes through
// `background-color` instead (see backgroundColorValue), since a solid
// fill has no meaningful "image" layer.
export function backgroundImageValue(bg: PageBackground): string | null {
  if (bg.backgroundType === "IMAGE") {
    return bg.backgroundImageUrl
      ? `url(${optimizedImageUrl(bg.backgroundImageUrl, BACKGROUND_IMAGE_WIDTH)})`
      : null;
  }
  if (bg.backgroundType === "GRADIENT" && bg.backgroundGradientFrom && bg.backgroundGradientTo) {
    return `linear-gradient(135deg, ${bg.backgroundGradientFrom}, ${bg.backgroundGradientTo})`;
  }
  return null;
}

export function backgroundColorValue(bg: PageBackground): string | null {
  return bg.backgroundType === "COLOR" ? bg.backgroundColor : null;
}

// Analytic brightness for a flat COLOR/GRADIENT background — there are no
// pixels to sample like useIsBrightImage does for a photo, so this reads
// the stored hex value(s) directly. Callers combine this with
// useIsBrightImage for the IMAGE case.
export function isFlatBackgroundBright(bg: PageBackground): boolean {
  if (bg.backgroundType === "COLOR" && bg.backgroundColor) {
    return isColorBright(bg.backgroundColor);
  }
  if (bg.backgroundType === "GRADIENT" && bg.backgroundGradientFrom && bg.backgroundGradientTo) {
    return (
      (hexLuminance(bg.backgroundGradientFrom) + hexLuminance(bg.backgroundGradientTo)) / 2 >
      BRIGHT_THRESHOLD
    );
  }
  return false;
}
