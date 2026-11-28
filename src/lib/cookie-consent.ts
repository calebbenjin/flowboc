// Visitor's cookie choice, shared by the banner, PostHog
// (instrumentation-client.ts) and the Tawk.to chat. Until a visitor accepts,
// PostHog runs cookieless and Tawk.to isn't loaded. Storing the choice itself
// is strictly necessary, so it needs no consent of its own.

export type ConsentStatus = "granted" | "denied";

const STORAGE_KEY = "flowboc_cookie_consent";
// Bump when the banner's purposes change, so everyone is asked again.
const CONSENT_VERSION = 1;

export const CONSENT_CHANGE_EVENT = "flowboc:cookie-consent";
export const OPEN_SETTINGS_EVENT = "flowboc:cookie-settings";

export function getConsent(): ConsentStatus | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw) as { status?: unknown; version?: unknown };
    if (saved.version !== CONSENT_VERSION) return null;
    return saved.status === "granted" || saved.status === "denied" ? saved.status : null;
  } catch {
    return null;
  }
}

export function setConsent(status: ConsentStatus) {
  const previous = getConsent();
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ status, version: CONSENT_VERSION, at: new Date().toISOString() }),
    );
  } catch {
    // Storage blocked (private mode etc.): the choice still applies to this page.
  }
  window.dispatchEvent(new CustomEvent<ConsentStatus>(CONSENT_CHANGE_EVENT, { detail: status }));

  // Tawk.to can't be unloaded once running, so withdrawing consent clears
  // what it stored and reloads the page without it. (PostHog clears its own
  // storage on opt-out.)
  if (previous === "granted" && status === "denied") {
    const isTawk = (name: string) => /^(twk_|tawk|TawkConnectionTime)/i.test(name);
    for (const cookie of document.cookie.split(";")) {
      const name = cookie.split("=")[0]?.trim();
      if (name && isTawk(name)) document.cookie = `${name}=; Max-Age=0; path=/`;
    }
    try {
      for (const key of Object.keys(window.localStorage)) {
        if (isTawk(key)) window.localStorage.removeItem(key);
      }
    } catch {
      // Storage blocked: nothing of Tawk's could have been saved either.
    }
    window.location.reload();
  }
}

export function openCookieSettings() {
  window.dispatchEvent(new Event(OPEN_SETTINGS_EVENT));
}
