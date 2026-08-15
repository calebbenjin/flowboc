import { prisma } from "@/lib/db";
import { formatClassDate, formatClassTime } from "@/lib/format-class-time";

export type AttentionItem = { id: string; kind: string; detail: string };

const NEAR_CAPACITY_THRESHOLD = 2;

export async function getAttentionItems(instructorId: string): Promise<AttentionItem[]> {
  const [publishedClasses, failedPayments, draftClasses] = await Promise.all([
    prisma.yogaClass.findMany({
      where: { instructorId, status: "PUBLISHED" },
      include: { _count: { select: { bookings: { where: { status: "CONFIRMED" } } } } },
      orderBy: { startAt: "asc" },
    }),
    prisma.booking.findMany({
      where: { instructorId, paymentStatus: "FAILED" },
      include: { class: { select: { name: true } } },
      orderBy: { bookedAt: "desc" },
      take: 5,
    }),
    prisma.yogaClass.findMany({
      where: { instructorId, status: "DRAFT" },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
  ]);

  const items: AttentionItem[] = [];

  for (const c of publishedClasses) {
    const spotsLeft = c.capacity - c._count.bookings;
    if (spotsLeft > 0 && spotsLeft <= NEAR_CAPACITY_THRESHOLD) {
      items.push({
        id: `almost-full-${c.id}`,
        kind: "Almost full",
        detail: `${c.name} · ${formatClassDate(c)} ${formatClassTime(c)} has ${spotsLeft} spot${spotsLeft === 1 ? "" : "s"} left`,
      });
    }
  }

  for (const b of failedPayments) {
    items.push({
      id: `failed-payment-${b.id}`,
      kind: "Failed payment",
      detail: `${b.studentName}'s payment for ${b.class.name} failed`,
    });
  }

  for (const c of draftClasses) {
    items.push({
      id: `draft-${c.id}`,
      kind: "Draft class",
      detail: `${c.name} is still unpublished`,
    });
  }

  return items;
}

export type DashboardStats = {
  revenueThisMonth: number;
  upcomingClasses: number;
  totalBookings: number;
  totalStudents: number;
};

export async function getDashboardStats(instructorId: string): Promise<DashboardStats> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [revenue, upcomingClasses, totalBookings, students] = await Promise.all([
    prisma.booking.aggregate({
      where: { instructorId, paymentStatus: "PAID", bookedAt: { gte: startOfMonth } },
      _sum: { amount: true },
    }),
    prisma.yogaClass.count({
      where: { instructorId, status: { in: ["PUBLISHED", "FULL"] }, startAt: { gte: now } },
    }),
    prisma.booking.count({ where: { instructorId, status: "CONFIRMED" } }),
    prisma.booking.findMany({
      where: { instructorId, status: "CONFIRMED" },
      select: { studentEmail: true },
      distinct: ["studentEmail"],
    }),
  ]);

  return {
    revenueThisMonth: revenue._sum.amount ?? 0,
    upcomingClasses,
    totalBookings,
    totalStudents: students.length,
  };
}

export type RecentBooking = {
  id: string;
  studentName: string;
  className: string;
  bookedAt: Date;
  paymentStatus: string;
  amount: number;
};

export async function getRecentBookings(instructorId: string, limit = 5): Promise<RecentBooking[]> {
  const bookings = await prisma.booking.findMany({
    where: { instructorId },
    include: { class: { select: { name: true } } },
    orderBy: { bookedAt: "desc" },
    take: limit,
  });

  return bookings.map((b) => ({
    id: b.id,
    studentName: b.studentName,
    className: b.class.name,
    bookedAt: b.bookedAt,
    paymentStatus: b.paymentStatus,
    amount: b.amount,
  }));
}
