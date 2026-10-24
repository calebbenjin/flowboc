import type { Metadata } from "next";
import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { MarqueeStrip } from "@/components/landing/MarqueeStrip";
import { SocialProof } from "@/components/landing/SocialProof";
import { ProblemSection } from "@/components/landing/ProblemSection";
import { CreatorShowcase } from "@/components/landing/CreatorShowcase";
import { WhyFlowboc } from "@/components/landing/WhyFlowboc";
import { FeatureGrid } from "@/components/landing/FeatureGrid";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { BuildAndPrice } from "@/components/landing/BuildAndPrice";
import { TeachYourWay } from "@/components/landing/TeachYourWay";
import { BuildWithEase } from "@/components/landing/BuildWithEase";
import { GetStarted } from "@/components/landing/GetStarted";
import { OneLink } from "@/components/landing/OneLink";
import { InstructorExperience } from "@/components/landing/InstructorExperience";
import { TestimonialVideos } from "@/components/landing/TestimonialVideos";
import { Pricing } from "@/components/landing/Pricing";
import { FAQ } from "@/components/landing/FAQ";
import { FinalCTA } from "@/components/landing/FinalCTA";
import { Footer } from "@/components/landing/Footer";
import { getActivePlansForCurrency } from "@/lib/subscription-plans";

const title = "Flowboc — Booking software for independent yoga instructors";
const description =
  "Create your class, share your link, get booked. Flowboc handles classes, payments, students and reminders for independent yoga instructors.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/" },
  openGraph: {
    title,
    description,
    type: "website",
    url: "/",
    siteName: "Flowboc",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export default async function Landing() {
  // Subscriptions bill in USD only — see src/lib/startbutton.ts.
  const plans = await getActivePlansForCurrency("USD");

  return (
    <div className="min-h-screen overflow-x-clip bg-background">
      <Navbar />
      <main>
        <Hero />
        <MarqueeStrip />
        <HowItWorks />
        <TeachYourWay />
        <BuildWithEase />
        <OneLink />
        <Pricing plans={plans} />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
