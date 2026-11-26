import { accessBlockedReason } from "../trial.ts";
export function canUseFullAnalytics(
  instructor: Parameters<typeof accessBlockedReason>[0] & { planTier: string },
) {
  return (
    ["STARTER", "PRO", "PREMIUM"].includes(instructor.planTier) &&
    accessBlockedReason(instructor) === null
  );
}
