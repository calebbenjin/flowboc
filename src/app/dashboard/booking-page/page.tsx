import { canUseProOffers } from "@/lib/offer-access";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentInstructor } from "@/lib/get-current-instructor";
import { resolveBlockOrder } from "@/lib/public-page-blocks";
import { DashboardShell } from "@/components/DashboardShell";
import { Leaf, Palette, Layers } from "lucide-react";
import styles from "./booking-page.module.css";
import { BookingLinkAction } from "@/components/BookingLinkAction";
import { DesignClient } from "../design/design-client";
import { LinksClient } from "../links/links-client";

export const metadata: Metadata = { title: "Booking page — Flowboc" };

export default async function BookingPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const instructor = await getCurrentInstructor();
  if (!instructor) redirect("/onboarding");
  const tab = (await searchParams).tab === "content" ? "content" : "design";
  const [links, classesCount] = await Promise.all([
    // All links, active or not — a deactivated link stays manageable and
    // orderable here, it just won't render on the public page.
    prisma.instructorLink.findMany({
      where: { instructorId: instructor.id },
      orderBy: { order: "asc" },
    }),
    prisma.yogaClass.count({
      where: {
        instructorId: instructor.id,
        status: { in: ["PUBLISHED", "FULL"] },
        startAt: { gte: new Date() },
      },
    }),
  ]);

  const blockOrder = resolveBlockOrder(
    instructor.publicPageBlockOrder,
    links.map((l) => l.id),
  );

  return (
    <DashboardShell>
      <header className={styles["header"]}>
        <div>
          <p className={styles["eyebrow"]}>
            <Leaf size={14} strokeWidth={1.4} /> An invitation to your practice
          </p>
          <h1>Booking page</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage what students see and how your page looks.
          </p>
        </div>
        <BookingLinkAction />
      </header>
      <nav aria-label="Booking page settings" className={styles["tabs"]}>
        {[
          { key: "design", label: "Page design", Icon: Palette },
          { key: "content", label: "Content & links", Icon: Layers },
        ].map((item) => (
          <Link
            key={item.key}
            href={`/dashboard/booking-page?tab=${item.key}`}
            aria-current={tab === item.key ? "page" : undefined}
            className={styles["tab"]}
          >
            <item.Icon size={16} strokeWidth={1.5} />
            {item.label}
          </Link>
        ))}
      </nav>
      {tab === "design" ? (
        <DesignClient embedded />
      ) : (
        <LinksClient
          embedded
          links={links}
          slug={instructor.slug}
          blockOrder={blockOrder}
          videoCallEnabled={canUseProOffers(instructor) && instructor.videoCallEnabled}
          videoCallTitle={instructor.videoCallTitle}
          ebookEnabled={canUseProOffers(instructor) && instructor.ebookEnabled}
          ebookTitle={instructor.ebookTitle}
          classesCount={classesCount}
        />
      )}
    </DashboardShell>
  );
}
