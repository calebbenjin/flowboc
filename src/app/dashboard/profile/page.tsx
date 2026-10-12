import type { Metadata } from "next";
import { ProfileClient } from "./profile-client";

export const metadata: Metadata = {
  title: "Instructor profile — Flowboc",
  description: "Edit the bio, photo, location and booking link students see.",
  openGraph: {
    title: "Instructor profile — Flowboc",
    description: "Your public instructor profile settings.",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export default function ProfilePage() {
  return <ProfileClient />;
}
