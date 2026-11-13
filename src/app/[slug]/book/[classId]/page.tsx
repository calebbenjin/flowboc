import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/JsonLd";
import { getBookableClass } from "@/lib/public-instructor";
import { formatClassDate, formatClassTime } from "@/lib/format-class-time";
import { siteUrl } from "@/lib/site";
import { canUseProDesign } from "@/lib/public-page-theme";
import { BookingFlowClient } from "./booking-flow-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; classId: string }>;
}): Promise<Metadata> {
  const { slug, classId } = await params;

  const cls = await getBookableClass(classId);
  if (!cls || cls.instructor.slug !== slug) return {};

  const title = `${cls.name} with ${cls.instructor.name} — Flowboc`;
  const description = `Book "${cls.name}" with ${cls.instructor.name} on ${formatClassDate(cls)} at ${formatClassTime(cls)}. Instant confirmation, no account needed.`;

  return {
    title,
    description,
    alternates: { canonical: `/${slug}/book/${classId}` },
    openGraph: { title, description, type: "website" },
    twitter: { card: "summary_large_image" },
  };
}

export default async function BookingPage({
  params,
}: {
  params: Promise<{ slug: string; classId: string }>;
}) {
  const { slug, classId } = await params;

  // One query (shared with generateMetadata via React cache) replaces the
  // previous instructor lookup + class lookup pair.
  const cls = await getBookableClass(classId);
  if (!cls || cls.instructor.slug !== slug) notFound();
  const instructor = cls.instructor;
  if (!instructor.onboardingCompletedAt) notFound();
  if (cls.status !== "PUBLISHED" && cls.status !== "FULL") notFound();

  const spots = Math.max(0, cls.capacity - cls._count.bookings);
  const pageUrl = `${siteUrl}/${slug}/book/${classId}`;
  const endAt = new Date(cls.startAt.getTime() + cls.durationMinutes * 60_000);

  const eventJsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: cls.name,
    startDate: cls.startAt.toISOString(),
    endDate: endAt.toISOString(),
    eventAttendanceMode:
      cls.mode === "ONLINE"
        ? "https://schema.org/OnlineEventAttendanceMode"
        : "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    location:
      cls.mode === "ONLINE"
        ? { "@type": "VirtualLocation", url: pageUrl }
        : {
            "@type": "Place",
            name: cls.location ?? instructor.name,
            address: cls.location ?? undefined,
          },
    ...(cls.description ? { description: cls.description } : {}),
    ...(cls.coverUrl ? { image: cls.coverUrl } : {}),
    organizer: { "@type": "Person", name: instructor.name, url: `${siteUrl}/${slug}` },
    offers: {
      "@type": "Offer",
      url: pageUrl,
      price: cls.price,
      priceCurrency: instructor.currency,
      availability: spots > 0 ? "https://schema.org/InStock" : "https://schema.org/SoldOut",
    },
  };

  return (
    <>
      <JsonLd data={eventJsonLd} />
      <BookingFlowClient
        slug={slug}
        instructorName={instructor.name}
        instructorPhoto={instructor.photoUrl}
        accentColor={
          canUseProDesign(instructor) && /^#[0-9a-fA-F]{6}$/.test(instructor.themeColor)
            ? instructor.themeColor
            : "#6355ff"
        }
        currency={instructor.currency}
        cls={{
          id: cls.id,
          name: cls.name,
          coverUrl: cls.coverUrl,
          description: cls.description,
          startAt: cls.startAt,
          timezone: cls.timezone,
          durationMinutes: cls.durationMinutes,
          mode: cls.mode,
          location: cls.location,
          price: cls.price,
          originalPrice: cls.originalPrice,
          cancellationPolicy: cls.cancellationPolicy,
          spots,
        }}
      />
    </>
  );
}
