"use client";

import { useMemo, useState } from "react";
import { MessageCircleHeart } from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { Input } from "@/components/ui/input";
import type { AdminFeedbackRow } from "./queries";

export function AdminFeedbackClient({ feedback }: { feedback: AdminFeedbackRow[] }) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return feedback;
    return feedback.filter(
      (f) =>
        f.instructorName.toLowerCase().includes(q) ||
        f.instructorEmail.toLowerCase().includes(q) ||
        f.message.toLowerCase().includes(q),
    );
  }, [feedback, search]);

  return (
    <div>
      <div>
        <h1 className="text-3xl">Feedback</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {feedback.length} message{feedback.length === 1 ? "" : "s"} total — submitted from the
          sticky feedback tab in the instructor dashboard.
        </p>
      </div>

      <div className="mt-6">
        <Input
          placeholder="Search by instructor name, email, or message…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          className="mt-6 bg-white"
          icon={MessageCircleHeart}
          title={feedback.length === 0 ? "No feedback yet" : "No feedback matches"}
          body={
            feedback.length === 0
              ? "Feature suggestions and bug reports submitted from the dashboard will show up here."
              : "Try a different search."
          }
        />
      ) : (
        <div className="surface mt-4 divide-y divide-border bg-white">
          {filtered.map((f) => (
            <div key={f.id} className="p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-medium">{f.instructorName}</p>
                <p className="text-xs text-muted-foreground">
                  {f.createdAt.toLocaleDateString()} · {f.createdAt.toLocaleTimeString()}
                </p>
              </div>
              <p className="text-xs text-muted-foreground">{f.instructorEmail}</p>
              <p className="mt-2 whitespace-pre-wrap text-sm">{f.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
