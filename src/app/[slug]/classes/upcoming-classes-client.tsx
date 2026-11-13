"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type CSSProperties } from "react";
import { ArrowLeft, CalendarDays } from "lucide-react";
import { SageClassCard } from "@/components/public/SageTheme";
import { ClassCardClassic, type PublicClass } from "@/lib/public-page-layout";
import { publicFont, type PublicPageTemplate, type PublicPageFont } from "@/lib/public-page-theme";
import { utcToZonedDateTime } from "@/lib/timezone";
import { sageBackgroundStyle } from "@/lib/sage-background";
import type { PageBackground } from "@/lib/public-page-background";
import { isColorBright } from "@/lib/public-page-background";
import type { CurrencyCode } from "@/lib/demo";
import { WaitlistDialog } from "../public-page-client";

export function UpcomingClassesClient({
  instructor,
  classes,
}: {
  instructor: {
    name: string;
    slug: string;
    photoUrl: string | null;
    themeColor: string;
    currency: CurrencyCode;
    pageTemplate: PublicPageTemplate;
    pageFont: PublicPageFont;
  } & Partial<PageBackground>;
  classes: PublicClass[];
}) {
  const [mode, setMode] = useState("ALL");
  const [date, setDate] = useState("");
  const [waitlist, setWaitlist] = useState<string | null>(null);
  const [joined, setJoined] = useState<string[]>([]);
  const font = publicFont(instructor.pageFont);
  const sage = instructor.pageTemplate === "SAGE";
  const Card = sage ? SageClassCard : ClassCardClassic;
  const dates = [
    ...new Set(classes.map((cls) => utcToZonedDateTime(new Date(cls.startAt), cls.timezone).date)),
  ];
  const filtered = classes.filter(
    (cls) =>
      (mode === "ALL" || cls.mode === mode) &&
      (!date || utcToZonedDateTime(new Date(cls.startAt), cls.timezone).date === date),
  );
  return (
    <div
      className={`public-personalized min-h-screen ${sage ? "sage-page" : "bg-sand/20"}`}
      style={
        {
          "--theme": instructor.themeColor,
          "--theme-on": isColorBright(instructor.themeColor) ? "#152018" : "#ffffff",
          "--public-heading": font.heading,
          "--public-body": font.body,
          ...(sage ? sageBackgroundStyle(instructor) : {}),
        } as CSSProperties
      }
    >
      <main className="mx-auto max-w-3xl px-4 py-7 sm:px-6 sm:py-10">
        <Link
          href={`/${instructor.slug}`}
          className="inline-flex items-center gap-2 text-sm hover:underline"
        >
          <ArrowLeft className="size-4" /> Back to {instructor.name.split(" ")[0]}’s page
        </Link>
        <div className="mt-7 flex items-center gap-3">
          {instructor.photoUrl ? (
            <Image
              src={instructor.photoUrl}
              alt=""
              width={48}
              height={48}
              sizes="48px"
              className="size-12 rounded-full object-cover"
            />
          ) : null}
          <p className="display text-xl">{instructor.name}</p>
        </div>
        <h1 className="mt-6 text-4xl tracking-tight sm:text-5xl">Upcoming classes</h1>
        <p className="mt-3 text-sm text-muted-foreground">Find a little time for your practice.</p>
        <div role="group" aria-label="Class format" className="mt-6 flex gap-2">
          {[
            { value: "ALL", label: "All classes" },
            { value: "IN_PERSON", label: "In studio" },
            { value: "ONLINE", label: "Online" },
          ].map((item) => (
            <button
              key={item.value}
              type="button"
              aria-pressed={mode === item.value}
              onClick={() => setMode(item.value)}
              className="rounded-lg border border-border px-4 py-2.5 text-sm"
              style={
                mode === item.value ? { background: "var(--theme)", color: "var(--theme-on)" } : {}
              }
            >
              {item.label}
            </button>
          ))}
        </div>
        <label className="mt-4 flex items-center gap-3 text-sm">
          <CalendarDays className="size-4" />
          <span className="sr-only">Class date</span>
          <select
            aria-label="Class date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="min-h-11 rounded-lg border border-border bg-transparent px-3"
          >
            <option value="">All dates</option>
            {dates.map((value) => (
              <option key={value} value={value}>
                {new Intl.DateTimeFormat("en", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  timeZone: "UTC",
                }).format(new Date(`${value}T12:00:00Z`))}
              </option>
            ))}
          </select>
        </label>
        <div className="mt-6 space-y-4">
          {filtered.map((cls) => (
            <Card
              key={cls.id}
              c={cls}
              slug={instructor.slug}
              currency={instructor.currency}
              onWaitlist={joined.includes(cls.id)}
              onJoinWaitlist={() => setWaitlist(cls.id)}
            />
          ))}
          {!filtered.length ? (
            <p
              role="status"
              className="rounded-xl border border-dashed border-border p-8 text-sm text-muted-foreground"
            >
              {classes.length
                ? "No classes match these filters. Try another date or format."
                : "No upcoming classes right now. Check back soon."}
            </p>
          ) : null}
        </div>
        <p className="mt-6 text-xs text-muted-foreground">
          Each class shows the timezone set by your teacher.
        </p>
        <footer className="sage-footer">
          Powered by <Link href="/">Flowboc</Link>
        </footer>
      </main>
      <WaitlistDialog
        slug={instructor.slug}
        classId={waitlist}
        classLabel={classes.find((cls) => cls.id === waitlist)?.name}
        onOpenChange={(open) => {
          if (!open) setWaitlist(null);
        }}
        onJoined={(id) => {
          setJoined((previous) => [...previous, id]);
          setWaitlist(null);
        }}
      />
    </div>
  );
}
