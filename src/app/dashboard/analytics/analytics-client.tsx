"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
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
const viewsConfig = { views: { label: "Page visits", color: "#a596ff" } } satisfies ChartConfig;

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
  const axes = (
    <>
      <CartesianGrid vertical={false} />
      <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} minTickGap={18} />
      <YAxis
        tickLine={false}
        axisLine={false}
        width={monetary ? 60 : 35}
        allowDecimals={false}
        tickFormatter={(value: number) => (monetary ? money(value, currency) : String(value))}
      />
      <ChartTooltip
        content={
          <ChartTooltipContent
            formatter={(value) => (monetary ? money(Number(value), currency) : String(value))}
          />
        }
      />
      <ChartLegend content={<ChartLegendContent />} />
    </>
  );
  return (
    <ChartContainer config={config} className="mt-5 aspect-auto h-64 w-full">
      {bars ? (
        <BarChart data={data} margin={{ left: 0, right: 5, top: 8 }}>
          {axes}
          {Object.keys(config).map((key) => (
            <Bar
              key={key}
              dataKey={key}
              fill={`var(--color-${key})`}
              radius={[3, 3, 0, 0]}
              maxBarSize={24}
              isAnimationActive={false}
            />
          ))}
        </BarChart>
      ) : (
        <AreaChart data={data} margin={{ left: 0, right: 5, top: 8 }}>
          {axes}
          {Object.keys(config).map((key) => (
            <Area
              key={key}
              type="monotone"
              dataKey={key}
              stroke={`var(--color-${key})`}
              fill={`var(--color-${key})`}
              fillOpacity={0.08}
              strokeWidth={2}
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
            <p>Discover more with Pro</p>
            <Link href="/dashboard/billing" className={styles["cta"]}>
              Unlock your insights <ArrowRight size={16} />
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
        aria-label={locked ? "Pro analytics preview" : "Pro performance analytics"}
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
