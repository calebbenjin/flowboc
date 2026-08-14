import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentInstructor } from "@/lib/get-current-instructor";
import { ClassDetailClient } from "./class-detail-client";

export const metadata: Metadata = {
  title: "Class bookings & attendance — Flowbuk",
  description: "See who booked, who paid and who showed up for this class.",
  openGraph: {
    title: "Class bookings & attendance — Flowbuk",
    description: "Bookings, payments and attendance in one view.",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export default async function ClassDetailPage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const { classId } = await params;

  const instructor = await getCurrentInstructor();
  if (!instructor) redirect("/onboarding");

  const cls = await prisma.yogaClass.findUnique({ where: { id: classId } });
  if (!cls || cls.instructorId !== instructor.id) notFound();

  const [bookings, waitlist] = await Promise.all([
    prisma.booking.findMany({
      where: { classId },
      orderBy: { bookedAt: "desc" },
    }),
    prisma.waitlistEntry.findMany({ where: { classId }, orderBy: { joinedAt: "asc" } }),
  ]);

  return <ClassDetailClient cls={cls} bookings={bookings} waitlist={waitlist} />;
}
