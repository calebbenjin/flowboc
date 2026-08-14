import { startOfWeek, subWeeks, format } from "date-fns";
import { prisma } from "@/lib/db";

export type WeeklyMetric = { week: string; revenue: number; views: number; bookings: number };

// 16 weeks so the client can show an 8-week view alongside an 8-week prior
// period for the vs-prior-period deltas.
const WEEKS_OF_HISTORY = 16;
const WEEK_KEY = "yyyy-MM-dd";

function weekKey(d: Date): string {
  return format(d, WEEK_KEY);
}

export async function getWeeklyMetrics(instructorId: string): Promise<WeeklyMetric[]> {
  const earliestWeekStart = startOfWeek(subWeeks(new Date(), WEEKS_OF_HISTORY - 1), {
    weekStartsOn: 1,
  });

  const [revenueRows, bookingRows, viewRows] = await Promise.all([
    prisma.$queryRaw<{ week: Date; revenue: bigint | null }[]>`
      SELECT date_trunc('week', "bookedAt") as week, SUM("amount")::bigint as revenue
      FROM "Booking"
      WHERE "instructorId" = ${instructorId}
        AND "paymentStatus" = 'PAID'
        AND "bookedAt" >= ${earliestWeekStart}
      GROUP BY week
    `,
    prisma.$queryRaw<{ week: Date; count: bigint }[]>`
      SELECT date_trunc('week', "bookedAt") as week, COUNT(*)::bigint as count
      FROM "Booking"
      WHERE "instructorId" = ${instructorId}
        AND "bookedAt" >= ${earliestWeekStart}
      GROUP BY week
    `,
    prisma.$queryRaw<{ week: Date; count: bigint }[]>`
      SELECT date_trunc('week', "createdAt") as week, COUNT(*)::bigint as count
      FROM "PageView"
      WHERE "instructorId" = ${instructorId}
        AND "createdAt" >= ${earliestWeekStart}
      GROUP BY week
    `,
  ]);

  const revenueByWeek = new Map(revenueRows.map((r) => [weekKey(r.week), Number(r.revenue ?? 0)]));
  const bookingsByWeek = new Map(bookingRows.map((r) => [weekKey(r.week), Number(r.count)]));
  const viewsByWeek = new Map(viewRows.map((r) => [weekKey(r.week), Number(r.count)]));

  const weeks: WeeklyMetric[] = [];
  for (let i = WEEKS_OF_HISTORY - 1; i >= 0; i--) {
    const start = startOfWeek(subWeeks(new Date(), i), { weekStartsOn: 1 });
    const key = weekKey(start);
    weeks.push({
      week: format(start, "MMM d"),
      revenue: revenueByWeek.get(key) ?? 0,
      bookings: bookingsByWeek.get(key) ?? 0,
      views: viewsByWeek.get(key) ?? 0,
    });
  }
  return weeks;
}

export type TopClass = {
  id: string;
  name: string;
  booked: number;
  earned: number;
};

export async function getFillRateAndTopClasses(
  instructorId: string,
): Promise<{ fillRate: number; topClasses: TopClass[] }> {
  const classes = await prisma.yogaClass.findMany({
    where: { instructorId },
    select: {
      id: true,
      name: true,
      status: true,
      capacity: true,
      bookings: {
        where: { status: "CONFIRMED" },
        select: { paymentStatus: true, amount: true },
      },
    },
  });

  const withEarnings = classes.map((c) => ({
    id: c.id,
    name: c.name,
    status: c.status,
    capacity: c.capacity,
    booked: c.bookings.length,
    earned: c.bookings
      .filter((b) => b.paymentStatus === "PAID")
      .reduce((sum, b) => sum + b.amount, 0),
  }));

  const activeClasses = withEarnings.filter((c) => c.status === "PUBLISHED" || c.status === "FULL");
  const fillRate =
    activeClasses.length > 0
      ? (activeClasses.reduce((sum, c) => sum + c.booked / c.capacity, 0) / activeClasses.length) *
        100
      : 0;

  const topClasses = [...withEarnings].sort((a, b) => b.earned - a.earned).slice(0, 4);

  return { fillRate, topClasses };
}
