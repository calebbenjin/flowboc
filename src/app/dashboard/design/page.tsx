import type { Metadata } from "next";
import { DesignClient } from "./design-client";

export const metadata: Metadata = {
  title: "Page design — Flowboc",
  description: "Customize your public booking page's theme color, background and layout.",
  openGraph: {
    title: "Page design — Flowboc",
    description: "Customize the booking page your students see.",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export default function DesignPage() {
  return <DesignClient />;
}
