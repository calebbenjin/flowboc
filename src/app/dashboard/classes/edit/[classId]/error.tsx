"use client";

import { DashboardShell } from "@/components/DashboardShell";

export default function EditClassError() {
  return (
    <DashboardShell>
      <p className="text-muted-foreground">That class could not be loaded.</p>
    </DashboardShell>
  );
}
