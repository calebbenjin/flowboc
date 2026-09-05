"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "./primitives";
import { BrowserFrame, DashboardMock, MobileBookingMock } from "./product-ui";

export function Hero() {
  const reduce = useReducedMotion();
  return (
    <section
      id="top"
      className="relative overflow-hidden px-5 pb-16 pt-14 sm:px-8 lg:pb-28 lg:pt-20 bg-primary"
    >
      <div className="mx-auto w-full max-w-[1200px]">
        <div className="mx-auto max-w-3xl text-center">
          <Eyebrow className="text-white">Built for independent yoga teachers</Eyebrow>
          <h1 className="text-white mt-5 text-[2.5rem] leading-[1.05] tracking-tight sm:text-5xl lg:text-[3.75rem]">
            Create your class. Share your link.{" "}
            <span className="display italic text-mint">Get booked.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-white sm:text-lg">
            Stop managing bookings across WhatsApp, Instagram, spreadsheets and payment links.
            Create your classes, accept payments and manage your students from one beautifully
            simple platform.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
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

        <motion.div
          initial={reduce ? false : { opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="relative mx-auto mt-14 max-w-5xl lg:mt-20"
        >
          <BrowserFrame>
            <DashboardMock />
          </BrowserFrame>

          <motion.div
            className="absolute -bottom-14 -right-4 hidden lg:block xl:-right-14"
            animate={reduce ? { y: 0 } : { y: [0, -10, 0] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          >
            <MobileBookingMock />
          </motion.div>
        </motion.div>

        <div className="mt-10 flex justify-center lg:hidden">
          <MobileBookingMock />
        </div>
      </div>
    </section>
  );
}
