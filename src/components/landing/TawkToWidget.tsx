import Script from "next/script";

// Loads the Tawk.to live chat widget on the landing page only (not the
// dashboard, which already has its own feedback tab — see
// FeedbackWidget.tsx). No-ops until both env vars are set, same pattern as
// the PostHog gate in providers.tsx, so a missing/placeholder id never
// injects a broken script tag.
export function TawkToWidget() {
  const propertyId = process.env["NEXT_PUBLIC_TAWKTO_PROPERTY_ID"];
  const widgetId = process.env["NEXT_PUBLIC_TAWKTO_WIDGET_ID"];
  if (!propertyId || !widgetId) return null;

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
