"use client";

import * as React from "react";
import {
  BellRing,
  CreditCard,
  Globe,
  Instagram,
  MapPin,
  MessageCircle,
  Repeat,
  Smartphone,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Reveal, Section } from "./primitives";

const contexts = [
  { icon: MessageCircle, label: "WhatsApp" },
  { icon: Instagram, label: "Instagram" },
  { icon: Globe, label: "Personal websites" },
  { icon: MapPin, label: "In-person classes" },
  { icon: Repeat, label: "Recurring sessions" },
];

const features = [
  {
    icon: Sparkles,
    title: "Easy setup",
    description: "Create your class page and start accepting bookings in minutes.",
    stat: "< 5 min",
    statLabel: "to go live",
  },
  {
    icon: Smartphone,
    title: "No app required",
    description: "Students book straight from your link in any browser, nothing to install.",
    stat: "0",
    statLabel: "apps required",
  },
  {
    icon: CreditCard,
    title: "Get paid instantly",
    description: "Secure payments powered by Stripe & PayStack land straight in your account.",
    stat: "100%",
    statLabel: "secure checkout",
  },
  {
    icon: BellRing,
    title: "Automated reminders",
    description: "Class and payment reminders go out on their own, so fewer students miss out.",
    stat: "Fewer",
    statLabel: "no-shows",
  },
];

export function SocialProof() {
  const [active, setActive] = React.useState(0);

  return (
    <Section className="border-y border-border bg-sand/40 py-16!">
      <Reveal className="flex flex-col items-center gap-10 text-center">
        <p className="max-w-xl text-base font-medium">
          Built for instructors who&apos;d rather teach than manage spreadsheets.
        </p>

        <div
          className="flex w-full flex-col gap-3 lg:h-88 lg:flex-row"
          onMouseLeave={() => setActive(0)}
        >
          {features.map((feature, i) => {
            const isActive = active === i;
            return (
              <div
                key={feature.title}
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                onClick={() => setActive(i)}
                tabIndex={0}
                style={{ flexGrow: isActive ? 2.4 : 1 }}
                className="group relative isolate min-h-44 overflow-hidden rounded-3xl border border-border bg-card p-6 text-left outline-none transition-[flex-grow] duration-500 ease-out lg:min-w-56 lg:basis-0 sm:p-7"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground/70">0{i + 1}</span>
                  <span className="grid size-9 place-items-center rounded-full bg-clay/10 text-clay">
                    <feature.icon className="size-4" />
                  </span>
                </div>

                <div className="mt-8 max-w-45">
                  <h3 className="text-xl font-semibold tracking-tight">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                </div>

                <div
                  aria-hidden
                  className={cn(
                    "pointer-events-none absolute inset-y-4 right-4 w-40 translate-x-6 rounded-2xl bg-linear-to-br from-clay/15 via-clay/5 to-mint/20 opacity-0 transition-all duration-500 ease-out sm:w-48",
                    isActive && "translate-x-0 opacity-100",
                  )}
                >
                  <div className="flex h-full flex-col items-center justify-center gap-3 p-4">
                    <span className="grid size-12 place-items-center rounded-full bg-card text-clay shadow-soft">
                      <feature.icon className="size-5" />
                    </span>
                    <div className="rounded-2xl bg-card px-3 py-2 text-center shadow-soft">
                      <p className="text-sm leading-none font-semibold">{feature.stat}</p>
                      <p className="mt-1.5 text-[0.65rem] text-muted-foreground">
                        {feature.statLabel}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          {contexts.map((c) => (
            <span
              key={c.label}
              className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-xs font-medium text-muted-foreground transition-colors hover:border-clay/40 hover:bg-clay/5 hover:text-foreground"
            >
              <span className="grid size-6 place-items-center rounded-full bg-clay/12 text-clay">
                <c.icon className="size-3.5" />
              </span>
              {c.label}
            </span>
          ))}
        </div>
      </Reveal>
    </Section>
  );
}
