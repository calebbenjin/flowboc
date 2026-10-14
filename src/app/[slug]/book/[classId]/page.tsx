import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/JsonLd";
import { prisma } from "@/lib/db";
import { formatClassDate, formatClassTime } from "@/lib/format-class-time";
import { siteUrl } from "@/lib/site";
import { BookingFlowClient } from "./booking-flow-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; classId: string }>;
}): Promise<Metadata> {
  const { slug, classId } = await params;

  const cls = await prisma.yogaClass.findUnique({
    where: { id: classId },
    include: { instructor: true },
  });
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

  const instructor = await prisma.instructor.findUnique({ where: { slug } });
  if (!instructor || !instructor.onboardingCompletedAt) notFound();

  const cls = await prisma.yogaClass.findUnique({
    where: { id: classId },
    include: {
      _count: {
        select: {
          bookings: { where: { status: "CONFIRMED", paymentStatus: { in: ["PAID", "PENDING"] } } },
        },
      },
    },
  });
  if (!cls || cls.instructorId !== instructor.id) notFound();
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
        currency={instructor.currency}
        cls={{
          id: cls.id,
          name: cls.name,
          coverUrl: cls.coverUrl,
          startAt: cls.startAt,
          timezone: cls.timezone,
          durationMinutes: cls.durationMinutes,
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
