"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PhoneFrame } from "./product-ui";
import Image from "next/image";

type Panel = {
  bg: string;
  url: string;
  dark?: boolean;
  frame?: boolean;
  heading: string;
  accent: string;
  body: string;
};

const panels: Panel[] = [
  {
    bg: "bg-white",
    url: "/yoga-instructor-img1.png",
    frame: false,
    heading: "Build and price your",
    accent: "class in minutes.",
    body: "Classes, bookable sessions and payments all live on the same page. Set your schedule, drop in photos, price it your way — no site builder, no developer.",
  },
  {
    bg: "bg-mint",
    url: "/new-flowboc-ui.png",
    dark: false,
    frame: true,
    heading: "Linktree for",
    accent: "yoga instructors.",
    body: "Post it on Instagram, WhatsApp or your website. No app, no account needed to book. Same link. Everywhere.",
  },
  {
    bg: "bg-primary",
    dark: true,
    frame: true,
    heading: "0% transaction fee.",
    url: "/full-analytics-ui.png",
    accent: "Get paid, automatically.",
    body: "Students pay at checkout and it lands straight in your account. Confirmations and reminders go out on their own.",
  },
];

// A slight diagonal on the leading edge of each panel, so the stack reveals
// with a cut rather than a flat horizontal wipe.
const CLIP_PATH = "polygon(0 0, 100% 64px, 100% 100%, 0 100%)";
const RING_SIZES = [260, 440, 620];

function StickyPanel({ panel, index }: { panel: Panel; index: number }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.94]);
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0.7]);

  return (
    <div
      ref={ref}
      className={cn(
        "sticky top-0 flex min-h-screen items-center overflow-hidden",
        panel.bg,
        index === 0 ? "z-10" : index === 1 ? "z-20" : "z-30",
      )}
      style={{ clipPath: CLIP_PATH }}
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        {RING_SIZES.map((size) => (
          <div
            key={size}
            className={cn(
              "absolute left-[8%] top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border",
              panel.dark ? "border-white/10" : "border-foreground/8",
            )}
            style={{ width: size, height: size }}
          />
        ))}
      </div>

      <motion.div
        style={reduce ? {} : { scale, opacity }}
        className="relative mx-auto grid w-full max-w-[1200px] grid-cols-1 items-center gap-10 px-5 py-20 sm:px-0 lg:grid-cols-2 lg:gap-2"
      >
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          {panel.frame ? (
            <PhoneFrame className="mx-auto w-full sm:max-w-[335px] max-w-[280px] -rotate-[3deg]">
              <div className="sm:min-h-[670px] min-h-[530px]">
                <Image
                  src={panel.url}
                  alt="Flowboc booking page showing an instructor's profile, a bookable video call and upcoming classes"
                  fill
                  sizes="(min-width: 1024px) 240px, (min-width: 640px) 200px, 170px"
                  priority
                  className="object-cover object-top"
                />
              </div>
            </PhoneFrame>
          ) : (
            <div className="sm:min-h-[670px] min-h-[600px] relative mx-auto w-full sm:max-w-[420px] max-w-[380px] -rotate-[3deg]">
              <Image
                src={panel.url}
                alt="Flowboc booking page showing an instructor's profile, a bookable video call and upcoming classes"
                fill
                sizes="(min-width: 1024px) 240px, (min-width: 640px) 200px, 170px"
                priority
                className="object-cover object-top"
              />
            </div>
          )}
        </motion.div>

        <motion.div
          initial={reduce ? false : { opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="text-center lg:text-left"
        >
          <h3
            className={cn(
              "text-3xl leading-tight tracking-tight sm:text-6xl",
              panel.dark ? "text-white" : "text-foreground",
            )}
          >
            {panel.heading}{" "}
            <span className={cn("display italic", panel.dark ? "text-mint" : "text-clay")}>
              {panel.accent}
            </span>
          </h3>
          <p
            className={cn(
              "mx-auto mt-5 max-w-md text-base leading-relaxed sm:text-lg lg:mx-0",
              panel.dark ? "text-white/80" : "text-muted-foreground",
            )}
          >
            {panel.body}
          </p>
          <Button asChild size="xl" variant={panel.dark ? "mint" : "clay"} className="mt-8">
            <Link href="/auth">
              Get started for free <ArrowRight className="size-4" />
            </Link>
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}

export function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-white">
      <div className=" px-5 pb-10 pt-20 sm:px-8 lg:pt-28">
        <div className="mx-auto w-full max-w-[1200px] text-center">
          <h2 className="text-3xl leading-[1.1] tracking-tight sm:text-4xl lg:text-[3rem]">
            Why top yoga teachers use <span className="display italic text-clay">Flowboc.</span>
          </h2>
        </div>
      </div>

      <div className="relative">
        {panels.map((panel, i) => (
          <StickyPanel key={panel.heading} panel={panel} index={i} />
        ))}
      </div>
    </section>
  );
}
