import { prisma } from "@/lib/db";

export type AdminOverviewStats = {
  totalInstructors: number;
  newInstructorsThisWeek: number;
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
    activeSubscriptions,
    trialing,
    pastDue,
    contactMessagesThisWeek,
  ] = await Promise.all([
    prisma.instructor.count(),
    prisma.instructor.count({ where: { createdAt: { gte: since } } }),
    prisma.instructor.count({ where: { planStatus: "ACTIVE" } }),
    prisma.instructor.count({ where: { planStatus: "TRIALING" } }),
    prisma.instructor.count({ where: { planStatus: "PAST_DUE" } }),
    prisma.contactMessage.count({ where: { createdAt: { gte: since } } }),
  ]);

  return {
    totalInstructors,
    newInstructorsThisWeek,
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
