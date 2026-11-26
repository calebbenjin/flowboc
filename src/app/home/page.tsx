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
import { faqs, LaunchFAQ } from "@/components/landing/launch/LaunchFAQ";
import { LaunchFinalCTA } from "@/components/landing/launch/LaunchFinalCTA";
import { LaunchFooter } from "@/components/landing/launch/LaunchFooter";
import { TawkToWidget } from "@/components/landing/TawkToWidget";
import { getLandingPlansByCurrency } from "@/lib/subscription-plans";
import Benefits from "@/components/landing/launch/Benefits";
import { Providers } from "@/app/providers";
import { BeforeAfter } from "@/components/landing/launch/BeforeAfter";
import { Testimonials } from "@/components/landing/launch/Testimonials";
import { TrustStrip } from "@/components/landing/launch/TrustStrip";
import { prisma } from "@/lib/db";
import { JsonLd } from "@/components/JsonLd";
import { siteMarkets, siteName, siteUrl } from "@/lib/site";
// The landing page lives at /home and is served at "/" via a rewrite in
// next.config.ts. As a bare app/page.tsx (or inside a route group, which
// Next strips), its client-chunk manifest is merged into every sibling
// route's manifest, and shared modules like next/link ended up pointing at
// the landing bundle — so /[slug] pages downloaded the landing page, PostHog
// and motion before they could hydrate. A real segment keeps it isolated.

const title = "Flowboc — Booking software for yoga instructors in Africa";
const description =
  "Create your class, share your link, get booked and paid in your local currency. Flowboc handles classes, payments, students and reminders for independent yoga instructors in Nigeria, Ghana, Kenya, South Africa and West Africa.";

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
    locale: "en_NG",
    alternateLocale: ["en_GH", "en_KE", "en_ZA"],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export default async function Landing() {
  // Every local currency with full pricing set — the client picks which
  // one to show (see LaunchDialogProvider).
  const [plansByCurrency, instructorCount] = await Promise.all([
    getLandingPlansByCurrency(),
    prisma.instructor.count({ where: { onboardingCompletedAt: { not: null } } }),
  ]);

  const areaServed = siteMarkets.map(({ country, code }) => ({
    "@type": "Country",
    name: country,
    identifier: code,
  }));

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${siteUrl}/#organization`,
        name: siteName,
        url: siteUrl,
        logo: `${siteUrl}/flowboc-logo.png`,
        areaServed,
      },
      {
        "@type": "SoftwareApplication",
        name: siteName,
        url: siteUrl,
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        description,
        publisher: { "@id": `${siteUrl}/#organization` },
        areaServed,
        // One offer per local currency — the cheapest monthly plan, which is
        // what "starting from" means on the pricing section.
        offers: Object.entries(plansByCurrency).flatMap(([currency, plans]) =>
          plans?.STARTER.MONTHLY
            ? [
                {
                  "@type": "Offer",
                  name: "Starter (monthly)",
                  price: plans.STARTER.MONTHLY.price,
                  priceCurrency: currency,
                },
              ]
            : [],
        ),
      },
      {
        "@type": "FAQPage",
        mainEntity: faqs.map(([question, answer]) => ({
          "@type": "Question",
          name: question,
          acceptedAnswer: { "@type": "Answer", text: answer },
        })),
      },
    ],
  };

  return (
    <Providers>
      <JsonLd data={jsonLd} />
      <LaunchDialogProvider plansByCurrency={plansByCurrency}>
        <div className="min-h-screen overflow-x-clip bg-[#fcfbf7]">
          <LaunchNavbar />
          <main>
            <LaunchHero />
            <TrustStrip instructorCount={instructorCount} />
            <Benefits />
            <BeforeAfter />
            <WhyJourney />
            <YourPage />
            <Experience />
            <Offers />
            <Business />
            <Community />
            <Growth />
            <Setup />
            {/* <Testimonials /> */}
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
