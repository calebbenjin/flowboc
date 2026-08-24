import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentInstructor } from "@/lib/get-current-instructor";
import { NewsletterClient } from "./newsletter-client";
import {
  getNewsletterCampaigns,
  getNewsletterSubscribers,
  syncSubscribersFromBookings,
} from "./queries";

export const metadata: Metadata = {
  title: "Newsletter — Flowbuk",
  description: "Email the students who've booked with you.",
  openGraph: {
    title: "Newsletter — Flowbuk",
    description: "Email the students who've booked with you.",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export default async function NewsletterPage() {
  const instructor = await getCurrentInstructor();
  if (!instructor) redirect("/onboarding");

  await syncSubscribersFromBookings(instructor.id);

  const [subscribers, campaigns] = await Promise.all([
    getNewsletterSubscribers(instructor.id),
    getNewsletterCampaigns(instructor.id),
  ]);

  return <NewsletterClient subscribers={subscribers} campaigns={campaigns} />;
}
