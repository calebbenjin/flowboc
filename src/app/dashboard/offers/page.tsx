import { getCurrentInstructor } from "@/lib/get-current-instructor";
import { canUseProOffers } from "@/lib/offer-access";
import { ProBadge } from "@/components/ProGate";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import { OfferDiscovery } from "@/components/OfferDiscovery";
import { OfferSetupForm } from "./offer-forms";
import styles from "./offers.module.css";

export const metadata: Metadata = {
  title: "Your offers — Flowboc",
  description: "Create and manage your 1:1 session and ebook offers.",
};
export default async function OffersPage({
  searchParams,
}: {
  searchParams: Promise<{ offer?: string }>;
}) {
  const { offer } = await searchParams;
  const instructor = await getCurrentInstructor();
  const eligible = instructor ? canUseProOffers(instructor) : false;
  const kind = offer === "ebook" ? "ebook" : "session";
  return (
    <DashboardShell>
      <div className={styles["page"]}>
        <header>
          <p className={styles["eyebrow"]}>More room for your teaching</p>
          <h1>Your offers</h1>
          <p>
            Personal guidance and practices to keep. Give each offer a home on your public page.
          </p>
        </header>
        <OfferDiscovery selected={kind} showHeading={false} />
        {eligible ? (
          <OfferSetupForm key={kind} kind={kind} />
        ) : (
          <section id="offer-setup" className={styles["setup"]}>
            <ProBadge />
            <h2 className="mt-4">Share more of your teaching with Pro.</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Consultation offers and ebook sales are included with an active Pro plan. Your saved
              offers stay intact and remain hidden until Pro access is restored.
            </p>
            <Link
              href="/dashboard/billing"
              className="mt-5 inline-flex min-h-12 items-center gap-2 rounded-xl bg-[#6355ff] px-5 text-sm text-white"
            >
              Explore Pro <ArrowRight className="size-4" />
            </Link>
          </section>
        )}
        <div className={styles["pageNote"]}>
          <p>
            Your offer details live here. Choose their order and appearance in your booking page
            settings.
          </p>
          <Link href="/dashboard/booking-page?tab=content">
            Arrange my public page <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </DashboardShell>
  );
}
