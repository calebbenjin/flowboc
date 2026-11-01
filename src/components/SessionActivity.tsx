"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { SESSION_ACTIVITY_REFRESH_MS } from "@/lib/session-policy";

// Renew on real foreground activity, never on a timer in an unattended tab.
export function SessionActivity() {
  const { status, update } = useSession();
  useEffect(() => {
    if (status !== "authenticated") return;
    let lastRefresh = Date.now();
    let pending = false;
    async function renew() {
      if (
        pending ||
        document.visibilityState !== "visible" ||
        !navigator.onLine ||
        Date.now() - lastRefresh < SESSION_ACTIVITY_REFRESH_MS
      )
        return;
      pending = true;
      lastRefresh = Date.now();
      try {
        await update();
      } catch {
        /* A failed refresh does not discard the user's work. */
      } finally {
        pending = false;
      }
    }
    const activity = () => {
      void renew();
    };
    window.addEventListener("pointerdown", activity, { passive: true });
    window.addEventListener("keydown", activity);
    window.addEventListener("scroll", activity, { passive: true, capture: true });
    return () => {
      window.removeEventListener("pointerdown", activity);
      window.removeEventListener("keydown", activity);
      window.removeEventListener("scroll", activity, true);
    };
  }, [status, update]);
  return null;
}
