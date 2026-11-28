import { getPublicPageContent } from "@/lib/public-page-content";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { after } from "next/server";
import { JsonLd } from "@/components/JsonLd";
import { prisma } from "@/lib/db";
import { getPublicInstructor, getUpcomingPublicClasses } from "@/lib/public-instructor";
import { siteUrl } from "@/lib/site";
import { PublicPageClient } from "./public-page-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const instructor = await getPublicInstructor(slug);
  if (!instructor) return {};

  // Location goes in the title, not just the description — "yoga classes in
  // Lekki" is how students search, and the title carries the most weight.
  const title = instructor.location
    ? `Yoga classes in ${instructor.location} with ${instructor.name}`
    : `${instructor.name} — Book a yoga class`;
  return {
    title,
    description: `Book upcoming yoga classes with ${instructor.name}${instructor.location ? ` in ${instructor.location}` : ""}. See live availability and pay online. No account needed.`,
    alternates: { canonical: `/${slug}` },
    openGraph: {
      title,
      description: "Upcoming classes, live availability and instant booking.",
      type: "profile",
    },
    twitter: { card: "summary_large_image" },
  };
}

export default async function PublicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  // Both queries key on the slug, so they run side by side; the instructor
  // lookup itself is shared with generateMetadata via React cache.
  const [instructor, classes] = await Promise.all([
    getPublicInstructor(slug),
    getUpcomingPublicClasses(slug),
  ]);
  if (!instructor || !instructor.onboardingCompletedAt) notFound();

  after(() => prisma.pageView.create({ data: { instructorId: instructor.id, path: `/${slug}` } }));

  const content = await getPublicPageContent(instructor, classes);

  const personJsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: instructor.name,
    url: `${siteUrl}/${instructor.slug}`,
    ...(instructor.photoUrl ? { image: instructor.photoUrl } : {}),
    ...(instructor.bio ? { description: instructor.bio } : {}),
    jobTitle: "Yoga Instructor",
    ...(instructor.location
      ? { address: { "@type": "PostalAddress", addressLocality: instructor.location } }
      : {}),
  };

  // Each upcoming class as a schema.org Event, which makes it eligible for
  // Google's event results ("yoga class Lagos this weekend"). Capped so a
  // long recurring schedule doesn't bloat the page.
  const eventsJsonLd = classes.slice(0, 20).map((cls) => {
    const url = `${siteUrl}/${instructor.slug}/book/${cls.id}`;
    const spotsLeft = cls.capacity - cls._count.bookings;
    return {
      "@context": "https://schema.org",
      "@type": "Event",
      name: cls.name,
      ...(cls.description ? { description: cls.description } : {}),
      ...(cls.coverUrl ? { image: cls.coverUrl } : {}),
      url,
      startDate: cls.startAt.toISOString(),
      endDate: new Date(cls.startAt.getTime() + cls.durationMinutes * 60_000).toISOString(),
      eventStatus: "https://schema.org/EventScheduled",
      eventAttendanceMode:
        cls.mode === "ONLINE"
          ? "https://schema.org/OnlineEventAttendanceMode"
          : "https://schema.org/OfflineEventAttendanceMode",
      // The join link is only shared after booking, so the booking page
      // stands in as the virtual location's URL.
      location:
        cls.mode === "ONLINE"
          ? { "@type": "VirtualLocation", url }
          : {
              "@type": "Place",
              name: cls.location ?? instructor.location ?? instructor.name,
              address: cls.location ?? instructor.location ?? undefined,
            },
      organizer: { "@type": "Person", name: instructor.name, url: `${siteUrl}/${instructor.slug}` },
      performer: { "@type": "Person", name: instructor.name },
      offers: {
        "@type": "Offer",
        url,
        price: cls.price,
        priceCurrency: instructor.currency,
        availability:
          cls.status === "FULL" || spotsLeft <= 0
            ? "https://schema.org/SoldOut"
            : "https://schema.org/InStock",
        ...(cls.publishedAt ? { validFrom: cls.publishedAt.toISOString() } : {}),
      },
    };
  });

  return (
    <>
      <JsonLd data={personJsonLd} />
      {eventsJsonLd.length > 0 ? <JsonLd data={eventsJsonLd} /> : null}
      <PublicPageClient {...content} />
    </>
  );
}
