import type { Metadata } from "next";
import { Users } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import { EmptyState } from "@/components/EmptyState";
import { Input } from "@/components/ui/input";
import { money, students } from "@/lib/demo";

export const metadata: Metadata = {
  title: "Students — Flowbuk",
  description: "A student list that builds itself from every booking you receive.",
  openGraph: {
    title: "Students — Flowbuk",
    description: "Classes booked, attended and total spent.",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export default function StudentsPage() {
  return (
    <DashboardShell>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl">Students</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {students.length} people have booked with you
          </p>
        </div>
        <Input placeholder="Search students" className="w-full max-w-xs" />
      </div>

      {students.length === 0 ? (
        <EmptyState
          className="mt-6"
          icon={Users}
          title="No students yet"
          body="Everyone who books a class with you will show up here."
        />
      ) : (
        <div className="surface mt-6 divide-y divide-border">
          {students.map((s) => (
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
                  {s.email} · {s.phone}
                </p>
              </div>
              <div className="text-sm text-muted-foreground">
                {s.classesBooked} booked · {s.classesAttended} attended
              </div>
              <div className="w-28 text-right">
                <p className="font-medium">{money(s.totalSpent)}</p>
                <p className="text-xs text-muted-foreground">{s.lastBooking}</p>
              </div>
              <div className="w-full text-xs text-muted-foreground sm:w-56 sm:text-right">
                {s.upcoming ? `Next: ${s.upcoming}` : "No upcoming booking"}
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
