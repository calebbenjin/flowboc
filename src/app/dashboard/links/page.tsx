import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentInstructor } from "@/lib/get-current-instructor";
import { LinksClient } from "./links-client";

export const metadata: Metadata = {
  title: "Links — Flowboc",
  description: "Build a mobile-optimized link-in-bio page for your booking link.",
  openGraph: {
    title: "Links — Flowboc",
    description: "Build a mobile-optimized link-in-bio page for your booking link.",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export default async function LinksPage() {
  const instructor = await getCurrentInstructor();
  if (!instructor) redirect("/onboarding");

  const links = await prisma.instructorLink.findMany({
    where: { instructorId: instructor.id },
    orderBy: { order: "asc" },
  });

  return <LinksClient links={links} slug={instructor.slug} />;
}
