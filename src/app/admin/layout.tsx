import type { Metadata } from "next";
import type { ReactNode } from "react";
import { requireAdmin } from "@/lib/require-admin";
import { AdminShell } from "@/components/AdminShell";
import { Providers } from "@/app/providers";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireAdmin();
  return (
    <Providers>
      <AdminShell>{children}</AdminShell>
    </Providers>
  );
}
