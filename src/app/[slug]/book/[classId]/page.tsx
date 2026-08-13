import type { Metadata } from "next";
import { BookingFlowClient } from "./booking-flow-client";

export const metadata: Metadata = {
  title: "Book your class — Flowbuk",
  description: "Enter your details, pay securely and get instant confirmation. No account needed.",
  openGraph: {
    title: "Book your class — Flowbuk",
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
  return <BookingFlowClient slug={slug} classId={classId} />;
}
