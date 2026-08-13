"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { CurrentInstructor } from "@/lib/get-current-instructor";

const InstructorContext = createContext<CurrentInstructor | null>(null);

export function InstructorProvider({
  instructor,
  children,
}: {
  instructor: CurrentInstructor;
  children: ReactNode;
}) {
  return <InstructorContext.Provider value={instructor}>{children}</InstructorContext.Provider>;
}

export function useInstructor(): CurrentInstructor {
  const instructor = useContext(InstructorContext);
  if (!instructor) {
    throw new Error("useInstructor must be used within an InstructorProvider");
  }
  return instructor;
}
