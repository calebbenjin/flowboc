"use client";

import { useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Users } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import { EmptyState } from "@/components/EmptyState";
import { Input } from "@/components/ui/input";
import { money } from "@/lib/demo";
import { formatClassDate, formatClassTime } from "@/lib/format-class-time";
import type { StudentRow } from "./queries";

export function StudentsClient({ students }: { students: StudentRow[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return students;
    return students.filter(
      (s) => s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q),
    );
  }, [students, query]);

  return (
    <DashboardShell>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl">Students</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {students.length} people have booked with you
          </p>
        </div>
        <Input
          placeholder="Search students"
          className="w-full max-w-xs"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          className="mt-6"
          icon={Users}
          title={students.length === 0 ? "No students yet" : "No matches"}
          body={
            students.length === 0
              ? "Everyone who books a class with you will show up here."
              : "Try a different name or email."
          }
        />
      ) : (
        <div className="surface mt-6 divide-y divide-border">
          {filtered.map((s) => (
            <div key={s.email} className="flex flex-wrap items-center gap-4 p-4">
              <div className="flex size-10 items-center justify-center rounded-full bg-accent text-sm font-medium text-accent-foreground">
                {s.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium">{s.name}</p>
                <p className="truncate text-sm text-muted-foreground">
                  {s.email}
                  {s.phone ? ` · ${s.phone}` : ""}
                </p>
              </div>
              <div className="text-sm text-muted-foreground">
                {s.classesBooked} booked · {s.classesAttended} attended
              </div>
              <div className="w-28 text-right">
                <p className="font-medium">{money(s.totalSpent)}</p>
                <p className="text-xs text-muted-foreground">
                  {s.lastBookingAt
                    ? formatDistanceToNow(s.lastBookingAt, { addSuffix: true })
                    : "No past classes"}
                </p>
              </div>
              <div className="w-full text-xs text-muted-foreground sm:w-56 sm:text-right">
                {s.upcoming
                  ? `Next: ${s.upcoming.className} · ${formatClassDate(s.upcoming)} ${formatClassTime(s.upcoming)}`
                  : "No upcoming booking"}
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
