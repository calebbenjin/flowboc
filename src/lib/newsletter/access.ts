import { accessBlockedReason } from "../trial.ts";

export function newsletterSendError(
  instructor: Parameters<typeof accessBlockedReason>[0] & { planTier: string },
): string | null {
  if (!["PRO", "PREMIUM"].includes(instructor.planTier))
    return "Newsletter sending is a Pro feature. Upgrade to send campaigns and test emails.";
  if (accessBlockedReason(instructor))
    return "Your plan is no longer active. Renew your subscription to send newsletter emails.";
  return null;
}

export function canUseNewsletter(instructor: Parameters<typeof newsletterSendError>[0]): boolean {
  return newsletterSendError(instructor) === null;
}

export function newsletterButtonVisible(
  instructor: Parameters<typeof newsletterSendError>[0] & { newsletterEnabled?: boolean },
): boolean {
  return canUseNewsletter(instructor) && instructor.newsletterEnabled !== false;
}
