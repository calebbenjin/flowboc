import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentInstructor } from "@/lib/get-current-instructor";
import { ClassesClient } from "./classes-client";

export const metadata: Metadata = {
  title: "Classes — Flowboc",
  description: "Create, publish and manage your yoga classes and series.",
  openGraph: {
    title: "Classes — Flowboc",
    description: "Create, publish and manage your yoga classes.",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export default async function ClassesPage() {
  const instructor = await getCurrentInstructor();
  if (!instructor) redirect("/onboarding");

  const classes = await prisma.yogaClass.findMany({
    where: { instructorId: instructor.id },
    orderBy: { startAt: "asc" },
    include: { _count: { select: { bookings: { where: { status: "CONFIRMED" } } } } },
  });

  return <ClassesClient classes={classes} />;
}
