import { TransactionBrowser } from "@/components/TransactionBrowser";
import { getInstructorTransactions } from "@/lib/transactions/queries";
import type { TransactionParams } from "@/lib/transactions/filters";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentInstructor } from "@/lib/get-current-instructor";
import { getProAnalytics, getStarterStats } from "./queries";
import { canUseProAnalytics } from "@/lib/analytics/access";
import { illustrativeAnalytics } from "@/lib/analytics/metrics";
import { AnalyticsClient } from "./analytics-client";

export const metadata: Metadata = {
  title: "Analytics — Flowboc",
  description: "Revenue, booking page views and engagement for your yoga classes.",
  openGraph: {
    title: "Analytics — Flowboc",
    description: "How your booking page is performing.",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<TransactionParams>;
}) {
  const params = await searchParams;
  const instructor = await getCurrentInstructor();
  if (!instructor) redirect("/onboarding");

  const entitled = canUseProAnalytics(instructor);
  const [analytics, transactions, starterStats] = await Promise.all([
    entitled ? getProAnalytics() : illustrativeAnalytics(instructor.currency, instructor.timezone),
    getInstructorTransactions(params),
    entitled ? undefined : getStarterStats(),
  ]);

  return (
    <AnalyticsClient analytics={analytics} locked={!entitled} starterStats={starterStats}>
      <section id="transactions" className="mt-10 scroll-mt-6">
        <h2 className="text-2xl">All transactions</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Class bookings, 1:1 sessions, and ebook purchases. These filters work independently of the
          chart period above.
        </p>
        <TransactionBrowser result={transactions} params={params} path="/dashboard/analytics" />
      </section>
    </AnalyticsClient>
  );
}
