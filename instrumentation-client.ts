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
    void import("posthog-js").then(({ default: posthog }) => {
      posthog.init(token, {
        api_host: host,
        defaults: "2026-05-30",
        capture_exceptions: true,
        debug: process.env.NODE_ENV === "development",
      });
    });
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
