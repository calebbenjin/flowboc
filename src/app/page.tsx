import type { Metadata } from "next";
import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { SocialProof } from "@/components/landing/SocialProof";
import { ProblemSection } from "@/components/landing/ProblemSection";
import { CreatorShowcase } from "@/components/landing/CreatorShowcase";
import { WhyFlowbuk } from "@/components/landing/WhyFlowbuk";
import { FeatureGrid } from "@/components/landing/FeatureGrid";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { InstructorExperience } from "@/components/landing/InstructorExperience";
import { TestimonialVideos } from "@/components/landing/TestimonialVideos";
import { Pricing } from "@/components/landing/Pricing";
import { FAQ } from "@/components/landing/FAQ";
import { FinalCTA } from "@/components/landing/FinalCTA";
import { Footer } from "@/components/landing/Footer";

const title = "Flowbuk — Booking software for independent yoga instructors";
const description =
  "Create your class, share your link, get booked. Flowbuk handles classes, payments, students and reminders for independent yoga instructors.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/" },
  openGraph: {
    title,
    description,
    type: "website",
    url: "/",
    siteName: "Flowbuk",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export default function Landing() {
  return (
    <div className="min-h-screen overflow-x-clip bg-background">
      <Navbar />
      <main>
        <Hero />
        <SocialProof />
        {/* <ProblemSection /> */}
        <CreatorShowcase />
        <WhyFlowbuk />
        <FeatureGrid />
        <HowItWorks />
        <InstructorExperience />
        <TestimonialVideos />
        <Pricing />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
