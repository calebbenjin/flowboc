import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { BookingFlowClient } from "./booking-flow-client";

export const metadata: Metadata = {
  title: "Book your class — Flowboc",
  description: "Enter your details, pay securely and get instant confirmation. No account needed.",
  openGraph: {
    title: "Book your class — Flowboc",
    description: "Book and pay for your yoga class in a minute.",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

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

  return (
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
        spots: Math.max(0, cls.capacity - cls._count.bookings),
      }}
    />
  );
}
