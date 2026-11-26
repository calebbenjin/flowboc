import { prisma } from "@/lib/db";
import { getFxRate } from "@/lib/fx";
import { summarizeMrr, type MrrSummary } from "@/lib/mrr";
import type { CurrencyCode } from "@/generated/prisma/enums";

export type AdminOverviewStats = {
  totalInstructors: number;
  newInstructorsThisWeek: number;
  convertedToFirstBooking: number;
  activeSubscriptions: number;
  trialing: number;
  pastDue: number;
  contactMessagesThisWeek: number;
};

export async function getAdminOverviewStats(): Promise<AdminOverviewStats> {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [
    totalInstructors,
    newInstructorsThisWeek,
    instructorsWithPaidBooking,
    activeSubscriptions,
    trialing,
    pastDue,
    contactMessagesThisWeek,
  ] = await Promise.all([
    prisma.instructor.count(),
    prisma.instructor.count({ where: { createdAt: { gte: since } } }),
    // instructorId on Booking is a denormalized scalar, not a Prisma
    // relation (see schema comment), so this can't be an instructor.count
    // relation filter — group by it instead.
    prisma.booking.groupBy({
      by: ["instructorId"],
      where: { status: "CONFIRMED", paymentStatus: "PAID" },
    }),
    prisma.instructor.count({ where: { planStatus: "ACTIVE" } }),
    prisma.instructor.count({ where: { planStatus: "TRIALING" } }),
    prisma.instructor.count({ where: { planStatus: "PAST_DUE" } }),
    prisma.contactMessage.count({ where: { createdAt: { gte: since } } }),
  ]);

  // The activation rate behind outreach/referral links — distinct
  // instructors who've gotten at least one paid booking, not just signed up.
  const convertedToFirstBooking = instructorsWithPaidBooking.length;

  return {
    totalInstructors,
    newInstructorsThisWeek,
    convertedToFirstBooking,
    activeSubscriptions,
    trialing,
    pastDue,
    contactMessagesThisWeek,
  };
}

export type AdminActivityEventRow = {
  id: string;
  type: string;
  message: string;
  createdAt: Date;
};

export async function getRecentActivity(limit = 50): Promise<AdminActivityEventRow[]> {
  return prisma.adminActivityEvent.findMany({
    select: { id: true, type: true, message: true, createdAt: true },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

// Paying subscribers only — COMPED access has no subscription behind it,
// and PAST_DUE isn't collecting. Plans are looked up by code across every
// row ever created (not just active ones), so subscribers still on a
// superseded price count at what they actually pay.
export async function getMrrSummary(): Promise<MrrSummary> {
  const subscribers = await prisma.instructor.findMany({
    where: { planStatus: "ACTIVE", subscriptionPlanCode: { not: null } },
    select: { subscriptionPlanCode: true },
  });
  const codes = [...new Set(subscribers.map((s) => s.subscriptionPlanCode!))];
  const plans = await prisma.subscriptionPlan.findMany({
    where: { providerPlanCode: { in: codes } },
    select: { providerPlanCode: true, price: true, interval: true, currency: true },
  });
  const planByCode = new Map(plans.map((p) => [p.providerPlanCode, p]));
  const subscriptions = subscribers.flatMap((s) => planByCode.get(s.subscriptionPlanCode!) ?? []);

  const currencies = [...new Set(subscriptions.map((s) => s.currency))];
  const usdRates = Object.fromEntries(
    await Promise.all(currencies.map(async (c) => [c, await getFxRate(c, "USD")] as const)),
  ) as Partial<Record<CurrencyCode, number | null>>;

  return summarizeMrr(subscriptions, usdRates);
}
