"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal, Section, SectionHeader } from "./primitives";
import {
  countryName,
  isAfricanCountry,
  REGIONAL_DISCOUNT_MONTHLY_PRICE,
  STANDARD_MONTHLY_PRICE,
} from "@/lib/geo-pricing";

const features = [
  "Unlimited classes",
  "Online payments",
  "Recurring classes",
  "Automated reminders",
  "Student management",
  "Attendance",
  "Revenue tracking",
  "Class passes",
];

export function Pricing() {
  const [country, setCountry] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/geo")
      .then((r) => r.json())
      .then((data: { country: string | null }) => setCountry(data.country))
      .catch(() => {
        // Non-critical — falls back to standard pricing.
      });
  }, []);

  const discounted = isAfricanCountry(country);
  const price = discounted ? REGIONAL_DISCOUNT_MONTHLY_PRICE : STANDARD_MONTHLY_PRICE;

  return (
    <Section id="pricing" className="bg-sand/30">
      <SectionHeader
        eyebrow="Pricing"
        title="Simple pricing."
        serif="Try it free for 14 days."
        body="No credit card required to start."
      />

      <div className="mx-auto mt-14 max-w-md">
        <Reveal>
          <div className="flex h-full flex-col rounded-2xl border border-clay/40 bg-card p-7 shadow-[var(--shadow-lift)]">
            <div className="flex items-center justify-between">
              <h3 className="text-lg">Pro</h3>
              <span className="rounded-full bg-clay px-3 py-1 text-[0.62rem] font-medium uppercase tracking-wider text-clay-foreground">
                14-day free trial
              </span>
            </div>

            {discounted && country && (
              <p className="mt-4 flex items-start gap-1.5 rounded-lg bg-success/10 px-3 py-2 text-xs text-success">
                <MapPin className="mt-0.5 size-3.5 shrink-0" />
                We noticed you're joining from {countryName(country)}, which falls under our
                regional discount.
              </p>
            )}

            <p className="mt-5 flex items-end gap-2">
              {discounted && (
                <span className="pb-1 text-lg text-muted-foreground line-through">
                  ${STANDARD_MONTHLY_PRICE}
                </span>
              )}
              <span className="display text-4xl">${price}</span>
              <span className="pb-1 text-sm text-muted-foreground">/ month after trial</span>
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              For instructors running regular classes. No card required to start.
            </p>
            <ul className="mt-6 space-y-2.5 text-sm">
              {features.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <Check className="mt-0.5 size-4 shrink-0 text-success" /> {f}
                </li>
              ))}
            </ul>
            <Button asChild size="lg" variant="clay" className="mt-8 w-full">
              <Link href="/auth">Start free trial</Link>
            </Button>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
