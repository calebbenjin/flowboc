"use client";

import Link from "next/link";
import { CalendarDays, Check, ChevronRight, Video, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Eyebrow, Reveal } from "./primitives";
import { cn } from "@/lib/utils";

const checklist = [
  "Sell classes, 1-on-1 sessions & recurring series",
  "Accept payments & manage students automatically",
  "No coding or tech expertise needed",
];

const floatingCards: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: CalendarDays,
    title: "Sell Classes with Link-in-Bio",
    body: "Drop-in and recurring sessions, bookable in one tap.",
  },
  {
    icon: Video,
    title: "1:1 Coaching Sessions",
    body: "Private video calls, booked and confirmed instantly.",
  },
];

export function BuildWithEase() {
  return (
    <section className="overflow-hidden bg-white px-5 py-20 sm:px-8 lg:py-28">
      <div className="mx-auto grid w-full max-w-[1200px] items-center gap-16 lg:grid-cols-2 lg:gap-12">
        <Reveal>
          <Eyebrow className="mb-4">Teach &amp; earn</Eyebrow>
          <h2 className="text-3xl leading-[1.1] tracking-tight sm:text-4xl lg:text-[2.75rem]">
            Run Your Yoga Business <span className="display italic text-clay">with Ease.</span>
          </h2>
          <p className="mt-5 max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg">
            Launch classes, 1-on-1 sessions and recurring series in just a few clicks — all booked
            and paid for from one link.
          </p>

          <ul className="mt-7 flex flex-col gap-3">
            {checklist.map((item) => (
              <li key={item} className="flex items-start gap-3 text-base text-foreground">
                <Check className="mt-0.5 size-4 shrink-0 text-clay" />
                {item}
              </li>
            ))}
          </ul>

          <Button
            asChild
            size="xl"
            className="w-full sm:w-auto bg-mint hover:bg-mint text-mint-foreground font-bold"
          >
            <Link href="/auth">Start Your 14-Day Trial</Link>
          </Button>
        </Reveal>

        <Reveal delay={0.1} className="relative">
          <div
            aria-hidden
            className="relative sm:aspect-[4/6] aspect-[4/5] w-full overflow-hidde rounded-[2rem] bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: "url('/yoga-Instructor.png')" }}
          />

          <div className="absolute inset-x-4 bottom-4 flex flex-col gap-4 sm:-left-6 sm:right-10 sm:bottom-8">
            {floatingCards.map((c, i) => (
              <div
                key={c.title}
                className={cn(
                  "rounded-2xl border border-border bg-card p-5 shadow-(--shadow-lift) sm:p-6",
                  i === 1 && "sm:ml-6",
                )}
              >
                <span className="grid size-10 place-items-center rounded-full bg-clay/12 text-clay">
                  <c.icon className="size-4.5" />
                </span>
                <h3 className="mt-3 text-base font-semibold sm:text-lg">{c.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{c.body}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
