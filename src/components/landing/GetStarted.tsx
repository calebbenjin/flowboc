"use client";

import Link from "next/link";
import { ArrowRight, CalendarDays, Check, Link2 } from "lucide-react";
import { useReducedMotion } from "motion/react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { siteHost } from "@/lib/site";
import { Pill, Reveal, Section, SectionHeader } from "./primitives";
import { BrowserFrame, ShareMock } from "./product-ui";
import { useActiveStep } from "./useActiveStep";

const steps = [
  {
    title: "Claim your link",
    body: "Pick your booking page URL — yours in seconds.",
  },
  {
    title: "Add your first class",
    body: "Set a schedule, price and capacity.",
  },
  {
    title: "Share it everywhere",
    body: "Instagram, WhatsApp, email — one link covers all of them.",
  },
  {
    title: "Get booked",
    body: "Students book and pay, you get notified instantly.",
  },
];

function ClaimLinkMock() {
  return (
    <div className="mx-auto max-w-xs space-y-4 text-center">
      <p className="text-sm text-muted-foreground">Your booking page</p>
      <div className="flex items-center gap-2.5 rounded-full border border-border bg-background px-5 py-3 text-base shadow-[var(--shadow-soft)]">
        <Link2 className="size-4 shrink-0 text-muted-foreground" />
        <span className="truncate">{siteHost}/your-name</span>
      </div>
      <Pill tone="success">
        <Check className="size-3" /> Available
      </Pill>
    </div>
  );
}

// Sized to match the other three steps' visuals in this panel — product-ui's
// ClassCreateMock is deliberately compact for its other home in FeatureGrid,
// which would read as "too small" floating alone in this much bigger frame.
function AddClassMock() {
  return (
    <div className="mx-auto max-w-sm space-y-4 rounded-2xl border border-border bg-card p-8 shadow-[var(--shadow-soft)]">
      <div className="flex items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-clay/12 text-clay">
          <CalendarDays className="size-4.5" />
        </span>
        <p className="text-base font-medium">New class</p>
      </div>
      <div className="rounded-lg border border-border px-4 py-3 text-base">Morning Flow</div>
      <div className="grid grid-cols-2 gap-3 text-sm text-muted-foreground">
        <div className="rounded-lg border border-border px-4 py-3">Tue · 7:00 AM</div>
        <div className="rounded-lg border border-border px-4 py-3">60 min</div>
        <div className="rounded-lg border border-border px-4 py-3">12 spots</div>
        <div className="rounded-lg border border-border px-4 py-3">$18</div>
      </div>
      <div className="flex items-center justify-between rounded-lg bg-secondary px-4 py-3 text-sm">
        Repeat weekly <span className="h-4 w-7 rounded-full bg-clay" />
      </div>
    </div>
  );
}

// A plain (non-motion) variant of product-ui's ConfirmationCard — that one
// uses whileInView with `once: true`, tuned for a scroll-reveal appearing a
// single time. Reusing it here, where it mounts/unmounts repeatedly via
// AnimatePresence as the active step changes, left it stuck at opacity 0.
function BookedMock() {
  return (
    <div className="mx-auto max-w-xs rounded-2xl border border-border bg-card p-8 text-center shadow-[var(--shadow-soft)]">
      <span className="mx-auto grid size-12 place-items-center rounded-full bg-success/15 text-success">
        <Check className="size-5" />
      </span>
      <p className="mt-3 text-lg font-medium">You&apos;re booked 🎉</p>
      <p className="mt-1.5 text-sm text-muted-foreground">Morning Flow · Tuesday 7:00 AM</p>
      <div className="mt-5 rounded-lg border border-border py-2.5 text-sm">Add to calendar</div>
    </div>
  );
}

export function GetStarted() {
  const { active, refs: cardRefs } = useActiveStep(steps.length);
  const reduce = useReducedMotion();

  const visuals = [
    <ClaimLinkMock key="0" />,
    <AddClassMock key="1" />,
    <ShareMock key="2" compact />,
    <BookedMock key="3" />,
  ];

  return (
    <Section>
      <SectionHeader
        eyebrow="Get started"
        title="From sign-up to"
        serif="first booking."
        body="No app to build, no developer needed — just you, a link, and four steps."
      />

      <div className="mt-14 grid gap-10 lg:grid-cols-2 lg:items-start lg:gap-16">
        <div className="flex flex-col gap-20 lg:gap-28">
          {steps.map((s, i) => (
            <div
              key={s.title}
              ref={(el) => {
                cardRefs.current[i] = el;
              }}
              className="scroll-mt-32"
            >
              <Reveal>
                <span
                  className={cn(
                    "display text-sm transition-colors",
                    active === i ? "text-clay" : "text-muted-foreground/50",
                  )}
                >
                  0{i + 1}
                </span>
                <h3
                  className={cn(
                    "mt-2 text-2xl leading-tight tracking-tight transition-colors sm:text-3xl",
                    active === i ? "text-foreground" : "text-muted-foreground/50",
                  )}
                >
                  {s.title}
                </h3>
                <p
                  className={cn(
                    "mt-3 max-w-md text-base leading-relaxed transition-colors",
                    active === i ? "text-muted-foreground" : "text-muted-foreground/40",
                  )}
                >
                  {s.body}
                </p>
              </Reveal>
            </div>
          ))}
        </div>

        <div className="lg:sticky lg:top-28 lg:self-start">
          <BrowserFrame url={`${siteHost}/your-name`} className="w-full">
            <div className="relative min-h-[420px] sm:min-h-[480px]">
              {visuals.map((visual, i) => (
                <div
                  key={i}
                  className={cn(
                    "absolute inset-0 flex items-center justify-center p-10 transition-opacity sm:p-14",
                    reduce ? "duration-0" : "duration-300",
                    i === active ? "opacity-100" : "pointer-events-none opacity-0",
                  )}
                >
                  <div className="w-full">{visual}</div>
                </div>
              ))}
            </div>
          </BrowserFrame>
        </div>
      </div>

      <div className="mt-14 text-center">
        <Button asChild size="xl" variant="clay">
          <Link href="/auth">
            Create Your First Class <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>
    </Section>
  );
}
