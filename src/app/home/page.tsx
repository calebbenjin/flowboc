import type { Metadata } from "next";
import { LaunchDialogProvider } from "@/components/landing/launch/LaunchDialogContext";
import { LaunchNavbar } from "@/components/landing/launch/LaunchNavbar";
import { LaunchHero } from "@/components/landing/launch/LaunchHero";
import { WhyJourney } from "@/components/landing/launch/WhyJourney";
import { YourPage } from "@/components/landing/launch/YourPage";
import { Experience } from "@/components/landing/launch/Experience";
import { Offers } from "@/components/landing/launch/Offers";
import { Business } from "@/components/landing/launch/Business";
import { Community } from "@/components/landing/launch/Community";
import { Growth } from "@/components/landing/launch/Growth";
import { Setup } from "@/components/landing/launch/Setup";
import { Plans } from "@/components/landing/launch/Plans";
import { LaunchFAQ } from "@/components/landing/launch/LaunchFAQ";
import { LaunchFinalCTA } from "@/components/landing/launch/LaunchFinalCTA";
import { LaunchFooter } from "@/components/landing/launch/LaunchFooter";
import { TawkToWidget } from "@/components/landing/TawkToWidget";
import { getActivePlansForCurrency } from "@/lib/subscription-plans";
import Benefits from "@/components/landing/launch/Benefits";
import { Providers } from "@/app/providers";
// The landing page lives at /home and is served at "/" via a rewrite in
// next.config.ts. As a bare app/page.tsx (or inside a route group, which
// Next strips), its client-chunk manifest is merged into every sibling
// route's manifest, and shared modules like next/link ended up pointing at
// the landing bundle — so /[slug] pages downloaded the landing page, PostHog
// and motion before they could hydrate. A real segment keeps it isolated.

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
    <Providers>
      <LaunchDialogProvider plans={plans}>
        <div className="min-h-screen overflow-x-clip bg-[#fcfbf7]">
          <LaunchNavbar />
          <main>
            <LaunchHero />
            <Benefits />
            <WhyJourney />
            <YourPage />
            <Experience />
            <Offers />
            <Business />
            <Community />
            <Growth />
            <Setup />
            <Plans />
            <LaunchFAQ />
            <LaunchFinalCTA />
          </main>
          <LaunchFooter />
        </div>
        <TawkToWidget />
      </LaunchDialogProvider>
    </Providers>
  );
}
