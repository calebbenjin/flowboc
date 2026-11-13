import type { ReactNode } from "react";
import { Providers } from "@/app/providers";

// Session/analytics providers are scoped to authenticated surfaces so public
// instructor pages don't pay for next-auth, react-query or session fetches.
export default function OnboardingLayout({ children }: { children: ReactNode }) {
  return <Providers>{children}</Providers>;
}
