const projectToken = process.env["NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN"];
const apiHost = process.env["NEXT_PUBLIC_POSTHOG_HOST"];

if (!projectToken || !apiHost) {
  const missingVariable = projectToken
    ? "NEXT_PUBLIC_POSTHOG_HOST"
    : "NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN";

  if (process.env.NODE_ENV !== "production") {
    throw new Error(
      `${missingVariable} variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once ${missingVariable} is configured`,
    );
  }
} else {
  // posthog-js is the heaviest script on the site. Load and initialise it
  // only once the page is interactive and the browser is idle, so it never
  // competes with first render or hydration — especially on public
  // instructor pages viewed on slow mobile connections.
  const token = projectToken;
  const host = apiHost;
  const initPostHog = () => {
    void Promise.all([import("posthog-js"), import("@/lib/cookie-consent")]).then(
      ([{ default: posthog }, consent]) => {
        posthog.init(token, {
          api_host: host,
          defaults: "2026-05-30",
          capture_exceptions: true,
          // No cookies or storage until the visitor accepts the cookie
          // banner; until then (and after a reject) events are sent
          // cookieless. Requires cookieless mode to be enabled in the
          // PostHog project settings, or those events are dropped.
          cookieless_mode: "on_reject",
          debug: process.env.NODE_ENV === "development",
        });

        // The banner's choice (src/lib/cookie-consent.ts) is the source of
        // truth; mirror it into PostHog now and whenever it changes.
        const apply = (status: ReturnType<typeof consent.getConsent>) => {
          const current = posthog.get_explicit_consent_status();
          if (status === "granted" && current !== "granted") posthog.opt_in_capturing();
          if (status === "denied" && current !== "denied") posthog.opt_out_capturing();
        };
        apply(consent.getConsent());
        window.addEventListener(consent.CONSENT_CHANGE_EVENT, (event) =>
          apply((event as CustomEvent<ReturnType<typeof consent.getConsent>>).detail),
        );
      },
    );
  };
  const whenIdle = () => {
    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(initPostHog, { timeout: 3000 });
    } else {
      setTimeout(initPostHog, 1);
    }
  };
  if (document.readyState === "complete") whenIdle();
  else window.addEventListener("load", whenIdle, { once: true });
}
