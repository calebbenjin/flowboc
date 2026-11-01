"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/StatusPill";
import { addCalendarDays } from "@/lib/class-schedule";
import { utcToZonedDateTime } from "@/lib/timezone";
import type { YogaClass } from "@/generated/prisma/client";

type CalendarClass = YogaClass & { _count: { bookings: number } };

export function ClassCalendar({
  classes,
  timezone,
}: {
  classes: CalendarClass[];
  timezone: string;
}) {
  const today = utcToZonedDateTime(new Date(), timezone).date;
  const [month, setMonth] = useState(() => today.slice(0, 7));
  const [selected, setSelected] = useState(today);
  const first = `${month}-01`;
  const firstDay = new Date(`${first}T12:00:00Z`).getUTCDay();
  const nextMonth = new Date(`${first}T12:00:00Z`);
  nextMonth.setUTCMonth(nextMonth.getUTCMonth() + 1);
  const daysInMonth = new Date(nextMonth.getTime() - 86400000).getUTCDate();
  const cellCount = Math.ceil((firstDay + daysInMonth) / 7) * 7;
  const byDate = new Map<string, CalendarClass[]>();
  for (const cls of classes) {
    const date = utcToZonedDateTime(new Date(cls.startAt), timezone).date;
    const entries = byDate.get(date) ?? [];
    entries.push(cls);
    byDate.set(date, entries);
  }
  const selectedClasses = [...(byDate.get(selected) ?? [])].sort(
    (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
  );
  function moveMonth(offset: number) {
    const value = new Date(`${first}T12:00:00Z`);
    value.setUTCMonth(value.getUTCMonth() + offset);
    const date = value.toISOString().slice(0, 10);
    setMonth(date.slice(0, 7));
    setSelected(date);
  }
  const heading = new Intl.DateTimeFormat("en", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${first}T12:00:00Z`));
  return (
    <section
      className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(240px,0.8fr)]"
      aria-label="Class calendar"
    >
      <div className="surface p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg" aria-live="polite">
            {heading}
          </h2>
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="quiet"
              onClick={() => {
                setMonth(today.slice(0, 7));
                setSelected(today);
              }}
            >
              Today
            </Button>
            <Button
              size="icon"
              variant="ghost"
              aria-label="Previous month"
              onClick={() => moveMonth(-1)}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              aria-label="Next month"
              onClick={() => moveMonth(1)}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
        <p className="mb-3 text-xs text-muted-foreground">
          Times shown in {timezone}. Search and status filters also apply here.
        </p>
        <div className="grid grid-cols-7 gap-1">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <span key={day} className="py-2 text-center text-xs text-muted-foreground">
              {day}
            </span>
          ))}
          {Array.from({ length: cellCount }, (_, index) => {
            const date = addCalendarDays(first, index - firstDay);
            const count = byDate.get(date)?.length ?? 0;
            return (
              <button
                key={date}
                type="button"
                aria-pressed={selected === date}
                aria-current={date === today ? "date" : undefined}
                aria-label={`${date}, ${count} ${count === 1 ? "class" : "classes"}`}
                onClick={() => {
                  setSelected(date);
                  setMonth(date.slice(0, 7));
                }}
                className={`flex min-h-16 flex-col items-center justify-center gap-1 rounded-lg border text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay ${selected === date ? "border-clay bg-clay/10 text-clay" : "border-transparent hover:bg-accent"} ${date.slice(0, 7) !== month ? "text-muted-foreground" : ""} ${date === today ? "font-bold" : ""}`}
              >
                <span>{Number(date.slice(-2))}</span>
                <span className="text-[10px]">
                  {count ? `${count} ${count === 1 ? "class" : "classes"}` : "\u00a0"}
                </span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="surface p-5" aria-live="polite">
        <h3 className="text-lg">
          {new Intl.DateTimeFormat("en", {
            weekday: "long",
            month: "long",
            day: "numeric",
            timeZone: "UTC",
          }).format(new Date(`${selected}T12:00:00Z`))}
        </h3>
        {selectedClasses.length ? (
          <div className="mt-4 space-y-3">
            {selectedClasses.map((cls) => (
              <div key={cls.id} className="rounded-lg border border-border p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Link
                    href={`/dashboard/classes/${cls.id}`}
                    className="font-medium hover:underline"
                  >
                    {cls.name}
                  </Link>
                  <StatusPill
                    tone={
                      cls.status === "CANCELLED"
                        ? "bad"
                        : cls.status === "PUBLISHED"
                          ? "good"
                          : "neutral"
                    }
                  >
                    {cls.status.toLowerCase()}
                  </StatusPill>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {utcToZonedDateTime(new Date(cls.startAt), timezone).time} · {cls.durationMinutes}{" "}
                  min · {cls._count.bookings}/{cls.capacity} booked
                </p>
                <div className="mt-3 flex gap-2">
                  <Button asChild size="sm" variant="quiet">
                    <Link href={`/dashboard/classes/${cls.id}`}>Manage</Link>
                  </Button>
                  <Button asChild size="sm" variant="ghost">
                    <Link href={`/dashboard/classes/edit/${cls.id}`}>Edit</Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">
            No matching classes on this day. Choose another day or adjust your filters.
          </p>
        )}
      </div>
    </section>
  );
}
