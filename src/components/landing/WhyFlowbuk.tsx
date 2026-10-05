"use client";

import * as React from "react";
import Image from "next/image";
import { BellRing, CreditCard, Link2, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { ReminderMock, RevenueMock, StudentListMock } from "./product-ui";
import { Eyebrow, Reveal, Section } from "./primitives";

const reasons = [
  {
    icon: Link2,
    title: "One page for your whole business",
    description:
      "Your bio, socials, specialties and every class you teach — all on one branded page. Students browse, subscribe and book straight from the link in your Instagram bio, with no DMs back and forth.",
    visual: (
      <div className="flex justify-center">
        <Image
          src="/phone-img.png"
          alt="Flowbuk public booking page showing a yoga teacher's bio and upcoming classes"
          width={693}
          height={1451}
          className="h-auto w-44 drop-shadow-xl sm:w-52"
        />
      </div>
    ),
  },
  {
    icon: CreditCard,
    title: "Stop chasing payment screenshots",
    description:
      "Payments are collected securely at checkout and land straight in your account — no more asking students for proof of payment.",
    visual: <RevenueMock />,
  },
  {
    icon: Users,
    title: "Replace the spreadsheet",
    description:
      "Every class, student, booking and payment lives in one dashboard — not scattered across tabs, notes and screenshots.",
    visual: <StudentListMock />,
  },
  {
    icon: BellRing,
    title: "Fewer no-shows, without lifting a finger",
    description:
      "Confirmations and reminders go out automatically for every booking, so students actually show up.",
    visual: <ReminderMock />,
  },
];

export function WhyFlowbuk() {
  const [active, setActive] = React.useState(0);
  const cardRefs = React.useRef<(HTMLDivElement | null)[]>([]);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const idx = cardRefs.current.findIndex((el) => el === entry.target);
          if (idx !== -1) setActive(idx);
        }
      },
      { rootMargin: "-40% 0px -50% 0px", threshold: 0 },
    );
    cardRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <Section className="bg-white py-20">
      <div className="grid gap-10 lg:grid-cols-2 lg:items-start lg:gap-16">
        <div className="lg:sticky lg:top-58 lg:self-start">
          <Eyebrow className="mb-4">Why teachers switch</Eyebrow>
          <h2 className="text-3xl leading-[1.1] tracking-tight sm:text-4xl lg:text-[3rem]">
            Why top yoga teachers use <span className="display italic text-clay">Flowbuk.</span>
          </h2>
          <p className="mt-4 max-w-md text-base leading-relaxed text-muted-foreground">
            You didn&apos;t start teaching yoga to manage a WhatsApp group, chase payment
            screenshots and update a spreadsheet after every class. Flowbuk replaces all of it with
            one simple link.
          </p>

          <div className="mt-8 flex flex-col gap-2">
            {reasons.map((r, i) => (
              <button
                key={r.title}
                type="button"
                onClick={() =>
                  cardRefs.current[i]?.scrollIntoView({ behavior: "smooth", block: "center" })
                }
                className={cn(
                  "flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-colors",
                  active === i
                    ? "border-clay/30 bg-card text-foreground shadow-(--shadow-soft)"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                <span
                  className={cn(
                    "grid size-8 shrink-0 place-items-center rounded-full",
                    active === i ? "bg-clay/12 text-clay" : "bg-secondary text-muted-foreground",
                  )}
                >
                  <r.icon className="size-4" />
                </span>
                {r.title}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-20 lg:gap-28">
          {reasons.map((r, i) => (
            <div
              key={r.title}
              ref={(el) => {
                cardRefs.current[i] = el;
              }}
              className="scroll-mt-28"
            >
              <Reveal>
                <h3 className="text-xl font-semibold tracking-tight sm:text-2xl">{r.title}</h3>
                <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-base">
                  {r.description}
                </p>
                <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-card p-1 shadow-(--shadow-lift)">
                  <div className="rounded-xl bg-background p-4 sm:p-6">{r.visual}</div>
                </div>
              </Reveal>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}
