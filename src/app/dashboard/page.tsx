import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowUpRight, AlertCircle, CalendarDays, CheckCircle2, Users } from "lucide-react";
import { BookingLinkAction } from "@/components/BookingLinkAction";
import { DashboardShell } from "@/components/DashboardShell";
import { EmptyState } from "@/components/EmptyState";
import { StatusPill, paymentTone } from "@/components/StatusPill";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/db";
import { getCurrentInstructor } from "@/lib/get-current-instructor";
import { formatClassDate, formatClassTime } from "@/lib/format-class-time";
import { getAttentionItems, getDashboardStats, getRecentBookings } from "./queries";
import { money, timezoneLabel } from "@/lib/demo";
import { siteHost } from "@/lib/site";
import { formatDistanceToNow } from "date-fns";

export const metadata: Metadata = {
  title: "Dashboard — Flowbuk",
  description: "Revenue, upcoming classes, recent bookings and what needs your attention.",
  openGraph: {
    title: "Dashboard — Flowbuk",
    description: "Your teaching business at a glance.",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export default async function Dashboard() {
  const instructor = await getCurrentInstructor();
  if (!instructor) {
    redirect("/onboarding");
  }

  const [upcoming, attention, stats, recent] = await Promise.all([
    prisma.yogaClass.findMany({
      where: {
        instructorId: instructor.id,
        status: { in: ["PUBLISHED", "FULL"] },
        startAt: { gte: new Date() },
      },
      orderBy: { startAt: "asc" },
      take: 5,
    }),
    getAttentionItems(instructor.id),
    getDashboardStats(instructor.id),
    getRecentBookings(instructor.id),
  ]);
  const today = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());

  return (
    <DashboardShell>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl">Good morning, {instructor.name.split(" ")[0]} 👋</h1>
          <p className="mt-1 text-sm text-muted-foreground">{today}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <BookingLinkAction />
          <Button asChild variant="quiet">
            <Link href="/dashboard/classes/new">Create class</Link>
          </Button>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Revenue this month",
            value: money(stats.revenueThisMonth, instructor.currency),
          },
          { label: "Upcoming classes", value: stats.upcomingClasses },
          { label: "Bookings", value: stats.totalBookings },
          { label: "Students", value: stats.totalStudents },
        ].map((s) => (
          <div key={s.label} className="surface bg-white p-5">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{s.label}</p>
            <p className="display mt-2 text-3xl">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Upcoming</h2>
          {upcoming.length === 0 ? (
            <EmptyState
              className="mt-3"
              icon={CalendarDays}
              title="No upcoming classes"
              body="Create a class to start taking bookings."
              action={
                <Button asChild size="sm" className="bg-[#6355ff] hover:bg-[#6355ff]/90 text-white">
                  <Link href="/dashboard/classes/new">Create class</Link>
                </Button>
              }
            />
          ) : (
            <div className="mt-3 space-y-3">
              {upcoming.map((c) => (
                <div key={c.id} className="surface bg-white flex items-center gap-4 p-4">
                  {c.coverUrl ? (
                    <img
                      src={c.coverUrl}
                      alt={c.name}
                      loading="lazy"
                      width={1200}
                      height={800}
                      className="size-16 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="size-16 shrink-0 rounded-lg bg-sand" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{c.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatClassDate(c)} · {formatClassTime(c)} {timezoneLabel(c.timezone)} ·{" "}
                      {c.durationMinutes} min
                    </p>
                    <p className="mt-1 text-sm">0 / {c.capacity} booked</p>
                  </div>
                  <Button asChild variant="quiet" size="sm">
                    <Link href={`/dashboard/classes/${c.id}`}>View class</Link>
                  </Button>
                </div>
              ))}
            </div>
          )}

          <h2 className="mt-8 text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Recent bookings
          </h2>
          {recent.length === 0 ? (
            <EmptyState
              className="mt-3"
              icon={Users}
              title="No bookings yet"
              body="Bookings will show up here once students start booking your classes."
            />
          ) : (
            <div className="surface bg-white mt-3 divide-y divide-border">
              {recent.map((b) => (
                <div key={b.id} className="flex items-center justify-between gap-4 p-4">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{b.studentName}</p>
                    <p className="truncate text-sm text-muted-foreground">
                      {b.className} · {formatDistanceToNow(b.bookedAt, { addSuffix: true })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusPill tone={paymentTone(b.paymentStatus.toLowerCase())}>
                      {b.paymentStatus.toLowerCase()}
                    </StatusPill>
                    <span className="text-sm font-medium">
                      {money(b.amount, instructor.currency)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Needs attention
          </h2>
          {attention.length === 0 ? (
            <EmptyState
              className="mt-3"
              icon={CheckCircle2}
              title="You're all caught up"
              body="Nothing needs your attention right now."
            />
          ) : (
            <div className="mt-3 space-y-3">
              {attention.map((a) => (
                <div key={a.id} className="surface bg-white flex gap-3 p-4">
                  <AlertCircle className="mt-0.5 size-4 shrink-0 text-clay" />
                  <div>
                    <p className="text-sm font-medium">{a.kind}</p>
                    <p className="text-sm text-muted-foreground">{a.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="surface bg-white mt-6 p-5">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Booking link</p>
            <p className="mt-2 text-sm font-medium">
              {siteHost}/{instructor.slug}
            </p>
            <Link
              href={`/${instructor.slug}`}
              className="mt-3 inline-flex items-center gap-1 text-sm text-clay hover:underline"
            >
              Open page <ArrowUpRight className="size-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
