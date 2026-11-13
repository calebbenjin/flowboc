"use client";

import { useEffect, useState } from "react";
import { BRIGHTNESS_SAMPLE_WIDTH, optimizedImageUrl } from "./public-page-background";

const SAMPLE_SIZE = 32;
const BRIGHT_THRESHOLD = 140;
// The instructor header always sits near the top of the page, so brightness
// is judged from the top slice of the image rather than the whole photo —
// averaging the whole thing lets a dark subject in the lower frame mask a
// bright backdrop right behind the header text.
const TOP_SLICE_RATIO = 0.32;

// Downsamples the image onto a tiny canvas and averages perceived luminance,
// so a photo/background picked by the instructor can flip overlaid text to
// dark when it's too light for white text to stay legible.
export function useIsBrightImage(url: string | null | undefined): boolean {
  const [isBright, setIsBright] = useState(false);

  useEffect(() => {
    if (!url) {
      setIsBright(false);
      return;
    }

    let cancelled = false;
    const img = new window.Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      if (cancelled) return;
      try {
        const canvas = document.createElement("canvas");
        canvas.width = SAMPLE_SIZE;
        canvas.height = SAMPLE_SIZE;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        const sliceHeight = Math.max(1, Math.round(img.naturalHeight * TOP_SLICE_RATIO));
        ctx.drawImage(img, 0, 0, img.naturalWidth, sliceHeight, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
        const { data } = ctx.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE);

        let total = 0;
        let count = 0;
        for (let i = 0; i < data.length; i += 4) {
          total += 0.299 * data[i]! + 0.587 * data[i + 1]! + 0.114 * data[i + 2]!;
          count += 1;
        }
        if (!cancelled) setIsBright(total / count > BRIGHT_THRESHOLD);
      } catch {
        // Canvas tainted by a cross-origin image without CORS headers —
        // keep the default (dark background assumed, white text).
      }
    };
    img.onerror = () => {
      if (!cancelled) setIsBright(false);
    };
    // A 64px-wide optimized variant is all the 32×32 sample needs — no
    // point re-downloading the full background just to average its pixels.
    img.src = optimizedImageUrl(url, BRIGHTNESS_SAMPLE_WIDTH);

    return () => {
      cancelled = true;
    };
  }, [url]);

  return isBright;
}
