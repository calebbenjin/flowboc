import { canUseProOffers } from "@/lib/offer-access";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { formatClassDate, formatClassTime } from "@/lib/format-class-time";
import { timezoneLabel } from "@/lib/demo";
import { prisma } from "@/lib/db";
import { getCurrentInstructor } from "@/lib/get-current-instructor";
import { resolveBlockOrder } from "@/lib/public-page-blocks";
import { DashboardShell } from "@/components/DashboardShell";
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

  const previewClasses = await prisma.yogaClass.findMany({
    where: {
      instructorId: instructor.id,
      status: { in: ["PUBLISHED", "FULL"] },
      startAt: { gte: new Date() },
    },
    orderBy: { startAt: "asc" },
    take: 8,
    include: {
      _count: {
        select: {
          bookings: { where: { status: "CONFIRMED", paymentStatus: { in: ["PAID", "PENDING"] } } },
        },
      },
    },
  });
  const classes = previewClasses.map((cls) => ({
    id: cls.id,
    name: cls.name,
    description: cls.description,
    coverUrl: cls.coverUrl,
    dateLabel: `${formatClassDate(cls)} · ${formatClassTime(cls)} ${timezoneLabel(cls.timezone)}`,
    formatLabel: `${cls.mode === "ONLINE" ? "Online" : "In studio"} · ${cls.durationMinutes} min`,
    price: cls.price,
    originalPrice: cls.originalPrice,
    currency: instructor.currency,
    spots: Math.max(0, cls.capacity - cls._count.bookings),
  }));
  const blockOrder = resolveBlockOrder(
    instructor.publicPageBlockOrder,
    links.map((l) => l.id),
  );

  return (
    <DashboardShell>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl">Booking page</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage what students see and how your page looks.
          </p>
        </div>
        <BookingLinkAction />
      </div>
      <nav
        aria-label="Booking page settings"
        className="my-6 flex gap-2 border-b border-border pb-3"
      >
        {[
          { key: "design", label: "Appearance" },
          { key: "content", label: "Content and links" },
        ].map((item) => (
          <Link
            key={item.key}
            href={`/dashboard/booking-page?tab=${item.key}`}
            aria-current={tab === item.key ? "page" : undefined}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${tab === item.key ? "bg-clay/10 text-clay" : "text-muted-foreground hover:bg-accent"}`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      {tab === "design" ? (
        <DesignClient embedded classes={classes} />
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
