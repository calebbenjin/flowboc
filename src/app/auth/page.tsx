import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthClient } from "./auth-client";

export const metadata: Metadata = {
  title: "Sign in to Flowboc",
  description: "Log in or create your Flowboc instructor account.",
  openGraph: {
    title: "Sign in to Flowboc",
    description: "Log in or create your Flowboc instructor account.",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
  robots: { index: false, follow: false },
};

export default function AuthPage() {
  return (
    <Suspense>
      <AuthClient />
    </Suspense>
  );
}
