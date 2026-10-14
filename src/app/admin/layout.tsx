import type { Metadata } from "next";
import type { ReactNode } from "react";
import { requireAdmin } from "@/lib/require-admin";
import { AdminShell } from "@/components/AdminShell";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireAdmin();
  return <AdminShell>{children}</AdminShell>;
}
