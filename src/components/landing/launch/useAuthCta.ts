"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { hasDeviceAuthed } from "@/lib/auth-device";

// Drives every "start my page" CTA on the landing page so it reflects who's
// actually looking at it: a signed-in visitor gets sent to their dashboard
// instead of the signup form, and a signed-out visitor who has authenticated
// on this device before (see markDeviceAuthed in auth/auth-client.tsx) sees
// "Log in" instead of a signup pitch they've already gone through.
export function useAuthCta() {
  const { status } = useSession();
  const authed = status === "authenticated";
  const [rememberedDevice, setRememberedDevice] = useState(false);

  useEffect(() => {
    setRememberedDevice(hasDeviceAuthed());
  }, []);

  return { authed, rememberedDevice };
}
