import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { after } from "next/server";
import { prisma } from "@/lib/db";
import { PublicPageClient } from "./public-page-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const instructor = await prisma.instructor.findUnique({ where: { slug } });
  if (!instructor) return {};

  const title = `${instructor.name} — Book a yoga class`;
  return {
    title,
    description: `Book upcoming yoga classes with ${instructor.name}${instructor.location ? ` in ${instructor.location}` : ""}. No account needed.`,
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

  const instructor = await prisma.instructor.findUnique({
    where: { slug },
    include: { socials: true },
  });
  if (!instructor || !instructor.onboardingCompletedAt) notFound();

  after(() => prisma.pageView.create({ data: { instructorId: instructor.id, path: `/${slug}` } }));

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
    <PublicPageClient
      instructor={{
        name: instructor.name,
        slug: instructor.slug,
        photoUrl: instructor.photoUrl,
        bio: instructor.bio,
        location: instructor.location,
        email: instructor.email,
        phone: instructor.phone,
        consultationLink: instructor.consultationLink,
        specialties: instructor.specialties,
        socials: instructor.socials.map((s) => ({
          platform: s.platform.toLowerCase(),
          handle: s.handle,
        })),
      }}
      classes={classes.map((c) => ({
        id: c.id,
        name: c.name,
        coverUrl: c.coverUrl,
        description: c.description,
        startAt: c.startAt,
        timezone: c.timezone,
        durationMinutes: c.durationMinutes,
        mode: c.mode,
        location: c.location,
        price: c.price,
        originalPrice: c.originalPrice,
        capacity: c.capacity,
        spots: Math.max(0, c.capacity - c._count.bookings),
      }))}
    />
  );
}
