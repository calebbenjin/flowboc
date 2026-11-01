"use client";

import Link from "next/link";
import { ArrowRight, Flower2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthCta } from "./useAuthCta";

export function LaunchFinalCTA() {
  const { authed, rememberedDevice } = useAuthCta();
  const ctaHref = authed ? "/dashboard" : rememberedDevice ? "/auth?mode=login" : "/auth";
  const ctaLabel = authed
    ? "Go to my account"
    : rememberedDevice
      ? "Log in"
      : "Create my Flowboc page";

  return (
    <section
      id="begin"
      className="relative overflow-hidden bg-[#31243e] px-5 py-20 text-center sm:px-8"
    >
      <Flower2
        aria-hidden
        className="absolute left-10 top-16 size-20 rotate-[12deg] text-[#8e80ff]/70"
      />
      <div className="absolute -right-32 -bottom-24 h-[230px] w-[330px] -rotate-[25deg] rounded-full border border-[#8575ff]" />
      <div className="relative mx-auto max-w-[700px]">
        <p className="text-[0.6rem] font-semibold uppercase tracking-[0.17em] text-[#bba0ca]">
          Make room for what comes next
        </p>
        <h2 className="display mt-4 text-4xl leading-[1.08] text-[#fff8ed] sm:text-6xl">
          Be ready when
          <br />
          your next <em className="font-normal italic text-[#d5ecb4]">student is.</em>
        </h2>
        <p className="mt-6 text-sm leading-[1.9] text-[#d5cbdf] sm:text-base">
          Give them a page that tells your story, shows your classes, and makes booking
          straightforward. Start building your Flowboc home today.
        </p>
        <Button asChild size="xl" className="mt-8 bg-[#d5ecb4] text-[#3e4935] hover:bg-[#e3f6c9]">
          <Link href={ctaHref}>
            {ctaLabel} <ArrowRight className="size-4" />
          </Link>
        </Button>
        <p className="mt-4 text-xs text-[#c6b9d0]">
          14-day free trial <span className="mx-2">·</span> No card required
        </p>
      </div>
    </section>
  );
}
