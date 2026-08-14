import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentInstructor } from "@/lib/get-current-instructor";
import { getFillRateAndTopClasses, getWeeklyMetrics } from "./queries";
import { AnalyticsClient } from "./analytics-client";

export const metadata: Metadata = {
  title: "Analytics — Flowbuk",
  description: "Revenue, booking page views and engagement for your yoga classes.",
  openGraph: {
    title: "Analytics — Flowbuk",
    description: "How your booking page is performing.",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export default async function AnalyticsPage() {
  const instructor = await getCurrentInstructor();
  if (!instructor) redirect("/onboarding");

  const [weeklyMetrics, { fillRate, topClasses }] = await Promise.all([
    getWeeklyMetrics(instructor.id),
    getFillRateAndTopClasses(instructor.id),
  ]);

  return (
    <AnalyticsClient weeklyMetrics={weeklyMetrics} fillRate={fillRate} topClasses={topClasses} />
  );
}
