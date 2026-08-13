import type { Metadata } from "next";
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

export default function AnalyticsPage() {
  return <AnalyticsClient />;
}
