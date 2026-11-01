"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { growthPeriods, type GrowthPeriod } from "./data";

export function Growth() {
  const [period, setPeriod] = React.useState<GrowthPeriod>("4");
  const data = growthPeriods[period];

  return (
    <section id="growth" className="bg-[#efebf7] px-5 py-16 sm:px-8 lg:py-24">
      <div className="mx-auto grid w-full max-w-[1230px] items-center gap-16 lg:grid-cols-2">
        <div className="rounded-[19px] bg-[#fffef9] p-6 shadow-[0_18px_40px_rgba(74,49,80,0.05)] sm:p-7">
          <div className="flex items-center justify-between gap-3">
            <div>
              <small className="text-[0.6rem] tracking-[0.1em] text-[#a38aaf]">
                BUSINESS INSIGHTS
              </small>
              <h3 className="display mt-1.5 text-xl text-[#272334]">See the bigger picture.</h3>
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
            <path
              d={data.line}
              stroke="#6355ff"
              strokeWidth="3"
              fill="none"
              strokeLinejoin="round"
            />
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

        <div>
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.17em] text-primary">
            Grow with a clearer picture
          </p>
          <h2 className="display mt-4 text-4xl leading-[1.08] tracking-tight text-[#272334] sm:text-5xl">
            See what is working.
            <br />
            Plan <em className="font-normal italic text-primary">what comes next.</em>
          </h2>
          <p className="mt-5 text-sm leading-[1.9] text-[#716277]">
            Follow page views, bookings, and recorded revenue. See class fill rates and which
            classes have earned the most, then use that activity to inform your schedule and offers.
          </p>
          <p className="mt-4 text-sm leading-[1.9] text-[#716277]">
            Make your next business decision with a clearer picture of what students are choosing.
          </p>
        </div>
      </div>
    </section>
  );
}
