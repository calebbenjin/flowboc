import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/db";

// React `cache` dedupes these across generateMetadata and the page body of
// the same request — Next only auto-dedupes fetch(), not Prisma calls — so
// each public route costs one instructor lookup instead of two.
export const getPublicInstructor = cache((slug: string) =>
  prisma.instructor.findUnique({
    where: { slug },
    include: {
      socials: true,
      links: { where: { isActive: true }, orderBy: { order: "asc" } },
    },
  }),
);

// Upcoming bookable classes, filtered through the instructor relation so the
// query can run in parallel with the instructor lookup rather than after it.
export const getUpcomingPublicClasses = cache((slug: string) =>
  prisma.yogaClass.findMany({
    where: {
      instructor: { slug },
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
  }),
);

export const getBookableClass = cache((classId: string) =>
  prisma.yogaClass.findUnique({
    where: { id: classId },
    include: {
      instructor: true,
      _count: {
        select: {
          bookings: { where: { status: "CONFIRMED", paymentStatus: { in: ["PAID", "PENDING"] } } },
        },
      },
    },
  }),
);
