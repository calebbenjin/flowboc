import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentInstructor } from "@/lib/get-current-instructor";
import { EditClassClient } from "./edit-class-client";

export const metadata: Metadata = {
  title: "Edit class — Flowboc",
  description: "Update the date, price, capacity and policy for your class.",
  openGraph: {
    title: "Edit class — Flowboc",
    description: "Update your class details.",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export default async function EditClassPage({ params }: { params: Promise<{ classId: string }> }) {
  const { classId } = await params;

  const instructor = await getCurrentInstructor();
  if (!instructor) redirect("/onboarding");

  const cls = await prisma.yogaClass.findUnique({ where: { id: classId } });
  if (!cls || cls.instructorId !== instructor.id) notFound();

  const futureCount =
    cls.seriesId && cls.startAt >= new Date() && !["CANCELLED", "COMPLETED"].includes(cls.status)
      ? await prisma.yogaClass.count({
          where: {
            instructorId: instructor.id,
            seriesId: cls.seriesId,
            startAt: { gte: cls.startAt },
            status: { in: ["DRAFT", "PUBLISHED", "FULL"] },
          },
        })
      : 0;
  return <EditClassClient cls={cls} futureCount={futureCount} />;
}
