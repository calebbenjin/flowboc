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
    return bg.backgroundImageUrl ? `url(${bg.backgroundImageUrl})` : null;
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
