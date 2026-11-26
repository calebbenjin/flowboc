import "server-only";
import { prisma } from "@/lib/db";
import { requireInstructor } from "@/lib/require-instructor";
import { canUseFullAnalytics } from "@/lib/analytics/access";
import {
  analyticsWeekStarts,
  emptyOfferMetrics,
  type AnalyticsData,
  type OfferMetrics,
  type TopClass,
  type WeeklyMetric,
} from "@/lib/analytics/metrics";
import { NEWSLETTER_CONSENT_SOURCES } from "@/lib/newsletter/consent";
import { zonedDateTimeToUtc } from "@/lib/timezone";
import { Prisma } from "@/generated/prisma/client";
import type { CurrencyCode } from "@/lib/demo";
export type { WeeklyMetric, TopClass } from "@/lib/analytics/metrics";

export async function getFullAnalytics(): Promise<AnalyticsData> {
  const instructor = await requireInstructor();
  if (!canUseFullAnalytics(instructor))
    throw new Error("Full analytics requires an eligible plan.");
  return loadAnalytics(instructor, true);
}

export async function getStarterStats() {
  const instructor = await requireInstructor();
  const analytics = await loadAnalytics(instructor, false);
  return {
    activeSubscribers: analytics.activeSubscribers,
    currencies: analytics.currencies,
    periods: [4, 8].map((range) => ({
      range,
      views: analytics.weeks.slice(-range).reduce((sum, week) => sum + week.views, 0),
      totals: analytics.currencies.map((currency) => ({
        currency,
        ...analytics.weeks.slice(-range).reduce(
          (sum, week) => {
            const value = week.currencies[currency] ?? emptyOfferMetrics();
            return {
              revenue: sum.revenue + value.classRevenue + value.sessionRevenue + value.ebookRevenue,
              orders: sum.orders + value.classBookings + value.sessionBookings + value.ebookSales,
            };
          },
          { revenue: 0, orders: 0 },
        ),
      })),
    })),
  };
}

