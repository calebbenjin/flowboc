import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function StatusPill({
  tone = "neutral",
  children,
}: {
  tone?: "neutral" | "good" | "warn" | "bad";
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        tone === "good" && "bg-success/15 text-success",
        tone === "warn" && "bg-warning/20 text-warning-foreground",
        tone === "bad" && "bg-destructive/12 text-destructive",
        tone === "neutral" && "bg-secondary text-secondary-foreground",
      )}
    >
      {children}
    </span>
  );
}

export function paymentTone(p: string) {
  if (p === "paid") return "good" as const;
  if (p === "pending") return "warn" as const;
  if (p === "failed") return "bad" as const;
  return "neutral" as const;
}
