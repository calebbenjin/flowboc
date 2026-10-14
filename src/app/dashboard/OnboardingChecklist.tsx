"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { dismissChecklist } from "./actions";
import type { ChecklistItem } from "./queries";

export function OnboardingChecklist({ items }: { items: ChecklistItem[] }) {
  const router = useRouter();
  const [dismissing, setDismissing] = useState(false);
  const doneCount = items.filter((i) => i.done).length;

  async function handleDismiss() {
    setDismissing(true);
    try {
      await dismissChecklist();
      router.refresh();
    } finally {
      setDismissing(false);
    }
  }

  return (
    <div className="surface bg-white relative p-5 sm:p-6">
      <button
        type="button"
        aria-label="Dismiss checklist"
        onClick={handleDismiss}
        disabled={dismissing}
        className="absolute right-4 top-4 text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
      >
        <X className="size-4" />
      </button>

      <div className="flex items-center justify-between pr-8">
        <h2 className="text-sm font-semibold">Get set up</h2>
        <span className="text-xs text-muted-foreground">
          {doneCount} of {items.length} done
        </span>
      </div>

      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-sand">
        <div
          className="h-full rounded-full bg-mint transition-[width] duration-500"
          style={{ width: `${(doneCount / items.length) * 100}%` }}
        />
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {items.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-xl border p-3 text-sm transition-colors",
              item.done
                ? "border-border bg-sand/40 text-muted-foreground"
                : "border-border bg-white hover:border-clay/40 hover:bg-clay/5",
            )}
          >
            <span
              className={cn(
                "grid size-6 shrink-0 place-items-center rounded-full",
                item.done ? "bg-success/15 text-success" : "bg-secondary text-muted-foreground",
              )}
            >
              {item.done ? (
                <Check className="size-3.5" />
              ) : (
                <span className="size-1.5 rounded-full bg-current" />
              )}
            </span>
            <span className={cn(item.done && "line-through")}>{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
