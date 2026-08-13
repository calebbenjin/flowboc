import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthClient } from "./auth-client";

export const metadata: Metadata = {
  title: "Sign in to Flowbuk",
  description: "Log in or create your Flowbuk instructor account.",
  openGraph: {
    title: "Sign in to Flowbuk",
    description: "Log in or create your Flowbuk instructor account.",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export default function AuthPage() {
  return (
    <Suspense>
      <AuthClient />
    </Suspense>
  );
}
