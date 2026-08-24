"use client";

import { AlertTriangle, Clock } from "lucide-react";
import { useInstructor } from "@/components/InstructorProvider";
import { supportEmail } from "@/lib/site";
import { isTrialExpired } from "@/lib/trial";
import { cn } from "@/lib/utils";

const DAY_MS = 24 * 60 * 60 * 1000;
const UPGRADE_HREF = `mailto:${supportEmail}?subject=${encodeURIComponent("Upgrade my Flowbuk plan")}`;

export function TrialBanner() {
  const instructor = useInstructor();

  // No banner for paying instructors, or for pre-trial accounts grandfathered
  // in with trialEndsAt = null (isTrialExpired treats that as never expiring).
  if (instructor.planStatus !== "TRIALING" || !instructor.trialEndsAt) return null;

  const expired = isTrialExpired(instructor);
  const daysLeft = Math.max(0, Math.ceil((instructor.trialEndsAt.getTime() - Date.now()) / DAY_MS));
  const urgent = expired || daysLeft <= 3;

  return (
    <div
      className={cn(
        "mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg px-4 py-3 text-sm",
        urgent ? "bg-destructive/10 text-destructive" : "bg-clay/10 text-clay",
      )}
    >
      <span className="flex items-center gap-2">
        {urgent ? (
          <AlertTriangle className="size-4 shrink-0" />
        ) : (
          <Clock className="size-4 shrink-0" />
        )}
        {expired
          ? "Your 14-day trial has ended. Publishing new classes and new bookings are paused until you upgrade."
          : `${daysLeft} day${daysLeft === 1 ? "" : "s"} left in your trial. Upgrade to keep your booking page live.`}
      </span>
      <a href={UPGRADE_HREF} className="shrink-0 font-medium underline underline-offset-2">
        Upgrade
      </a>
    </div>
  );
}
