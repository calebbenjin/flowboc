import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentInstructor } from "@/lib/get-current-instructor";
import { resolveBlockOrder } from "@/lib/public-page-blocks";
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

  const [links, classesCount] = await Promise.all([
    // All links, active or not — a deactivated link stays manageable and
    // orderable here, it just won't render on the public page.
    prisma.instructorLink.findMany({
      where: { instructorId: instructor.id },
      orderBy: { order: "asc" },
    }),
    prisma.yogaClass.count({
      where: { instructorId: instructor.id, status: { in: ["PUBLISHED", "FULL"] } },
    }),
  ]);

  const blockOrder = resolveBlockOrder(
    instructor.publicPageBlockOrder,
    links.map((l) => l.id),
  );

  return (
    <LinksClient
      links={links}
      slug={instructor.slug}
      blockOrder={blockOrder}
      videoCallEnabled={instructor.videoCallEnabled}
      videoCallTitle={instructor.videoCallTitle}
      ebookEnabled={instructor.ebookEnabled}
      ebookTitle={instructor.ebookTitle}
      classesCount={classesCount}
    />
  );
}
