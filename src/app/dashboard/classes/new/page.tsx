import type { Metadata } from "next";
import { NewClassClient } from "./new-class-client";

export const metadata: Metadata = {
  title: "Create a class — Flowbuk",
  description: "Set the date, price, capacity and policy for your class in a couple of minutes.",
  openGraph: {
    title: "Create a class — Flowbuk",
    description: "Set up a class in under five minutes.",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export default function NewClassPage() {
  return <NewClassClient />;
}
