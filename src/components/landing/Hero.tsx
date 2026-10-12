"use client";

import { useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "./primitives";

export function Hero() {
  const reduce = useReducedMotion();
  const tiltRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: tiltRef,
    offset: ["start 95%", "start 45%"],
  });
  const rotateX = useTransform(scrollYProgress, [0, 1], [24, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [0.92, 1]);

  return (
    <section
      id="top"
      className="relative overflow-hidden px-5 pb-6 pt-14 sm:px-8 lg:pb-8 lg:pt-6 bg-primary"
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
          <div className=" w-full max-w-42 shrink-0 sm:max-w-80 lg:w-full mr-auto relative">
            <div className="relative w-full h-85 sm:h-175 lg:h-175">
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

        <div ref={tiltRef} className="relative mx-auto mt-14 max-w-7xl lg:mt-4">
          <div
            aria-hidden
            className="absolute inset-x-10 top-16 bottom-0 rounded-[2.5rem] sm:inset-x-16"
            style={{
              backgroundColor: "color-mix(in oklch, var(--primary-foreground) 10%, transparent)",
              backgroundImage: "radial-gradient(rgba(255,255,255,0.4) 1px, transparent 1px)",
              backgroundSize: "18px 18px",
            }}
          />

          <motion.div
            initial={reduce ? false : { opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            style={{
              rotateX: reduce ? 0 : rotateX,
              scale: reduce ? 1 : scale,
              transformPerspective: 4800,
              transformOrigin: "bottom center",
            }}
            className="relative rounded-[2rem] border border-white/15 bg-white/10 p-2.5 shadow-2xl backdrop-blur-sm sm:p-3.5"
          >
            <div className="overflow-hidden rounded-[1.5rem]">
              <Image
                src="/dashboard.png"
                alt="Flowboc dashboard showing revenue, upcoming classes and bookings"
                width={2560}
                height={1600}
                priority
                className="h-auto w-full"
              />
            </div>
          </motion.div>

          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-28 rounded-b-[2.5rem] bg-linear-to-b from-transparent to-primary sm:h-40"
          />
        </div>
      </div>
    </section>
  );
}
