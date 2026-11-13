import type { Metadata } from "next";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { getCurrentInstructor } from "@/lib/get-current-instructor";
import { InstructorProvider } from "@/components/InstructorProvider";
import { Providers } from "@/app/providers";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const instructor = await getCurrentInstructor();
  if (!instructor || !instructor.onboardingCompletedAt) {
    redirect("/onboarding");
  }

  return (
    <Providers>
      <InstructorProvider instructor={instructor}>{children}</InstructorProvider>
    </Providers>
  );
}
