"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Cookie, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  OPEN_SETTINGS_EVENT,
  getConsent,
  openCookieSettings,
  setConsent,
  type ConsentStatus,
} from "@/lib/cookie-consent";

// Asks once, on any page, and again whenever "Cookie settings" is clicked.
// Accept and Reject are equally prominent; closing the reopened banner
// keeps the existing choice.
export function CookieBanner() {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<ConsentStatus | null>(null);

  useEffect(() => {
    // The dashboard's live preview renders public pages in an iframe; the
    // parent page asks instead.
    if (window.self !== window.top) return;
    const saved = getConsent();
    setCurrent(saved);
    if (!saved) setOpen(true);

    const reopen = () => {
      setCurrent(getConsent());
      setOpen(true);
    };
    window.addEventListener(OPEN_SETTINGS_EVENT, reopen);
    return () => window.removeEventListener(OPEN_SETTINGS_EVENT, reopen);
  }, []);

  if (!open) return null;

  function choose(status: ConsentStatus) {
    setOpen(false);
    setCurrent(status);
    setConsent(status);
  }

  return (
    <section
      role="region"
      aria-label="Cookie preferences"
      className="fixed inset-x-3 z-[60] rounded-2xl border border-[#e8e0ee] bg-white p-5 shadow-[0_18px_50px_-12px_rgba(39,35,52,0.28)] sm:inset-x-auto sm:left-5 sm:max-w-[420px]"
      style={{ bottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
    >
      <div className="flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#eeebff] text-[#6355ff]">
          <Cookie className="size-4" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-[0.95rem] font-semibold text-[#272334]">Cookies on Flowboc</h2>
          <p className="mt-1.5 text-[0.8rem] leading-relaxed text-[#716277]">
            Cookies needed to sign in and book a class are always on. With your OK we also use
            analytics cookies to see how Flowboc is used, and our support chat. If you say no we
            only count visits anonymously.{" "}
            <Link href="/privacy#cookies" className="text-[#6355ff] underline underline-offset-2">
              Learn more
            </Link>
          </p>
          {current ? (
            <p className="mt-2 text-xs text-muted-foreground">
              Currently: {current === "granted" ? "accepted" : "rejected"}.
            </p>
          ) : null}
        </div>
        {current ? (
          <button
            type="button"
            aria-label="Close and keep my choice"
            onClick={() => setOpen(false)}
            className="-mr-1 -mt-1 grid size-8 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-secondary"
          >
            <X className="size-4" />
          </button>
        ) : null}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button variant="outline" className="h-11" onClick={() => choose("denied")}>
          Reject
        </Button>
        <Button
          className="h-11 bg-[#6355ff] text-white hover:bg-[#5042e5]"
          onClick={() => choose("granted")}
        >
          Accept
        </Button>
      </div>
    </section>
  );
}

// Footer link that reopens the banner so visitors can change their choice.
export function CookieSettingsButton({ className }: { className?: string }) {
  return (
    <button type="button" onClick={openCookieSettings} className={className}>
      Cookie settings
    </button>
  );
}
