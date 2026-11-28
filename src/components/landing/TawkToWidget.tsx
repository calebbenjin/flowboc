"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import { CONSENT_CHANGE_EVENT, getConsent, type ConsentStatus } from "@/lib/cookie-consent";

// Loads the Tawk.to live chat widget on the landing page only (not the
// dashboard, which already has its own feedback tab — see
// FeedbackWidget.tsx). Tawk.to sets its own cookies, so it only loads once
// the visitor accepts the cookie banner. No-ops until both env vars are
// set, so a missing/placeholder id never injects a broken script tag.
export function TawkToWidget() {
  const propertyId = process.env["NEXT_PUBLIC_TAWKTO_PROPERTY_ID"];
  const widgetId = process.env["NEXT_PUBLIC_TAWKTO_WIDGET_ID"];
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    setAllowed(getConsent() === "granted");
    const onChange = (event: Event) =>
      setAllowed((event as CustomEvent<ConsentStatus>).detail === "granted");
    window.addEventListener(CONSENT_CHANGE_EVENT, onChange);
    return () => window.removeEventListener(CONSENT_CHANGE_EVENT, onChange);
  }, []);

  if (!propertyId || !widgetId || !allowed) return null;

  return (
    <Script id="tawkto" strategy="afterInteractive">
      {`
        var Tawk_API = Tawk_API || {};
        Tawk_API.onLoad = function () {};
        (function () {
          var s1 = document.createElement("script");
          s1.async = true;
          s1.src = "https://embed.tawk.to/${propertyId}/${widgetId}";
          s1.charset = "UTF-8";
          s1.setAttribute("crossorigin", "*");
          document.body.appendChild(s1);
        })();
      `}
    </Script>
  );
}
