import { accessBlockedReason } from "../trial.ts";
export function canUseProAnalytics(
  instructor: Parameters<typeof accessBlockedReason>[0] & { planTier: string },
) {
  return (
    ["PRO", "PREMIUM"].includes(instructor.planTier) && accessBlockedReason(instructor) === null
  );
}
