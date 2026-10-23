"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "./primitives";

export function Hero() {
  return (
    <section
      id="top"
      className="relative overflow-hidden px-5 pb-12 pt-14 sm:px-8 lg:pb-30 lg:pt-6 bg-primary"
    >
      <div className="mx-auto w-full">
        <div className="relative mx-auto max-w-6xl flex flex-col items-center justify-between lg:justify-between gap-10 lg:flex-row lg:items-center lg:gap-12">
          <div className="text-left lg:w-full">
            <Eyebrow className="text-white">Built for independent yoga teachers</Eyebrow>
            <h1 className="text-white mt-6 text-[2.5rem] leading-[1.05] tracking-tight sm:text-5xl lg:text-[4.5rem]">
              Create your class. <br /> Share your link. <br />
              <span className="display italic text-mint">Get booked.</span>
            </h1>
            <p className="mr-auto mt-6 max-w-xl text-base leading-relaxed text-white sm:text-lg">
              Stop managing bookings across WhatsApp, Instagram, spreadsheets and payment links.
              Create your classes, accept payments and manage your students from one beautifully
              simple platform.
            </p>
            <div className="mt-8 flex flex-col items-center justify-start gap-3 sm:flex-row">
              <Button
                asChild
                size="xl"
                className="w-full sm:w-auto bg-mint hover:bg-mint text-mint-foreground font-bold"
              >
                <Link href="/auth">Start Your 14-Day Trial</Link>
              </Button>
              <Button asChild size="xl" variant="quiet" className="w-full sm:w-auto">
                <a href="#how-it-works">
                  See How It Works <ArrowRight className="size-4" />
                </a>
              </Button>
            </div>
            <p className="mt-4 text-sm text-white">
              <Check className="mr-1 inline size-3.5 text-mint" />
              Set up your first class in minutes.
            </p>
          </div>

          {/* Desktop */}
          <div className="sm:flex hidden w-full max-w-42 shrink-0 sm:max-w-80 lg:w-full mr-auto relative">
            <div className="relative w-full h-85 sm:h-175 lg:h-165">
              <Image
                src="/phone-img.png"
                alt="Flowboc booking page shown on a phone, with upcoming classes and a book class button"
                width={693}
                height={1451}
                priority
                className="h-auto w-full drop-shadow-2xl absolute top-1 lg:left-20 left-30"
              />
              <Image
                src="/phone-img.png"
                alt="Flowboc booking page shown on a phone, with upcoming classes and a book class button"
                width={693}
                height={1451}
                priority
                className="h-auto w-full drop-shadow-2xl absolute top-1/12 lg:-left-12 left-20"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
