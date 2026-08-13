import type { Metadata } from "next";
import { ContactClient } from "./contact-client";

const title = "Contact us — Flowbuk";
const description = "Questions, feedback, or need a hand? Get in touch with the Flowbuk team.";

export const metadata: Metadata = {
  title,
  description,
  openGraph: { title, description, type: "website" },
  twitter: { card: "summary_large_image" },
};

export default function ContactPage() {
  return <ContactClient />;
}
