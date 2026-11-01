"use client";

import Link from "next/link";
import { ArrowRight, Flower2, Sprout } from "lucide-react";
import { useInstructor } from "@/components/InstructorProvider";
import { isTrialExpired } from "@/lib/trial";
import styles from "./SidebarPlanCard.module.css";

export function SidebarPlanCard() {
  const instructor = useInstructor();
  const trial = instructor.planStatus === "TRIALING" && instructor.trialEndsAt !== null;
  const starter = instructor.planTier === "STARTER" && instructor.planStatus === "ACTIVE";
  if (!trial && !starter) return null;

  const expired = trial && isTrialExpired(instructor);
  const days = instructor.trialEndsAt
    ? Math.max(0, Math.ceil((instructor.trialEndsAt.getTime() - Date.now()) / 86400000))
    : 0;

  return (
    <section className={styles["card"]} aria-label={trial ? "Your trial" : "Discover Flowboc Pro"}>
      <div className={styles["top"]}>
        <span className={styles["icon"]}>
          {trial ? <Sprout size={20} strokeWidth={1.4} /> : <Flower2 size={20} strokeWidth={1.4} />}
        </span>
        <span>{trial ? "Your 14-day trial" : "Made for your next chapter"}</span>
      </div>
      <h2>
        {trial ? (
          expired ? (
            "Let’s keep growing."
          ) : (
            <>
              <strong>{days}</strong> {days === 1 ? "day" : "days"} to explore.
            </>
          )
        ) : (
          "More room with Pro."
        )}
      </h2>
      <p>
        {trial
          ? expired
            ? "Your trial has ended. Choose a plan to resume publishing and bookings."
            : "Make yourself at home. Choose a plan before your trial ends to keep bookings open."
          : "Make your page your own, send newsletters, and offer ebooks and 1:1 sessions."}
      </p>
      <Link href="/dashboard/billing">
        {trial ? "Find my plan" : "Explore Pro"}
        <ArrowRight size={14} aria-hidden="true" />
      </Link>
    </section>
  );
}
