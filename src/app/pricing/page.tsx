import type { Metadata } from "next";
import { LaunchDialogProvider } from "@/components/landing/launch/LaunchDialogContext";
import { LaunchNavbar } from "@/components/landing/launch/LaunchNavbar";
import { Plans } from "@/components/landing/launch/Plans";
import { LaunchFinalCTA } from "@/components/landing/launch/LaunchFinalCTA";
import { LaunchFooter } from "@/components/landing/launch/LaunchFooter";
import { TawkToWidget } from "@/components/landing/TawkToWidget";
import { getLandingPlansByCurrency } from "@/lib/subscription-plans";
import { Providers } from "@/app/providers";

// The root layout's title template appends "| Flowboc"; social cards don't
// use the template, so they get the brand name spelled out.
const title = "Pricing";
const socialTitle = "Flowboc pricing";
const description =
  "Simple plans for independent yoga instructors, priced in naira, cedi, shilling, rand and CFA. Start with a 14-day free trial.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/pricing" },
  openGraph: {
    title: socialTitle,
    description,
    type: "website",
    url: "/pricing",
    siteName: "Flowboc",
  },
  twitter: { card: "summary_large_image", title: socialTitle, description },
};

export default async function PricingPage() {
  // Every local currency with full pricing set — the client picks which
  // one to show (see LaunchDialogProvider).
  const plansByCurrency = await getLandingPlansByCurrency();

  return (
    <Providers>
      <LaunchDialogProvider plansByCurrency={plansByCurrency}>
        <div className="min-h-screen overflow-x-clip bg-[#fcfbf7]">
          <LaunchNavbar />
          <main>
            <Plans />
            <LaunchFinalCTA />
          </main>
          <LaunchFooter />
        </div>
        <TawkToWidget />
      </LaunchDialogProvider>
    </Providers>
  );
}
