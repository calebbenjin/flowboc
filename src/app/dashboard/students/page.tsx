import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentInstructor } from "@/lib/get-current-instructor";
import { getStudents } from "./queries";
import { StudentsClient } from "./students-client";

export const metadata: Metadata = {
  title: "Students — Flowbuk",
  description: "A student list that builds itself from every booking you receive.",
  openGraph: {
    title: "Students — Flowbuk",
    description: "Classes booked, attended and total spent.",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export default async function StudentsPage() {
  const instructor = await getCurrentInstructor();
  if (!instructor) redirect("/onboarding");

  const students = await getStudents(instructor.id);

  return <StudentsClient students={students} />;
}
