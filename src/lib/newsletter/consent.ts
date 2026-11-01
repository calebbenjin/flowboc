// Only these sources represent an explicit request to receive marketing updates.
// Legacy `booking` rows were added automatically and must not be sent campaigns.
export const NEWSLETTER_CONSENT_SOURCES = [
  "public_signup_form",
  "class_checkout",
  "ebook_checkout",
  "video_call_checkout",
];

export function hasNewsletterConsent(contact: { status: string; source: string | null }): boolean {
  return (
    contact.status === "SUBSCRIBED" &&
    contact.source !== null &&
    NEWSLETTER_CONSENT_SOURCES.includes(contact.source)
  );
}

export function newsletterAudienceStatus(contact: {
  status: string;
  source: string | null;
}): string {
  if (contact.status === "UNSUBSCRIBED") return "unsubscribed";
  return hasNewsletterConsent(contact) ? "subscribed" : "consent needed";
}

export const newsletterSourceLabels: Record<string, string> = {
  public_signup_form: "Newsletter signup",
  class_checkout: "Class checkout opt-in",
  ebook_checkout: "E-book checkout opt-in",
  video_call_checkout: "1:1 checkout opt-in",
  booking: "Class booking · no opt-in recorded",
};
