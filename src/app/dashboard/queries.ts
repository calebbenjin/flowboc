import { prisma } from "@/lib/db";
import { formatClassDate, formatClassTime } from "@/lib/format-class-time";
import { slugify } from "@/lib/slug";

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

  const [
    classRevenue,
    videoCallRevenue,
    upcomingClasses,
    totalClassBookings,
    totalVideoCallBookings,
    classStudents,
    videoCallStudents,
  ] = await Promise.all([
    prisma.booking.aggregate({
      where: { instructorId, paymentStatus: "PAID", bookedAt: { gte: startOfMonth } },
      _sum: { amount: true },
    }),
    prisma.videoCallBooking.aggregate({
      where: { instructorId, paymentStatus: "PAID", createdAt: { gte: startOfMonth } },
      _sum: { amount: true },
    }),
    prisma.yogaClass.count({
      where: { instructorId, status: { in: ["PUBLISHED", "FULL"] }, startAt: { gte: now } },
    }),
    prisma.booking.count({ where: { instructorId, status: "CONFIRMED" } }),
    prisma.videoCallBooking.count({ where: { instructorId } }),
    prisma.booking.findMany({
      where: { instructorId, status: "CONFIRMED" },
      select: { studentEmail: true },
      distinct: ["studentEmail"],
    }),
    prisma.videoCallBooking.findMany({
      where: { instructorId },
      select: { studentEmail: true },
      distinct: ["studentEmail"],
    }),
  ]);

  const uniqueStudentEmails = new Set([
    ...classStudents.map((s) => s.studentEmail),
    ...videoCallStudents.map((s) => s.studentEmail),
  ]);

  return {
    revenueThisMonth: (classRevenue._sum.amount ?? 0) + (videoCallRevenue._sum.amount ?? 0),
    upcomingClasses,
    totalBookings: totalClassBookings + totalVideoCallBookings,
    totalStudents: uniqueStudentEmails.size,
  };
}

export type ChecklistItem = {
  key: string;
  label: string;
  done: boolean;
  href: string;
};

export async function getOnboardingChecklist(instructor: {
  id: string;
  name: string;
  slug: string;
  payoutStatus: string;
}): Promise<ChecklistItem[]> {
  const [classCount, bookingCount] = await Promise.all([
    prisma.yogaClass.count({ where: { instructorId: instructor.id } }),
    prisma.booking.count({ where: { instructorId: instructor.id, status: "CONFIRMED" } }),
  ]);

  return [
    {
      key: "create-class",
      label: "Create your first class",
      done: classCount > 0,
      href: "/dashboard/classes/new",
    },
    {
      key: "connect-payouts",
      label: "Connect your payouts",
      done: instructor.payoutStatus === "CONNECTED",
      href: "/dashboard/payouts",
    },
    {
      key: "customize-slug",
      label: "Customize your booking link",
      // No stored "did they touch this" flag — approximated by comparing
      // against the name-derived default. A false positive (kept the
      // default, which happened to need a dedupe suffix) is harmless here.
      done: instructor.slug !== slugify(instructor.name),
      href: "/dashboard/profile",
    },
    {
      key: "first-booking",
      label: "Get your first booking",
      done: bookingCount > 0,
      href: `/${instructor.slug}`,
    },
  ];
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
  const [bookings, videoCallBookings] = await Promise.all([
    prisma.booking.findMany({
      where: { instructorId },
      include: { class: { select: { name: true } } },
      orderBy: { bookedAt: "desc" },
      take: limit,
    }),
    prisma.videoCallBooking.findMany({
      where: { instructorId },
      include: { instructor: { select: { videoCallTitle: true } } },
      orderBy: { createdAt: "desc" },
      take: limit,
    }),
  ]);

  // Each source only contributes its own most-recent `limit` rows, but the
  // merged+sorted+truncated result is still correctly the overall top
  // `limit` across both — standard top-N merge.
  const combined: RecentBooking[] = [
    ...bookings.map((b) => ({
      id: b.id,
      studentName: b.studentName,
      className: b.class.name,
      bookedAt: b.bookedAt,
      paymentStatus: b.paymentStatus,
      amount: b.amount,
    })),
    ...videoCallBookings.map((v) => ({
      id: v.id,
      studentName: v.studentName,
      className: v.instructor.videoCallTitle || "Video call",
      bookedAt: v.createdAt,
      paymentStatus: v.paymentStatus,
      amount: v.amount ?? 0,
    })),
  ];

  return combined.sort((a, b) => b.bookedAt.getTime() - a.bookedAt.getTime()).slice(0, limit);
}
