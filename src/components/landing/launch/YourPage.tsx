"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { HeroBookingDemo } from "./HeroBookingDemo";
import { PhoneArch } from "./PhoneArch";
import { useAuthCta } from "./useAuthCta";
import { themeMap, type ThemeKey } from "./data";

const swatchColors: Record<ThemeKey, string> = {
  violet: "bg-[#6355ff]",
  sand: "bg-[#af774d]",
  forest: "bg-[#28654d]",
};

export function YourPage() {
  const [theme, setTheme] = React.useState<ThemeKey>("sand");
  const { authed, rememberedDevice } = useAuthCta();
  const active = themeMap[theme];
  const ctaHref = authed ? "/dashboard" : rememberedDevice ? "/auth?mode=login" : "/auth";
  const ctaLabel = authed
    ? "Go to my account"
    : rememberedDevice
      ? "Log in"
      : "Start shaping your page";

  return (
    <section id="your-page" className="bg-[#eef1e8] px-5 py-16 sm:px-8 lg:py-24">
      <div className="mx-auto grid w-full max-w-[1230px] items-center gap-16 lg:grid-cols-2">
        <div className="relative">
          {/* <div className="mb-5 flex items-center justify-between text-[0.6rem] font-semibold uppercase tracking-[0.1em] text-[#8a927b]">
            <span>Your page, your personality</span>
            <span>↗</span>
          </div> */}

          <PhoneArch
            mirrored
            tones={{
              arch: "from-[#f6e6d6] to-[#e8c8a8]",
              outline: "border-[#e3c9b0]",
              blob: "text-[#e4e0ff]",
              dots: "#c9a27e",
              accent: "bg-[#c9c1ff]",
            }}
          >
            <HeroBookingDemo staticPreview mood={active} />
          </PhoneArch>

          {/* <div className="mt-6 flex items-center justify-center gap-5 text-xs text-[#818a73]">
            <span>Try a different mood</span>
            <div className="flex gap-2" aria-label="Page theme">
              {(Object.keys(themeMap) as ThemeKey[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  aria-label={`${key} theme`}
                  aria-pressed={theme === key}
                  onClick={() => setTheme(key)}
                  className={cn(
                    "size-6 rounded-full border-[3px] border-[#e5e0f1]",
                    swatchColors[key],
                    theme === key && "outline outline-2 outline-offset-1 outline-[#97a087]",
                  )}
                />
              ))}
            </div>
          </div> */}
        </div>

        <div>
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.17em] text-primary">
            Your yoga booking page, your way
          </p>
          <h2 className="display mt-4 text-4xl leading-[1.08] tracking-tight text-[#272334] sm:text-[2.8rem]">
            A page that represents
            <br />
            the way <em className="font-normal italic text-primary">you teach.</em>
          </h2>
          <p className="mt-5 text-sm leading-[1.95] text-[#716277]">
            Introduce yourself with your photo, story, and specialties. Bring your upcoming classes,
            social profiles, and important links into one place that is easy to share.
          </p>
          <p className="mt-4 text-sm leading-[1.95] text-[#716277]">
            Make the page feel like your business with customizable colours, backgrounds, and
            layouts on Pro. Keep sharing the same page as your classes and offers change.
          </p>
          <Link
            href={ctaHref}
            className="mt-6 inline-flex items-center gap-3 text-sm font-semibold text-[#272334] hover:text-[#6355ff]"
          >
            {ctaLabel} <span>↗</span>
          </Link>
          <p className="mt-3 text-[11px] text-[#7c6b84]">Custom page design is available on Pro.</p>
        </div>
      </div>
    </section>
  );
}
