import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
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
  const instructor = await prisma.instructor.findUnique({ where: { slug } });
  if (!instructor || !instructor.onboardingCompletedAt) notFound();
  const classes = await prisma.yogaClass.findMany({
    where: {
      instructorId: instructor.id,
      status: { in: ["PUBLISHED", "FULL"] },
      startAt: { gte: new Date() },
    },
    orderBy: { startAt: "asc" },
    include: {
      _count: {
        select: {
          bookings: { where: { status: "CONFIRMED", paymentStatus: { in: ["PAID", "PENDING"] } } },
        },
      },
    },
  });
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
