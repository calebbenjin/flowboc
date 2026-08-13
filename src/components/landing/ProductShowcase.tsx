"use client";

import { motion, useReducedMotion } from "motion/react";
import { Section, SectionHeader } from "./primitives";
import { BrowserFrame, DashboardMock } from "./product-ui";

const annotations = [
  { label: "8 / 12 spots filled", className: "left-2 top-24 sm:left-6 lg:-left-8 lg:top-32" },
  { label: "Payment received", className: "right-2 top-10 sm:right-6 lg:-right-6 lg:top-24" },
  { label: "Reminder sent", className: "bottom-6 right-4 lg:-right-10 lg:bottom-20" },
];

export function ProductShowcase() {
  const reduce = useReducedMotion();
  return (
    <Section className="bg-primary/[0.04]">
      <SectionHeader
        eyebrow="Product tour"
        title="One simple dashboard."
        serif="Your entire class business."
      />
      <div className="relative mx-auto mt-14 max-w-5xl">
        <BrowserFrame url="flowbuk.com/dashboard">
          <DashboardMock compact />
        </BrowserFrame>
        {annotations.map((a, i) => (
          <motion.span
            key={a.label}
            initial={reduce ? false : { opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 + i * 0.15 }}
            className={`absolute hidden rounded-full border border-border bg-card px-3 py-1.5 text-[0.7rem] font-medium shadow-[var(--shadow-soft)] sm:block ${a.className}`}
          >
            {a.label}
          </motion.span>
        ))}
      </div>
    </Section>
  );
}
