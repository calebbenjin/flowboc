"use client";

import Link from "next/link";
import { AlertTriangle, ArrowRight, Flower2 } from "lucide-react";
import { useInstructor } from "@/components/InstructorProvider";
import { isTrialExpired } from "@/lib/trial";
import { cn } from "@/lib/utils";
import styles from "./TrialBanner.module.css";

const DAY_MS = 24 * 60 * 60 * 1000;

export function TrialBanner() {
  const instructor = useInstructor();

  if (instructor.planStatus === "PAST_DUE") {
    return (
      <aside
        className={cn(styles["banner"], styles["urgent"])}
        aria-label="Billing needs attention"
      >
        <span className={styles["icon"]}>
          <AlertTriangle size={22} strokeWidth={1.5} aria-hidden="true" />
        </span>
        <div className={styles["copy"]}>
          <h2>A quick check on your billing</h2>
          <p>Your last renewal failed. Update your billing to avoid losing access.</p>
        </div>
        <Link href="/dashboard/billing" className={styles["cta"]}>
          Fix billing <ArrowRight size={15} aria-hidden="true" />
        </Link>
      </aside>
    );
  }

  // Paying and grandfathered accounts do not need a trial reminder.
  if (instructor.planStatus !== "TRIALING" || !instructor.trialEndsAt) return null;

  const expired = isTrialExpired(instructor);
  const daysLeft = Math.max(0, Math.ceil((instructor.trialEndsAt.getTime() - Date.now()) / DAY_MS));
  const urgent = expired || daysLeft <= 3;

  return (
    <aside
      className={cn(styles["banner"], urgent && styles["urgent"])}
      aria-label={expired ? "Trial ended" : "Your Flowboc trial"}
    >
      {expired ? (
        <span className={styles["icon"]}>
          <AlertTriangle size={23} strokeWidth={1.5} aria-hidden="true" />
        </span>
      ) : (
        <div className={styles["countdown"]}>
          <strong>{daysLeft}</strong>
          <span>{daysLeft === 1 ? "day left" : "days left"}</span>
        </div>
      )}
      <div className={styles["copy"]}>
        <span className={styles["eyebrow"]}>
          <Flower2 size={12} strokeWidth={1.5} aria-hidden="true" /> Your space to grow
        </span>
        <h2>
          {expired
            ? "Your trial has come to a close"
            : urgent
              ? "Keep your practice growing"
              : "Make yourself at home"}
        </h2>
        <p>
          {expired
            ? "Publishing new classes and new bookings are paused. Choose a plan to welcome students again."
            : urgent
              ? "Your trial is nearly over. Choose a plan to keep your booking page live."
              : "Explore your teaching space. Choose a plan before your trial ends to keep your booking page live."}
        </p>
      </div>
      <Link href="/dashboard/billing" className={styles["cta"]}>
        {expired ? "Continue my journey" : "Find my plan"}{" "}
        <ArrowRight size={15} aria-hidden="true" />
      </Link>
    </aside>
  );
}
