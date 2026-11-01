import { prisma } from "@/lib/db";

export function getNewsletterSubscribers(instructorId: string) {
  return prisma.newsletterSubscriber.findMany({
    where: { instructorId },
    orderBy: { subscribedAt: "desc" },
  });
}

export function getNewsletterCampaigns(instructorId: string) {
  return prisma.newsletterCampaign.findMany({
    where: { instructorId },
    orderBy: { updatedAt: "desc" },
  });
}
