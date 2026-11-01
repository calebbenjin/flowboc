import type { CurrencyCode } from "../demo.ts";
export type OfferMetrics = {
  classRevenue: number;
  sessionRevenue: number;
  ebookRevenue: number;
  classBookings: number;
  sessionBookings: number;
  ebookSales: number;
};
export type WeeklyMetric = {
  week: string;
  label: string;
  views: number;
  signups: number;
  unsubscribes: number;
  currencies: Partial<Record<CurrencyCode, OfferMetrics>>;
};
export type TopClass = {
  id: string;
  name: string;
  booked: number;
  earned: number;
  currency: CurrencyCode;
};
export type AnalyticsData = {
  weeks: WeeklyMetric[];
  currencies: CurrencyCode[];
  activeSubscribers: number;
  fillRate: number;
  topClasses: TopClass[];
};
export function emptyOfferMetrics(): OfferMetrics {
  return {
    classRevenue: 0,
    sessionRevenue: 0,
    ebookRevenue: 0,
    classBookings: 0,
    sessionBookings: 0,
    ebookSales: 0,
  };
}
export function analyticsWeekStarts(timezone: string, now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const get = (key: string) => Number(parts.find((part) => part.type === key)?.value);
  const monday = new Date(Date.UTC(get("year"), get("month") - 1, get("day")));
  monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() + 6) % 7));
  return Array.from({ length: 16 }, (_, index) =>
    new Date(monday.getTime() - (15 - index) * 7 * 86400000).toISOString().slice(0, 10),
  );
}
export function currencySeries(weeks: WeeklyMetric[], currency: CurrencyCode) {
  return weeks.map((week) => {
    const metrics = week.currencies[currency] ?? emptyOfferMetrics();
    return {
      ...week,
      ...metrics,
      revenue: metrics.classRevenue + metrics.sessionRevenue + metrics.ebookRevenue,
      orders: metrics.classBookings + metrics.sessionBookings + metrics.ebookSales,
    };
  });
}
export function illustrativeAnalytics(currency: CurrencyCode, timezone: string): AnalyticsData {
  return {
    currencies: [currency],
    activeSubscribers: 86,
    fillRate: 76,
    topClasses: [{ id: "preview", name: "Morning Flow", booked: 24, earned: 672, currency }],
    weeks: analyticsWeekStarts(timezone).map((week, index) => ({
      week,
      label: new Intl.DateTimeFormat("en-GB", {
        timeZone: "UTC",
        month: "short",
        day: "numeric",
      }).format(new Date(`${week}T12:00:00Z`)),
      views: 90 + index * 13,
      signups: 3 + (index % 5),
      unsubscribes: index % 3 === 0 ? 1 : 0,
      currencies: {
        [currency]: {
          classRevenue: 120 + index * 24,
          sessionRevenue: 70 + index * 12,
          ebookRevenue: 18 + index * 9,
          classBookings: 4 + index,
          sessionBookings: 1 + (index % 4),
          ebookSales: 2 + (index % 6),
        },
      },
    })),
  };
}
