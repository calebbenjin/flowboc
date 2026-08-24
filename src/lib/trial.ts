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
