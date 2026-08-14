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
