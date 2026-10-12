import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { AdminBillingClient } from "./admin-billing-client";

export const metadata: Metadata = {
  title: "Billing admin — Flowboc",
};

export default async function AdminBillingPage() {
  const instructors = await prisma.instructor.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      email: true,
      currency: true,
      planStatus: true,
      trialEndsAt: true,
      compedUntil: true,
      compNote: true,
      billingInterval: true,
      subscriptionRenewsAt: true,
      subscriptionProviderId: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return <AdminBillingClient instructors={instructors} />;
}
