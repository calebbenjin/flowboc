import type { Metadata } from "next";
import { OnboardingClient } from "./onboarding-client";

export const metadata: Metadata = {
  title: "Set up your instructor profile — Flowbuk",
  description: "Add your bio, location, specialties and booking link to publish your page.",
  openGraph: {
    title: "Set up your instructor profile — Flowbuk",
    description: "Your booking page is minutes away.",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export default function OnboardingPage() {
  return <OnboardingClient />;
}
