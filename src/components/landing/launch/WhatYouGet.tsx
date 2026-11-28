"use client";

import * as React from "react";
import Image from "next/image";
import {
  BarChart3,
  BellRing,
  CalendarCheck,
  Mail,
  MessageCircleOff,
  Smartphone,
  Sparkles,
  UserRoundCheck,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { growthPeriods, type GrowthPeriod } from "./data";
import { useLaunchDialog } from "./LaunchDialogContext";

// Three outcome pillars, each built from the same block: chip, outcome
// headline, one line on why it changes, three benefit rows, and a real
// product visual. Every row only claims what Flowboc does today.
const pillars = [
  {
    id: "time",
    chip: "Time",
    tone: { text: "text-[#5b6d4e]", soft: "bg-[#e5e9d9]", ring: "border-[#d5dcc4]" },
    headline: (
      <>
        Teach more, <em className="font-normal italic text-[#5b6d4e]">chase less.</em>
      </>
    ),
    lead: "When students book and pay on their own, you stop answering the same messages before every class.",
    rows: [
      {
        icon: MessageCircleOff,
        title: "Your evenings back from WhatsApp",
        body: "Students see the time, price and spaces left, then book and pay without messaging you.",
      },
      {
        icon: BellRing,
        title: "No more “is class still on?”",
        body: "Confirmation and reminder emails go out for every booking.",
      },
      {
        icon: CalendarCheck,
        title: "Every class in one place",
        body: "See who's booked and who's paid, and mark attendance after class.",
      },
    ],
  },
  {
    id: "income",
    chip: "Income",
    tone: { text: "text-[#977522]", soft: "bg-[#f4ead0]", ring: "border-[#ebdcb3]" },
    headline: (
      <>
        Get paid before class, <em className="font-normal italic text-[#977522]">not after.</em>
      </>
    ),
    lead: "When payment is part of booking, your income stops depending on who remembers to transfer.",
    rows: [
      {
        icon: Wallet,
        title: "Paid the moment they book",
        body: "Payments go straight to your payout account, in your local currency.",
      },
      {
        icon: Sparkles,
        title: "More ways to earn from your teaching",
        body: "Sell 1:1 sessions, workshops and digital guides from the same page.",
      },
      {
        icon: BarChart3,
        title: "Know which classes earn",
        body: "Follow bookings, recorded revenue and fill rates for every class.",
      },
    ],
  },
  {
    id: "students",
    chip: "Students",
    tone: { text: "text-[#9a4f8c]", soft: "bg-[#f1e1ee]", ring: "border-[#e6cde1]" },
    headline: (
      <>
        Students who <em className="font-normal italic text-[#9a4f8c]">keep coming back.</em>
      </>
    ),
    lead: "When booking is easy and you stay in touch, a one-off visitor becomes a regular.",
    rows: [
      {
        icon: Smartphone,
        title: "Booking that takes a minute",
        body: "No account and no app to download. Students book and pay from their phone.",
      },
      {
        icon: Mail,
        title: "Stay in touch between classes",
        body: "Visitors subscribe on your page, and you send updates about new classes and workshops.",
      },
      {
        icon: UserRoundCheck,
        title: "Know your regulars",
        body: "Booking history and attendance are there when a student returns.",
      },
    ],
  },
] as const;

type PillarId = (typeof pillars)[number]["id"];

export function WhatYouGet() {
  const { openEmailPreview } = useLaunchDialog();

  const visuals: Record<PillarId, React.ReactNode> = {
    time: <DashboardVisual />,
    income: <RevenueVisual />,
    students: <NewsletterVisual onPreview={openEmailPreview} />,
  };

  return (
    <section id="what-you-get" className="px-5 py-16 sm:px-8 lg:py-24">
      <div className="mx-auto w-full max-w-[1230px]">
        <div className="mx-auto max-w-[760px] text-center">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.17em] text-primary">
            What you get
          </p>
          <h2 className="display mt-4 text-4xl leading-[1.08] tracking-tight text-[#272334] sm:text-5xl">
            More time, steadier income,
            <br />
            <em className="font-normal italic text-primary">students who come back.</em>
          </h2>
          <p className="mt-5 text-lg leading-[1.85] text-[#716277]">
            Put booking, payment and follow-up in one place, and here&apos;s what changes in your
            week.
          </p>
          <nav aria-label="What you get" className="mt-6 flex justify-center gap-2">
            {pillars.map((p) => (
              <a
                key={p.id}
                href={`#${p.id}`}
                className={cn(
                  "rounded-full border px-4 py-1.5 text-xs font-semibold",
                  p.tone.ring,
                  p.tone.text,
                  "hover:bg-white",
                )}
              >
                {p.chip}
              </a>
            ))}
          </nav>
        </div>

        <div className="mt-16 space-y-20 lg:mt-20 lg:space-y-60">
          {pillars.map((p, i) => (
            <div
              key={p.id}
              id={p.id}
              className={cn(
                "grid scroll-mt-28 items-center gap-10 lg:gap-20",
                // The dashboard screenshot needs more room than the other
                // visuals, so its column is wider (and it bleeds past the
                // content edge below).
                p.id === "time" ? "lg:grid-cols-[0.8fr_1.2fr] lg:gap-16" : "lg:grid-cols-2",
              )}
            >
              {/* Alternate sides so the three blocks don't read as a list. */}
              <div className={i % 2 === 1 ? "lg:order-2" : undefined}>
                <span
                  className={cn(
                    "inline-flex rounded-full px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.14em]",
                    p.tone.soft,
                    p.tone.text,
                  )}
                >
                  {p.chip}
                </span>
                <h3 className="display mt-4 text-3xl leading-[1.1] tracking-tight text-[#272334] sm:text-4xl">
                  {p.headline}
                </h3>
                <p className="mt-4 text-base leading-[1.85] text-[#716277]">{p.lead}</p>

                <ul className="mt-8 space-y-6">
                  {p.rows.map((row) => (
                    <li key={row.title} className="flex gap-4">
                      <span
                        className={cn(
                          "grid size-10 shrink-0 place-items-center rounded-xl",
                          p.tone.soft,
                          p.tone.text,
                        )}
                      >
                        <row.icon className="size-[18px]" strokeWidth={1.7} />
                      </span>
                      <div>
                        <p className="font-medium text-[#272334]">{row.title}</p>
                        <p className="mt-1 text-sm leading-[1.75] text-[#716277]">{row.body}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div
                className={cn(
                  i % 2 === 1 && "lg:order-1",
                  p.id === "time" && "lg:w-[118%] xl:w-[125%]",
                )}
              >
                {visuals[p.id]}
              </div>
            </div>
          ))}
        </div>

        <p className="mt-16 text-center text-[11px] text-[#7c6b84]">
          Paid offers require a supported country and currency and a connected payout account.
        </p>
      </div>
    </section>
  );
}

function DashboardVisual() {
  return (
    <div className="overflow-hidden">
      <Image
        src="/hero-section-img.png"
        alt="The Flowboc dashboard showing revenue, upcoming classes, bookings, and students"
        width={3560}
        height={2600}
        className="h-auto w-full shadow-[0_30px_60px_rgba(19,14,29,0.18)]"
      />
    </div>
  );
}

function RevenueVisual() {
  const [period, setPeriod] = React.useState<GrowthPeriod>("4");
  const data = growthPeriods[period];

  return (
    <div className="rounded-[19px] bg-[#fffef9] p-6 shadow-[0_18px_40px_rgba(74,49,80,0.08)] ring-1 ring-[#efe9e1] sm:p-7">
      <div className="flex items-center justify-between gap-3">
        <div>
          <small className="text-[0.6rem] tracking-[0.1em] text-[#a38aaf]">BUSINESS INSIGHTS</small>
          <p className="display mt-1.5 text-xl text-[#272334]">See the bigger picture.</p>
        </div>
        <div className="flex gap-1 rounded-full border border-[#e5daeb] bg-[#f0eaf4] p-1">
          {(["4", "8"] as GrowthPeriod[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                "rounded-full px-2.5 py-1.5 text-[0.65rem] text-[#4a4152]",
                period === p && "bg-white shadow-sm",
              )}
            >
              {p} weeks
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8 flex items-end justify-between">
        <div>
          <span className="text-[0.65rem] text-[#a38aae]">Recorded revenue</span>
          <strong className="display mt-1 block text-3xl text-[#493151] sm:text-4xl">
            {data.revenue}
          </strong>
        </div>
        <span className="rounded-md bg-[#f3edf5] px-2 py-1 text-[0.55rem] tracking-[0.03em] text-[#272334]">
          EXAMPLE DATA
        </span>
      </div>

      <svg
        viewBox="0 0 520 185"
        role="img"
        aria-label={`Illustrative revenue chart over ${period} weeks`}
        className="mt-4 w-full"
      >
        <defs>
          <linearGradient id="launch-chart-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6355ff" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#6355ff" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d="M8 35H512M8 90H512M8 145H512" stroke="#e3e1eb" strokeDasharray="4 5" />
        <path d={`${data.line} V180H8Z`} fill="url(#launch-chart-fill)" />
        <path d={data.line} stroke="#6355ff" strokeWidth="3" fill="none" strokeLinejoin="round" />
        <circle cx="512" cy={data.lastCy} r="5" fill="#6355ff" />
      </svg>

      <div className="flex justify-between text-[0.6rem] text-[#af92b9]">
        <span>Week 1</span>
        <span>{data.rangeLabel}</span>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-3 border-t border-[#e9ddec] pt-5">
        {[
          ["Page views", data.views],
          ["Bookings", data.bookings],
          ["Class fill rate", data.fillRate],
        ].map(([label, value]) => (
          <div key={label}>
            <span className="block text-[0.6rem] text-[#af92b9]">{label}</span>
            <strong className="display mt-1 block text-lg text-[#272334]">{value}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

function NewsletterVisual({ onPreview }: { onPreview: () => void }) {
  return (
    <div className="relative mx-auto grid h-[420px] w-full max-w-[460px] place-items-center">
      <div className="absolute h-[345px] w-[410px] max-w-full -rotate-[8deg] rounded-full bg-[#eef0df]" />
      <div className="absolute right-[67px] top-4 grid size-[51px] place-items-center rounded-full border-[5px] border-[#fcfbf7] bg-[#d9e6c6] font-display text-xl text-[#748761]">
        J
      </div>
      <div className="absolute right-0 top-[180px] grid size-[51px] place-items-center rounded-full border-[5px] border-[#fcfbf7] bg-[#f1ddc0] font-display text-xl text-[#a6855b]">
        A
      </div>
      <div className="absolute bottom-6 left-0 grid size-[51px] place-items-center rounded-full border-[5px] border-[#fcfbf7] bg-[#e5d2ed] font-display text-xl text-[#9470a5]">
        L
      </div>

      <div className="relative w-[285px] -rotate-3 rounded-xl border border-[#eadfce] bg-[#fffaf0] p-6 shadow-[0_15px_30px_rgba(48,38,51,0.04)]">
        <div className="flex items-center gap-2 text-[0.55rem] tracking-[0.05em] text-[#ae8b9c]">
          <Mail className="size-3.5" />
          <span>FROM MAYA YOGA</span>
          <span className="ml-auto">♡</span>
        </div>
        <p className="display mt-5 text-3xl leading-[1.1] text-[#272334]">
          A little room
          <br />
          for <em className="font-normal italic text-[#9c7faa]">yourself.</em>
        </p>
        <p className="mt-4 text-xs leading-[1.8] text-[#a58b9e]">
          This week&rsquo;s classes are ready.
          <br />
          Come as you are.
        </p>
        <p className="mt-2 text-[0.65rem] leading-[1.9] text-[#a58b9e]">
          Join me for Morning Flow this Monday, or slow down with our evening reset. There is a
          place for you here.
        </p>
        <button
          onClick={onPreview}
          className="mt-5 w-full rounded-full bg-[#80619a] py-2.5 text-[0.65rem] text-white"
        >
          Preview a student update ↗
        </button>
        <small className="mt-3 block text-center text-[0.55rem] text-[#ba9fb4]">
          Illustrative newsletter preview
        </small>
      </div>
    </div>
  );
}
