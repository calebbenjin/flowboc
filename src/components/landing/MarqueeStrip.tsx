"use client";

import { motion, useReducedMotion } from "motion/react";

const phrases = [
  "Live",
  "One link, full schedule",
  "Bookings without the DMs",
  "Get paid instantly",
  "Your classes, live",
];

// Four copies of the phrase set, rendered twice back-to-back (see `items`
// below) — animating x from 0% to -50% then looping lands exactly on an
// identical copy, so the loop seam is invisible.
const row = [...phrases, ...phrases, ...phrases, ...phrases];
const items = [...row, ...row];

export function MarqueeStrip() {
  const reduce = useReducedMotion();

  return (
    <div className="relative z-10 -my-7 sm:-my-9">
      <div className="w-[120%] -ml-[10%] -rotate-2 overflow-hidden bg-mint py-3 shadow-lg sm:py-4">
        <motion.div
          className="flex w-max items-center gap-10 whitespace-nowrap"
          animate={reduce ? false : { x: ["0%", "-50%"] }}
          transition={{ duration: 58, repeat: Infinity, ease: "linear" }}
        >
          {items.map((phrase, i) => (
            <span
              key={i}
              className="flex items-center gap-10 text-sm font-bold uppercase tracking-wide text-mint-foreground sm:text-base"
            >
              {phrase}
              <span aria-hidden className="text-mint-foreground/40">
                •
              </span>
            </span>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
