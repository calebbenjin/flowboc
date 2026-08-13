import type { Metadata } from "next";
import { ClassesClient } from "./classes-client";

export const metadata: Metadata = {
  title: "Classes — Flowbuk",
  description: "Create, publish and manage your yoga classes and series.",
  openGraph: {
    title: "Classes — Flowbuk",
    description: "Create, publish and manage your yoga classes.",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export default function ClassesPage() {
  return <ClassesClient />;
}
