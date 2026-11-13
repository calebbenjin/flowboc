import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPublicInstructor, getUpcomingPublicClasses } from "@/lib/public-instructor";
import { effectivePublicTheme } from "@/lib/public-page-theme";
import { UpcomingClassesClient } from "./upcoming-classes-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  return { title: "Upcoming classes — Flowboc", alternates: { canonical: `/${slug}/classes` } };
}

export default async function UpcomingClassesPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [instructor, classes] = await Promise.all([
    getPublicInstructor(slug),
    getUpcomingPublicClasses(slug),
  ]);
  if (!instructor || !instructor.onboardingCompletedAt) notFound();
  return (
    <UpcomingClassesClient
      instructor={{
        slug,
        name: instructor.name,
        photoUrl: instructor.photoUrl,
        backgroundType: instructor.backgroundType,
        backgroundImageUrl: instructor.backgroundImageUrl,
        backgroundColor: instructor.backgroundColor,
        backgroundGradientFrom: instructor.backgroundGradientFrom,
        backgroundGradientTo: instructor.backgroundGradientTo,
        themeColor: instructor.themeColor,
        currency: instructor.currency,
        ...effectivePublicTheme(instructor),
      }}
      classes={classes.map((cls) => ({
        id: cls.id,
        seriesId: cls.seriesId,
        recurringLabel: cls.recurringLabel,
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
        capacity: cls.capacity,
        spots: Math.max(0, cls.capacity - cls._count.bookings),
      }))}
    />
  );
}
