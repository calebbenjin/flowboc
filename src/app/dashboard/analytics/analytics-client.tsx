"use client";

import Link from "next/link";
import { useId, useMemo, useState, type ReactNode } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ArrowRight, Flower2, LockKeyhole } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { useInstructor } from "@/components/InstructorProvider";
import { money, type CurrencyCode } from "@/lib/demo";
import { currencySeries, type AnalyticsData } from "@/lib/analytics/metrics";
import { cn } from "@/lib/utils";
import styles from "./analytics.module.css";

const revenueConfig = {
  classRevenue: { label: "Classes", color: "#6355ff" },
  sessionRevenue: { label: "1:1 sessions", color: "#b28a54" },
  ebookRevenue: { label: "Ebooks", color: "#3f8b78" },
} satisfies ChartConfig;
const ordersConfig = {
  classBookings: { label: "Class bookings", color: "#6355ff" },
  sessionBookings: { label: "1:1 sessions", color: "#b28a54" },
  ebookSales: { label: "Ebook sales", color: "#3f8b78" },
} satisfies ChartConfig;
const audienceConfig = {
  signups: { label: "Opt-ins", color: "#6355ff" },
  unsubscribes: { label: "Unsubscribes", color: "#b56d77" },
} satisfies ChartConfig;
const viewsConfig = { views: { label: "Page visits", color: "#7060cf" } } satisfies ChartConfig;

