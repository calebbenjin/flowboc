import type { PlanStatus } from "@/generated/prisma/enums";

export const TRIAL_DAYS = 14;

export function newTrialEndsAt(): Date {
  return new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000);
}

// Existing instructors were backfilled with trialEndsAt = null, which this
// treats as "never expires" — only instructors created after the trial
// shipped get a real countdown.
export function isTrialExpired(instructor: {
  planStatus: PlanStatus;
  trialEndsAt: Date | null;
}): boolean {
  return (
    instructor.planStatus === "TRIALING" &&
    instructor.trialEndsAt !== null &&
    instructor.trialEndsAt.getTime() < Date.now()
  );
}

// PAST_DUE (a failed renewal, still within its grace period) keeps access —
// only an expired trial, a canceled subscription, or lapsed comp access
// blocks publishing/bookings.
export function accessBlockedReason(instructor: {
  planStatus: PlanStatus;
  trialEndsAt: Date | null;
  compedUntil: Date | null;
}): string | null {
  if (instructor.planStatus === "CANCELED") {
    return "This instructor's subscription has ended, so new bookings are paused.";
  }
  if (
    instructor.planStatus === "COMPED" &&
    instructor.compedUntil !== null &&
    instructor.compedUntil.getTime() < Date.now()
  ) {
    return "This instructor's complimentary access has ended, so new bookings are paused.";
  }
  if (isTrialExpired(instructor)) {
    return "This instructor's trial has ended, so new bookings are paused. Please check back soon.";
  }
  return null;
}
