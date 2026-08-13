import type { Metadata } from "next";
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
  return <ClassDetailClient classId={classId} />;
}