function TrendChart({
  data,
  config,
  bars = false,
  monetary = false,
  currency,
}: {
  data: ReturnType<typeof currencySeries>;
  config: ChartConfig;
  bars?: boolean;
  monetary?: boolean;
  currency: CurrencyCode;
}) {
  const gradientId = useId();
  const axes = [
    <CartesianGrid key="grid" vertical={false} strokeDasharray="3 5" />,
    <XAxis
      key="date"
      dataKey="label"
      tickLine={false}
      axisLine={false}
      tickMargin={8}
      minTickGap={18}
    />,
    <YAxis
      key="value"
      domain={[0, (maximum: number) => Math.max(maximum, 1)]}
      tickLine={false}
      axisLine={false}
      width={monetary ? 60 : 35}
      allowDecimals={false}
      tickFormatter={(value: number) => (monetary ? money(value, currency) : String(value))}
    />,
    <ChartTooltip
      key="tooltip"
      cursor={bars ? { fill: "#6355ff", fillOpacity: 0.06 } : { strokeDasharray: "4 4" }}
      content={
        <ChartTooltipContent
          formatter={(value, name) => (
            <div className={styles["tooltipRow"]}>
              <span
                className={styles["seriesDot"]}
                style={{ backgroundColor: config[name]?.color }}
              />
              <span>{config[name]?.label ?? name}</span>
              <strong>{monetary ? money(Number(value), currency) : String(value)}</strong>
            </div>
          )}
        />
      }
    />,
    <ChartLegend key="legend" content={<ChartLegendContent />} />,
  ];
  return (
    <ChartContainer config={config} className={cn("mt-5 aspect-auto w-full", styles["plot"])}>
      {bars ? (
        <BarChart accessibilityLayer data={data} barGap={4} margin={{ left: 0, right: 5, top: 8 }}>
          {axes}
          {Object.entries(config).map(([key, { color }]) => (
            <Bar
              key={key}
              dataKey={key}
              fill={color}
              radius={[5, 5, 0, 0]}
              maxBarSize={24}
              isAnimationActive={false}
            />
          ))}
        </BarChart>
      ) : (
        <AreaChart accessibilityLayer data={data} margin={{ left: 0, right: 5, top: 8 }}>
          <defs>
            {Object.entries(config).map(([key, { color }]) => (
              <linearGradient key={key} id={`${gradientId}-${key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.24} />
                <stop offset="100%" stopColor={color} stopOpacity={0.02} />
              </linearGradient>
            ))}
          </defs>
          {axes}
          {Object.entries(config).map(([key, { color }]) => (
            <Area
              key={key}
              type="monotone"
              dataKey={key}
              stroke={color}
              fill={`url(#${gradientId}-${key})`}
              strokeWidth={2.5}
              dot={data.length === 1 ? { r: 3 } : false}
              activeDot={{ r: 5, stroke: "#fcfbf7", strokeWidth: 2 }}
              isAnimationActive={false}
            />
          ))}
        </AreaChart>
      )}
    </ChartContainer>
  );
}

function ProCard({ locked, children }: { locked: boolean; children: ReactNode }) {
  return (
    <article className={styles["chart"]}>
      <div
        className={cn(locked && styles["blurred"])}
        inert={locked || undefined}
        aria-hidden={locked || undefined}
      >
        {children}
      </div>
      {locked && (
        <div className={styles["upgradeLayer"]}>
          <div className={styles["upgrade"]}>
            <LockKeyhole size={22} className="mx-auto text-[#6355ff]" aria-hidden="true" />
            <p>Restore access to analytics</p>
            <Link href="/dashboard/billing" className={styles["cta"]}>
              Manage your plan <ArrowRight size={16} />
            </Link>
            <small>Illustrative chart preview</small>
          </div>
        </div>
      )}
    </article>
  );
}

export function AnalyticsClient({
  analytics,
  locked = false,
  children,
  starterStats,
}: {
  starterStats?: Awaited<ReturnType<typeof import("./queries").getStarterStats>> | undefined;
  analytics: AnalyticsData;
  locked?: boolean;
  children?: ReactNode;
}) {
  const instructor = useInstructor();
  const [range, setRange] = useState(8);
  const [currency, setCurrency] = useState<CurrencyCode>(instructor.currency);
  const data = useMemo(
    () => currencySeries(analytics.weeks.slice(-range), currency),
    [analytics.weeks, range, currency],
  );
  const summary = starterStats?.periods.find((period) => period.range === range);
  const total = summary?.totals.find((total) => total.currency === currency);
  const revenue = total?.revenue ?? data.reduce((total, week) => total + week.revenue, 0);
  const orders = total?.orders ?? data.reduce((total, week) => total + week.orders, 0);
  const views = summary?.views ?? data.reduce((total, week) => total + week.views, 0);
  const top = analytics.topClasses
    .filter((cls) => cls.currency === currency)
    .sort((a, b) => b.earned - a.earned)
    .slice(0, 4);
  return (
    <DashboardShell>
      <header>
        <h1 className="text-3xl">Analytics</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          See what’s growing across your teaching, offers, and community.
        </p>
      </header>
      <section
        className={styles["proArea"]}
        aria-label={locked ? "Analytics preview" : "Performance analytics"}
      >
        <div className={styles["charts"]}>
          <div className={styles["controls"]}>
            <div role="group" aria-label="Chart period">
              {[4, 8].map((weeks) => (
                <button key={weeks} aria-pressed={range === weeks} onClick={() => setRange(weeks)}>
                  {weeks} weeks
                </button>
              ))}
            </div>
            <label>
              Revenue currency
              <select
                value={currency}
                onChange={(event) => setCurrency(event.target.value as CurrencyCode)}
              >
                {(starterStats?.currencies ?? analytics.currencies).map((value) => (
                  <option key={value}>{value}</option>
                ))}
              </select>
            </label>
          </div>
          <div className={styles["stats"]}>
            {[
              { label: "Paid revenue", value: money(revenue, currency) },
              { label: "Completed orders", value: orders.toLocaleString() },
              { label: "Page visits", value: views.toLocaleString() },
              {
                label: "Newsletter subscribers",
                value: (
                  starterStats?.activeSubscribers ?? analytics.activeSubscribers
                ).toLocaleString(),
              },
            ].map(({ label, value }) => (
              <div key={label}>
                <p>{label}</p>
                <strong>{value}</strong>
                {label === "Newsletter subscribers" && <small>Current opted-in audience</small>}
              </div>
            ))}
          </div>
          <p className={styles["note"]}>
            Weeks follow {instructor.timezone}. Revenue is shown in {currency}, before processor
            fees. Pending, failed, and refunded payments are excluded. Completed orders include free
            bookings and downloads.
          </p>
          <div className={styles["grid"]}>
            <ProCard locked={locked}>
              <h2>Revenue by offer</h2>
              <p>Classes, personal sessions, and ebooks · {currency}</p>
              <TrendChart data={data} config={revenueConfig} monetary currency={currency} />
            </ProCard>
            <ProCard locked={locked}>
              <h2>Completed bookings &amp; sales</h2>
              <p>Confirmed paid or free orders, grouped by offer</p>
              <TrendChart data={data} config={ordersConfig} bars currency={currency} />
            </ProCard>
            <ProCard locked={locked}>
              <h2>Newsletter activity</h2>
              <p>Latest recorded opt-ins and unsubscribes</p>
              <TrendChart data={data} config={audienceConfig} bars currency={currency} />
              <p className={styles["note"]}>
                Based on retained contacts’ latest signup and unsubscribe dates. Repeat signup
                history and deleted contacts aren’t retained.
              </p>
            </ProCard>
            <ProCard locked={locked}>
              <h2>Public-page visits</h2>
              <p>Visits to your teaching page, including repeat visits</p>
              <TrendChart data={data} config={viewsConfig} currency={currency} />
            </ProCard>
          </div>
          <div className={styles["grid"]}>
            <ProCard locked={locked}>
              <h2>Top classes by paid revenue</h2>
              <p>All-time · {currency} only</p>
              {top.length ? (
                top.map((cls) => (
                  <div key={`${cls.id}:${cls.currency}`} className={styles["topClass"]}>
                    <div>
                      <strong>{cls.name}</strong>
                      <span>{cls.booked} confirmed bookings</span>
                    </div>
                    <strong>{money(cls.earned, cls.currency)}</strong>
                  </div>
                ))
              ) : (
                <p className="mt-5">Your paid class activity will appear here.</p>
              )}
            </ProCard>
            <ProCard locked={locked}>
              <Flower2 className="mb-4 size-6 text-[#6355ff]" />
              <h2>Space on the mat</h2>
              <strong className={styles["fillRate"]}>{analytics.fillRate.toFixed(0)}%</strong>
              <p>
                Average fill rate across published classes, using confirmed paid or free bookings.
              </p>
            </ProCard>
          </div>
        </div>
      </section>
      {children}
    </DashboardShell>
  );
}
