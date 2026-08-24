import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/db";

// Backfills NewsletterSubscriber rows from booking history so teachers can
// email existing students without requiring a separate opt-in — only
// creates missing rows, never touches an existing row's status, so a past
// unsubscribe is never silently overridden by a new booking.
export async function syncSubscribersFromBookings(instructorId: string) {
  const [bookedStudents, existing] = await Promise.all([
    prisma.booking.findMany({
      where: { instructorId, status: "CONFIRMED" },
      select: { studentEmail: true, studentName: true },
      orderBy: { bookedAt: "desc" },
      distinct: ["studentEmail"],
    }),
    prisma.newsletterSubscriber.findMany({ where: { instructorId }, select: { email: true } }),
  ]);

  const existingEmails = new Set(existing.map((e) => e.email));
  const missing = bookedStudents.filter((s) => !existingEmails.has(s.studentEmail));
  if (missing.length === 0) return;

  await prisma.newsletterSubscriber.createMany({
    data: missing.map((s) => ({
      instructorId,
      email: s.studentEmail,
      name: s.studentName,
      source: "booking",
      unsubscribeToken: randomBytes(24).toString("hex"),
    })),
    skipDuplicates: true,
  });
}

export function getNewsletterSubscribers(instructorId: string) {
  return prisma.newsletterSubscriber.findMany({
    where: { instructorId },
    orderBy: { subscribedAt: "desc" },
  });
}

export function getNewsletterCampaigns(instructorId: string) {
  return prisma.newsletterCampaign.findMany({
    where: { instructorId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
}
