import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { getCurrentInstructor } from "@/lib/get-current-instructor";
import { InstructorProvider } from "@/components/InstructorProvider";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const instructor = await getCurrentInstructor();
  if (!instructor || !instructor.onboardingCompletedAt) {
    redirect("/onboarding");
  }

  return <InstructorProvider instructor={instructor}>{children}</InstructorProvider>;
}
