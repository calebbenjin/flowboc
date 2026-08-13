import type { Metadata } from "next";
import { EditClassClient } from "./edit-class-client";

export const metadata: Metadata = {
  title: "Edit class — Flowbuk",
  description: "Update the date, price, capacity and policy for your class.",
  openGraph: {
    title: "Edit class — Flowbuk",
    description: "Update your class details.",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export default async function EditClassPage({ params }: { params: Promise<{ classId: string }> }) {
  const { classId } = await params;
  return <EditClassClient classId={classId} />;
}
