"use client";

import { SessionProvider } from "next-auth/react";
import { LaunchNavbar } from "@/components/landing/launch/LaunchNavbar";

// Marketing pages (about, contact, guides, legal, referral) render outside
// the app-wide Providers, so this brings its own lightweight session context
// for the account/login/signup switch, then renders the same navbar as the
// landing, features and pricing pages so the site has one consistent nav.
export function Navbar() {
  return (
    <SessionProvider refetchInterval={0} refetchOnWindowFocus={false} refetchWhenOffline={false}>
      <LaunchNavbar />
    </SessionProvider>
  );
}
