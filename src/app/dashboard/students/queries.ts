import { prisma } from "@/lib/db";

export type StudentRow = {
  name: string;
  email: string;
  phone: string | null;
  classesBooked: number;
  classesAttended: number;
  totalSpent: number;
  lastBookingAt: Date | null;
  upcoming: { className: string; startAt: Date; timezone: string } | null;
};

// No SQL groupBy here — Prisma's groupBy can't conditionally aggregate
// (e.g. "sum amount only where paymentStatus = PAID" within one group) and
// per-instructor booking volume is small enough that aggregating in JS
// over a single query is both simpler and plenty fast.
export async function getStudents(instructorId: string): Promise<StudentRow[]> {
  const bookings = await prisma.booking.findMany({
    where: { instructorId, status: "CONFIRMED" },
    include: { class: { select: { name: true, startAt: true, timezone: true } } },
    orderBy: { bookedAt: "desc" },
  });

  const now = new Date();
  const byEmail = new Map<string, StudentRow>();

  for (const b of bookings) {
    let row = byEmail.get(b.studentEmail);
    if (!row) {
      // First time we see this email — bookings are ordered by bookedAt
      // desc, so this is also their most recent contact info.
      row = {
        name: b.studentName,
        email: b.studentEmail,
        phone: b.studentPhone,
        classesBooked: 0,
        classesAttended: 0,
        totalSpent: 0,
        lastBookingAt: null,
        upcoming: null,
      };
      byEmail.set(b.studentEmail, row);
    }

    row.classesBooked += 1;
    if (b.attended) row.classesAttended += 1;
    if (b.paymentStatus === "PAID") row.totalSpent += b.amount;

    if (b.class.startAt <= now) {
      if (!row.lastBookingAt || b.class.startAt > row.lastBookingAt) {
        row.lastBookingAt = b.class.startAt;
      }
    } else if (!row.upcoming || b.class.startAt < row.upcoming.startAt) {
      row.upcoming = {
        className: b.class.name,
        startAt: b.class.startAt,
        timezone: b.class.timezone,
      };
    }
  }

  return [...byEmail.values()].sort((a, b) => b.classesBooked - a.classesBooked);
}
