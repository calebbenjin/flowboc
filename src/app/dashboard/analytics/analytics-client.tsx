"use client";

import { useMemo, useState, type ComponentType } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Wallet, Eye, TrendingUp, Users } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { money } from "@/lib/demo";
import { cn } from "@/lib/utils";
import type { TopClass, WeeklyMetric } from "./queries";

const periods = [
  { label: "4 weeks", count: 4 },
  { label: "8 weeks", count: 8 },
];

function pctDelta(current: number, previous: number) {
  if (!previous) return null;
  return ((current - previous) / previous) * 100;
}

function sum(rows: WeeklyMetric[], key: "revenue" | "views" | "bookings") {
  return rows.reduce((s, r) => s + r[key], 0);
}

function compactMoney(amount: number) {
  return amount >= 1000 ? money(Math.round(amount / 1000)).concat("k") : money(amount);
}

function StatCard({
  label,
  value,
  delta,
  icon: Icon,
}: {
  label: string;
  value: string;
  delta: number | null;
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <div className="surface p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
        <Icon className="size-4 text-muted-foreground" />
      </div>
      <p className="display mt-2 text-3xl">{value}</p>
      {delta !== null && (
        <p
          className={cn(
            "mt-1 text-xs font-medium",
            delta >= 0 ? "text-success" : "text-destructive",
          )}
        >
          {delta >= 0 ? "+" : ""}
          {delta.toFixed(1)}% vs prior period
        </p>
      )}
    </div>
  );
}

const revenueConfig = {
  revenue: { label: "Revenue", color: "var(--color-chart-revenue)" },
} satisfies ChartConfig;

const viewsConfig = {
  views: { label: "Site views", color: "var(--color-chart-views)" },
} satisfies ChartConfig;

const bookingsConfig = {
  bookings: { label: "Bookings", color: "var(--color-chart-engagement)" },
} satisfies ChartConfig;

export function AnalyticsClient({
  weeklyMetrics,
  fillRate,
  topClasses,
}: {
  weeklyMetrics: WeeklyMetric[];
  fillRate: number;
  topClasses: TopClass[];
}) {
  const [range, setRange] = useState(8);

  const data = useMemo(() => weeklyMetrics.slice(-range), [weeklyMetrics, range]);
  const prevData = useMemo(
    () =>
      weeklyMetrics.slice(
        Math.max(0, weeklyMetrics.length - range * 2),
        weeklyMetrics.length - range,
      ),
    [weeklyMetrics, range],
  );

  const totalRevenue = sum(data, "revenue");
  const totalViews = sum(data, "views");
  const totalBookings = sum(data, "bookings");
  const conversion = totalViews > 0 ? (totalBookings / totalViews) * 100 : 0;
  const prevConversionViews = sum(prevData, "views");
  const prevConversion =
    prevConversionViews > 0 ? (sum(prevData, "bookings") / prevConversionViews) * 100 : 0;

  return (
    <DashboardShell>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl">Analytics</h1>
          <p className="mt-1 text-sm text-muted-foreground">How your booking page is performing.</p>
        </div>
        <div className="flex gap-2">
          {periods.map((p) => (
            <button
              key={p.count}
              type="button"
              onClick={() => setRange(p.count)}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                range === p.count
                  ? "bg-primary text-primary-foreground"
                  : "border border-border text-muted-foreground hover:bg-accent",
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Revenue"
          value={money(totalRevenue)}
          delta={pctDelta(totalRevenue, sum(prevData, "revenue"))}
          icon={Wallet}
        />
        <StatCard
          label="Site views"
          value={totalViews.toLocaleString()}
          delta={pctDelta(totalViews, sum(prevData, "views"))}
          icon={Eye}
        />
        <StatCard
          label="View → booking rate"
          value={`${conversion.toFixed(1)}%`}
          delta={pctDelta(conversion, prevConversion)}
          icon={TrendingUp}
        />
        <StatCard
          label="Avg. fill rate"
          value={`${fillRate.toFixed(0)}%`}
          delta={null}
          icon={Users}
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="surface p-6">
          <h2 className="text-sm font-medium">Revenue</h2>
          <p className="text-xs text-muted-foreground">Weekly earnings across all classes</p>
          <ChartContainer config={revenueConfig} className="mt-4 aspect-auto h-56 w-full">
            <AreaChart data={data} margin={{ left: 0, right: 8, top: 8 }}>
              <defs>
                <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-revenue)" stopOpacity={0.22} />
                  <stop offset="100%" stopColor="var(--color-revenue)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="week" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                width={48}
                tickFormatter={(v: number) => compactMoney(v)}
              />
              <ChartTooltip content={<ChartTooltipContent formatter={(v) => money(Number(v))} />} />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="var(--color-revenue)"
                strokeWidth={2}
                fill="url(#revenueFill)"
              />
            </AreaChart>
          </ChartContainer>
        </div>

        <div className="surface p-6">
          <h2 className="text-sm font-medium">Site views</h2>
          <p className="text-xs text-muted-foreground">Visits to your booking page</p>
          <ChartContainer config={viewsConfig} className="mt-4 aspect-auto h-56 w-full">
            <AreaChart data={data} margin={{ left: 0, right: 8, top: 8 }}>
              <defs>
                <linearGradient id="viewsFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-views)" stopOpacity={0.22} />
                  <stop offset="100%" stopColor="var(--color-views)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="week" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis tickLine={false} axisLine={false} tickMargin={8} width={40} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area
                type="monotone"
                dataKey="views"
                stroke="var(--color-views)"
                strokeWidth={2}
                fill="url(#viewsFill)"
              />
            </AreaChart>
          </ChartContainer>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="surface p-6">
          <h2 className="text-sm font-medium">Bookings</h2>
          <p className="text-xs text-muted-foreground">New bookings created per week</p>
          <ChartContainer config={bookingsConfig} className="mt-4 aspect-auto h-56 w-full">
            <BarChart data={data} margin={{ left: 0, right: 8, top: 8 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="week" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                width={32}
                allowDecimals={false}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar
                dataKey="bookings"
                fill="var(--color-bookings)"
                radius={[4, 4, 0, 0]}
                maxBarSize={24}
              />
            </BarChart>
          </ChartContainer>
        </div>

        <div className="surface p-6">
          <h2 className="text-sm font-medium">Top classes by revenue</h2>
          <p className="text-xs text-muted-foreground">All-time · booked spots × price</p>
          <div className="mt-5 space-y-4">
            {topClasses.map((c) => (
              <div key={c.id} className="flex items-center justify-between gap-3 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.booked} booked</p>
                </div>
                <span className="shrink-0 font-medium">{money(c.earned)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