async function loadAnalytics(
  instructor: Awaited<ReturnType<typeof requireInstructor>>,
  pro: boolean,
): Promise<AnalyticsData> {
  const weekStarts = analyticsWeekStarts(instructor.timezone);
  const earliest = zonedDateTimeToUtc(weekStarts[0]!, "00:00", instructor.timezone);
  type RevenueRow = {
    week: string;
    kind: "CLASS" | "SESSION" | "EBOOK";
    currency: CurrencyCode | null;
    revenue: bigint | null;
    orders: bigint;
  };
  type ActivityRow = { week: string; kind: "VIEW" | "SIGNUP" | "UNSUBSCRIBE"; count: bigint };
  const [sales, activity, activeSubscribers, classes] = await Promise.all([
    prisma.$queryRaw<RevenueRow[]>(Prisma.sql`
      SELECT to_char(date_trunc('week',s.at AT TIME ZONE 'UTC' AT TIME ZONE ${instructor.timezone}),'YYYY-MM-DD') AS week,
        s.kind,s.currency,SUM(s.amount)::bigint AS revenue,SUM(s.orders)::bigint AS orders
      FROM (
        SELECT 'CLASS'::text AS kind,currency::text AS currency,amount,"bookedAt" AS at,CASE WHEN status='CONFIRMED' THEN 1 ELSE 0 END AS orders
          FROM "Booking" WHERE "instructorId"=${instructor.id} AND "paymentStatus"='PAID' AND "bookedAt">=${earliest}
        UNION ALL SELECT 'SESSION',currency::text,COALESCE(amount,0),"createdAt",1 FROM "VideoCallBooking"
          WHERE "instructorId"=${instructor.id} AND "paymentStatus"='PAID' AND "createdAt">=${earliest}
        UNION ALL SELECT 'EBOOK',currency::text,amount,"createdAt",1 FROM "EbookPurchase"
          WHERE "instructorId"=${instructor.id} AND "paymentStatus"='PAID' AND "createdAt">=${earliest}
      ) s GROUP BY week,s.kind,s.currency`),
    prisma.$queryRaw<ActivityRow[]>(Prisma.sql`
      SELECT to_char(date_trunc('week',s.at AT TIME ZONE 'UTC' AT TIME ZONE ${instructor.timezone}),'YYYY-MM-DD') AS week,s.kind,COUNT(*)::bigint AS count FROM (
        SELECT 'VIEW'::text AS kind,"createdAt" AS at FROM "PageView" WHERE "instructorId"=${instructor.id} AND "createdAt">=${earliest}
        UNION ALL SELECT 'SIGNUP',"subscribedAt" FROM "NewsletterSubscriber" WHERE "instructorId"=${instructor.id} AND source IN (${Prisma.join(NEWSLETTER_CONSENT_SOURCES)}) AND "subscribedAt">=${earliest}
        UNION ALL SELECT 'UNSUBSCRIBE',"unsubscribedAt" FROM "NewsletterSubscriber" WHERE "instructorId"=${instructor.id} AND source IN (${Prisma.join(NEWSLETTER_CONSENT_SOURCES)}) AND "unsubscribedAt">=${earliest}
      ) s GROUP BY week,s.kind`),
    prisma.newsletterSubscriber.count({
      where: {
        instructorId: instructor.id,
        status: "SUBSCRIBED",
        source: { in: NEWSLETTER_CONSENT_SOURCES },
      },
    }),
    pro
      ? prisma.yogaClass.findMany({
          where: { instructorId: instructor.id },
          select: {
            id: true,
            name: true,
            status: true,
            capacity: true,
            bookings: {
              where: { paymentStatus: "PAID" },
              select: { amount: true, currency: true, status: true },
            },
          },
        })
      : Promise.resolve([]),
  ]);
  const weeks: WeeklyMetric[] = weekStarts.map((week) => ({
    week,
    label: new Intl.DateTimeFormat("en-GB", {
      timeZone: "UTC",
      month: "short",
      day: "numeric",
    }).format(new Date(`${week}T12:00:00Z`)),
    views: 0,
    signups: 0,
    unsubscribes: 0,
    currencies: {},
  }));
  const byWeek = new Map(weeks.map((week) => [week.week, week]));
  const currencies = new Set<CurrencyCode>([instructor.currency]);
  for (const row of sales) {
    const week = byWeek.get(row.week);
    if (!week) continue;
    // Legacy sessions with no recorded currency are free; never assign paid revenue to a guessed currency.
    const currency = row.currency ?? instructor.currency;
    currencies.add(currency);
    const values = week.currencies[currency] ?? emptyOfferMetrics();
    const revenueKey: keyof OfferMetrics =
      row.kind === "CLASS"
        ? "classRevenue"
        : row.kind === "SESSION"
          ? "sessionRevenue"
          : "ebookRevenue";
    const countKey: keyof OfferMetrics =
      row.kind === "CLASS"
        ? "classBookings"
        : row.kind === "SESSION"
          ? "sessionBookings"
          : "ebookSales";
    values[revenueKey] += row.currency ? Number(row.revenue ?? 0) : 0;
    values[countKey] += Number(row.orders);
    week.currencies[currency] = values;
  }
  for (const row of activity) {
    const week = byWeek.get(row.week);
    if (week)
      week[row.kind === "VIEW" ? "views" : row.kind === "SIGNUP" ? "signups" : "unsubscribes"] +=
        Number(row.count);
  }
  const topClasses: TopClass[] = [];
  for (const cls of classes) {
    const grouped = new Map<CurrencyCode, { earned: number; booked: number }>();
    for (const booking of cls.bookings) {
      const current = grouped.get(booking.currency) ?? { earned: 0, booked: 0 };
      current.earned += booking.amount;
      if (booking.status === "CONFIRMED") current.booked++;
      grouped.set(booking.currency, current);
    }
    for (const [currency, value] of grouped) {
      currencies.add(currency);
      topClasses.push({ id: cls.id, name: cls.name, currency, ...value });
    }
  }
  const active = classes.filter(
    (cls) => ["PUBLISHED", "FULL"].includes(cls.status) && cls.capacity > 0,
  );
  return {
    weeks,
    currencies: [...currencies],
    activeSubscribers,
    fillRate: active.length
      ? (active.reduce(
          (total, cls) =>
            total +
            cls.bookings.filter((booking) => booking.status === "CONFIRMED").length / cls.capacity,
          0,
        ) /
          active.length) *
        100
      : 0,
    topClasses: topClasses.sort((a, b) => b.earned - a.earned),
  };
}
