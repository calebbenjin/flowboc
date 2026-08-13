import type { Metadata } from "next";
import { instructor } from "@/lib/demo";
import { PublicPageClient } from "./public-page-client";

export const metadata: Metadata = {
  title: `${instructor.name} — Book a yoga class`,
  description: `Book upcoming yoga classes with ${instructor.name} in ${instructor.location}. No account needed.`,
  openGraph: {
    title: `${instructor.name} — Book a yoga class`,
    description: "Upcoming classes, live availability and instant booking.",
    type: "profile",
  },
  twitter: { card: "summary_large_image" },
};

export default async function PublicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <PublicPageClient slug={slug} />;
}
