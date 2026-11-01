import { accessBlockedReason } from "./trial.ts";
export function canUseProOffers(
  instructor: Parameters<typeof accessBlockedReason>[0] & { planTier: string },
): boolean {
  return (
    ["PRO", "PREMIUM"].includes(instructor.planTier) && accessBlockedReason(instructor) === null
  );
}
