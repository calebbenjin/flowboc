"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeroBookingDemo } from "./HeroBookingDemo";
import { PhoneArch } from "./PhoneArch";

export function LaunchHero() {
  return (
    <section id="home" className="px-5 pb-16 pt-16 sm:px-8 lg:pb-0 lg:pt-20">
      <div className="mx-auto grid w-full max-w-[1320px] items-center gap-12 lg:grid-cols-[1.2fr_0.9fr] lg:gap-10">
        <div className="mx-auto w-full">
          <div className="flex items-center gap-2 text-[0.7rem] font-semibold uppercase tracking-[0.17em] text-primary">
            <span className="size-1.5 rounded-full bg-primary" />
            For independent yoga instructors
          </div>
          <h1 className="display mt-6 text-4xl leading-[1.04] tracking-tight text-[#272334] font-bold sm:text-6xl lg:text-[4rem] capitalize">
            Bookings and payments <br /> for your yoga classes, <br />{" "}
            <em className="font-bold italic text-primary">all in one link.</em>
          </h1>
          <p className="mt-6 max-w-[630px] text-base leading-[1.85] text-[#716277]">
            Give people one professional page to explore your teaching, choose a class, and pay
            online in naira, cedi, shilling, rand or CFA — without creating an account.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-6">
            <Button asChild size="xl" className="bg-[#6355ff] text-white hover:bg-[#5042e5]">
              <Link href="/auth">
                Start your free trial <ArrowRight className="size-4" />
              </Link>
            </Button>
            <a
              href="#experience"
              className="inline-flex items-center gap-3 text-sm font-semibold text-[#272334] hover:text-[#6355ff]"
            >
              See it in action <span>↗</span>
            </a>
          </div>
          <p className="mt-5 text-[11px] text-[#7c6b84]">
            <Check className="mr-1 inline size-3 text-primary" /> 14-day free trial{" "}
            <span className="mx-2 text-[#aaa4ad]">·</span> No card required{" "}
            <span className="mx-2 text-[#aaa4ad]">·</span> 0% commission on your bookings
          </p>
        </div>

        <PhoneArch
          tones={{
            arch: "from-[#ddd8ff] to-[#c4bbff]",
            outline: "border-[#d9d3ff]",
            blob: "text-[#e5e9d9]",
            dots: "#b9b0ff",
            accent: "bg-[#f4d8a8]",
          }}
        >
          <HeroBookingDemo />
          {/* <Image
            src="/hero-instructor.png"
            alt="Yoga teacher pointing toward the interactive booking demo"
            width={1024}
            height={2688}
            sizes="(min-width: 1280px) 270px, (min-width: 640px) 210px, 1px"
            className="z-50 pointer-events-none hidden h-auto w-[210px] -ml-16 shrink-0 self-center object-contain sm:block xl:w-[270px] xl:-ml-30"
            priority
          /> */}
        </PhoneArch>
      </div>
    </section>
  );
}
