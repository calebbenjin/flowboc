"use client";

import Image from "next/image";
import Link from "next/link";
import { Instagram, Mail, MessageCircle } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { Button } from "@/components/ui/button";

const floatingIcons = [Instagram, MessageCircle, Mail];

const rings = [
  { size: 460, opacity: "border-white/10" },
  { size: 680, opacity: "border-white/10" },
  { size: 900, opacity: "border-white/15" },
];

export function BuildAndPrice() {
  const reduce = useReducedMotion();

  return (
    <section className="relative flex min-h-screen items-center overflow-hidden bg-primary px-5 py-20 sm:px-8">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        {rings.map((r) => (
          <div
            key={r.size}
            className={`absolute left-[10%] top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border ${r.opacity}`}
            style={{ width: r.size, height: r.size }}
          />
        ))}

        <div className="absolute -left-24 -top-24 size-72 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-32 -right-16 size-96 rounded-full bg-mint/15 blur-3xl" />
        <motion.div
          className="absolute right-[18%] top-14 hidden size-6 rounded-full bg-mint sm:block"
          animate={reduce ? false : { y: [0, -12, 0] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="relative mx-auto flex w-full max-w-[1200px] flex-col items-center gap-12 lg:flex-row lg:justify-between lg:gap-6">
        <motion.div
          className="relative shrink-0"
          initial={reduce ? false : { opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.div
            className="-rotate-[9deg]"
            animate={reduce ? false : { y: [0, -14, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          >
            <Image
              src="/phone-img.png"
              alt="Flowboc booking page showing an instructor profile with priced, bookable classes"
              width={693}
              height={1451}
              className="h-auto w-56 drop-shadow-2xl sm:w-64 lg:w-78"
            />
          </motion.div>

          <div className="absolute top-10 -right-4 hidden flex-col gap-3 sm:-right-12 sm:flex">
            {floatingIcons.map((Icon, i) => (
              <motion.span
                key={i}
                className="grid size-10 place-items-center rounded-full bg-foreground text-mint shadow-[var(--shadow-lift)]"
                initial={reduce ? false : { opacity: 0, x: 16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 + i * 0.15 }}
              >
                <Icon className="size-4" />
              </motion.span>
            ))}
          </div>
        </motion.div>

        <motion.div
          className="max-w-2xl text-center lg:text-left"
          initial={reduce ? false : { opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        >
          <h2 className="text-4xl font-extrabold leading-[1.1] tracking-tight text-mint sm:text-5xl lg:text-[4.25rem]">
            Build and price your class in minutes
          </h2>
          <p className="mt-6 text-base leading-relaxed text-white/80 sm:text-lg">
            Classes, bookable sessions and payments all live on the same page. Set your schedule,
            drop in photos, price it your way — no site builder, no developer.
          </p>
          <Button
            asChild
            size="xl"
            className="mt-8 bg-mint font-bold text-mint-foreground hover:bg-mint"
          >
            <Link href="/auth">Get started for free</Link>
          </Button>

          <div className="mt-8 flex items-center justify-center gap-1.5 lg:justify-start">
            <span className="h-2 w-6 rounded-full bg-mint" />
            <span className="size-2 rounded-full bg-white/30" />
            <span className="size-2 rounded-full bg-white/30" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
