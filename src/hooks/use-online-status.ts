"use client";

import { useEffect, useState } from "react";

export function useOnlineStatus(): boolean {
  // Always starts true — matching the server's render (no `navigator` there)
  // avoids a hydration mismatch. Corrected immediately after mount below,
  // which is a normal post-hydration state update, not a mismatch.
  const [online, setOnline] = useState(true);

  useEffect(() => {
    function update() {
      setOnline(navigator.onLine);
    }
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  return online;
}
