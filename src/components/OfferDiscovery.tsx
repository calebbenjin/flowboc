"use client";

import { canUseProOffers } from "@/lib/offer-access";
import { ProBadge } from "@/components/ProGate";
import Link from "next/link";
import { ArrowRight, BookOpen, HeartHandshake } from "lucide-react";
import { useInstructor } from "@/components/InstructorProvider";
import { offerState } from "@/lib/offer-status";
import styles from "./OfferDiscovery.module.css";

export function OfferDiscovery({
  selected,
  showHeading = true,
}: {
  selected?: "session" | "ebook";
  showHeading?: boolean;
}) {
  const instructor = useInstructor();
  const eligible = canUseProOffers(instructor);
  const payoutConnected = instructor.payoutStatus === "CONNECTED" && !!instructor.payoutAccountId;
  const offers = [
    {
      kind: "session",
      Icon: HeartHandshake,
      title: "Offer a 1:1 session",
      description: "Make space for more personal guidance.",
      savedTitle: instructor.videoCallTitle,
      state: offerState({
        enabled: instructor.videoCallEnabled,
        hasContent: !!(
          instructor.videoCallTitle ||
          instructor.consultationLink ||
          instructor.videoCallDescription ||
          instructor.videoCallImageUrl
        ),
        hasRequiredAsset: !!instructor.consultationLink,
        price: instructor.videoCallPrice,
        payoutConnected,
      }),
    },
    {
      kind: "ebook",
      Icon: BookOpen,
      title: "Sell an ebook",
      description: "Give students a practice to take home.",
      savedTitle: instructor.ebookTitle,
      state: offerState({
        enabled: instructor.ebookEnabled,
        hasContent: !!(
          instructor.ebookTitle ||
          instructor.ebookFileUrl ||
          instructor.ebookDescription ||
          instructor.ebookCoverUrl
        ),
        hasRequiredAsset: !!instructor.ebookFileUrl,
        price: instructor.ebookPrice,
        payoutConnected,
      }),
    },
  ] as const;
  return (
    <section className={styles["section"]} aria-label="More ways to share your teaching">
      {showHeading && (
        <div className={styles["heading"]}>
          <h2>More ways to share your teaching</h2>
          <p>A personal session or a guide to keep. Start whenever you’re ready.</p>
        </div>
      )}
      <div className={styles["grid"]}>
        {offers.map(({ kind, Icon, title, description, savedTitle, state }) => (
          <Link
            key={kind}
            href={`/dashboard/offers?offer=${kind}#offer-setup`}
            className={styles["card"]}
            aria-current={selected === kind ? "page" : undefined}
          >
            <span className={styles["icon"]}>
              <Icon size={24} aria-hidden="true" />
            </span>
            <span className={styles["content"]}>
              <span className={styles["status"]} data-ready={eligible && state.ready}>
                {eligible ? state.label : "Pro feature"}
              </span>
              <strong>
                {title} <ProBadge />
              </strong>
              <span className={styles["description"]}>
                {state.configured && savedTitle ? savedTitle : description}
              </span>
              <span className={styles["action"]}>
                {!eligible
                  ? "Explore Pro"
                  : state.configured
                    ? "Edit offer"
                    : kind === "session"
                      ? "Set up a session"
                      : "Set up an ebook"}{" "}
                <ArrowRight size={14} />
              </span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
