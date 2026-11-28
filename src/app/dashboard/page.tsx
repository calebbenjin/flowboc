import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AlertCircle, CalendarDays, CheckCircle2, Pencil, Wallet } from "lucide-react";
import { BookingLinkAction } from "@/components/BookingLinkAction";
import { DashboardShell } from "@/components/DashboardShell";
import { EmptyState } from "@/components/EmptyState";
import { StatusPill } from "@/components/StatusPill";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/db";
import { getCurrentInstructor } from "@/lib/get-current-instructor";
import { formatClassDate, formatClassTime } from "@/lib/format-class-time";
import { getAttentionItems, getDashboardStats, getOnboardingChecklist } from "./queries";
import { dashboardIcons } from "@/components/dashboard-icons";
import { OfferDiscovery } from "@/components/OfferDiscovery";
import { DashboardWelcome } from "./DashboardWelcome";
import { OnboardingChecklist } from "./OnboardingChecklist";
import { money, timezoneLabel } from "@/lib/demo";
import { cn } from "@/lib/utils";
import { getInstructorTransactions } from "@/lib/transactions/queries";
import { TransactionTable } from "@/components/TransactionTable";

const statCardToneClasses = {
  clay: "border-clay/20 bg-linear-to-br from-clay/15 via-clay/5 to-transparent",
  mint: "border-mint/30 bg-linear-to-br from-mint/20 via-mint/8 to-transparent",
  success: "border-success/25 bg-linear-to-br from-success/18 via-success/6 to-transparent",
  warning: "border-warning/25 bg-linear-to-br from-warning/20 via-warning/8 to-transparent",
} as const;

const statToneClasses = {
  clay: "bg-white/70 text-clay",
  mint: "bg-white/70 text-mint-foreground",
  success: "bg-white/70 text-success",
  warning: "bg-white/70 text-warning-foreground",
} as const;

const attentionToneClasses = {
  warning: "bg-warning/20 text-warning-foreground",
  destructive: "bg-destructive/12 text-destructive",
  muted: "bg-secondary text-secondary-foreground",
} as const;

const attentionMeta: Record<
  string,
  { icon: typeof AlertCircle; tone: keyof typeof attentionToneClasses }
> = {
  "Almost full": { icon: CalendarDays, tone: "warning" },
  "Failed payment": { icon: AlertCircle, tone: "destructive" },
  "Draft class": { icon: Pencil, tone: "muted" },
};

export const metadata: Metadata = {
  title: "Dashboard — Flowboc",
  description: "Revenue, upcoming classes, recent bookings and what needs your attention.",
  openGraph: {
    title: "Dashboard — Flowboc",
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

  const [upcoming, attention, stats, recent, checklist] = await Promise.all([
    prisma.yogaClass.findMany({
      where: {
        instructorId: instructor.id,
        status: { in: ["PUBLISHED", "FULL"] },
        startAt: { gte: new Date() },
      },
      orderBy: { startAt: "asc" },
      include: { _count: { select: { bookings: { where: { status: "CONFIRMED" } } } } },
      take: 5,
    }),
    getAttentionItems(instructor.id),
    getDashboardStats(instructor.id, instructor.timezone, instructor.currency),
    getInstructorTransactions({ pageSize: "5" }),
    instructor.checklistDismissedAt ? null : getOnboardingChecklist(instructor),
  ]);

  const today = new Intl.DateTimeFormat("en-US", {
    timeZone: instructor.timezone,
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());
  const showWelcome =
    checklist !== null && !checklist.find((item) => item.key === "first-booking")?.done;
  const hasPublishedClass = checklist?.find((item) => item.key === "create-class")?.done ?? false;
  const actionableAttention = attention.filter((item) => item.kind !== "Almost full");

  return (
    <DashboardShell>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl">
            {showWelcome ? "Your teaching space" : `Welcome back, ${instructor.name.split(" ")[0]}`}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {today} · {instructor.timezone}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <BookingLinkAction />
          <Button asChild variant="clay">
            <Link href="/dashboard/classes/new">Create class</Link>
          </Button>
        </div>
      </div>

      {showWelcome && (
        <DashboardWelcome
          name={instructor.name.split(" ")[0] ?? instructor.name}
          hasPublishedClass={hasPublishedClass}
        />
      )}

      {checklist && (!showWelcome || hasPublishedClass) ? (
        <div className="mt-6">
          <OnboardingChecklist items={checklist} />
        </div>
      ) : null}

      <div>
        <div className="mt-10 lg:mt-20 grid gap-4 grid-cols-2 sm:grid-cols-2 xl:grid-cols-4">
          {[
            {
              label: "Revenue this month",
              value: money(stats.revenueThisMonth, instructor.currency),
              icon: Wallet,
              tone: "clay",
            },
            {
              label: "Upcoming classes",
              value: stats.upcomingClasses,
              icon: dashboardIcons.classes,
              tone: "clay",
            },
            {
              label: "All-time bookings",
              value: stats.totalBookings,
              icon: dashboardIcons.classes,
              tone: "clay",
            },
            {
              label: "All-time students",
              value: stats.totalStudents,
              icon: dashboardIcons.students,
              tone: "clay",
            },
          ].map((s) => (
            <div
              key={s.label}
              className={cn(
                "rounded-xl border p-5 shadow-(--shadow-soft)",
                statCardToneClasses[s.tone as keyof typeof statCardToneClasses],
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">{s.label}</p>
                <span
                  className={cn(
                    "grid size-9 shrink-0 place-items-center border border-primary/20 rounded-full bg-primary/40",
                    statToneClasses[s.tone as keyof typeof statToneClasses],
                  )}
                >
                  <s.icon className="size-6" />
                </span>
              </div>
              <p className="display mt-2 sm:text-3xl text-2xl">{s.value}</p>
            </div>
          ))}
        </div>

        <p className="mt-2 text-xs text-muted-foreground">
          Revenue includes paid classes, 1:1 sessions, and ebooks in {instructor.currency}, recorded
          this calendar month in {instructor.timezone}, before payout deductions.
        </p>
      </div>

      <OfferDiscovery />

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="min-w-0 lg:col-span-2">
          <h2 className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Your teaching schedule
          </h2>

          {upcoming.length === 0 && showWelcome && !hasPublishedClass ? (
            <p className="mt-3 rounded-xl border border-dashed border-[#cbd4bf] bg-[#f6f7f0] p-6 text-sm leading-relaxed text-muted-foreground">
              Your schedule will take shape here as you add your classes.
            </p>
          ) : upcoming.length === 0 ? (
            <EmptyState
              className="mt-3"
              icon={dashboardIcons.classes}
              title="No upcoming classes"
              body="Create a class to start taking bookings."
              action={
                <Button asChild size="sm" variant="clay">
                  <Link href="/dashboard/classes/new">Create class</Link>
                </Button>
              }
            />
          ) : (
            <div className="mt-3 space-y-3">
              {upcoming.map((c, index) => (
                <div key={c.id} className="surface bg-white flex flex-wrap items-center gap-4 p-4">
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
                  <div className="min-w-0 flex-1 basis-40">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">
                        {index === 0 ? "Next up · " : ""}
                        {c.name}
                      </p>
                      <StatusPill tone={c.status === "FULL" ? "warn" : "good"}>
                        {c.status === "FULL" ? "Full" : "Open"}
                      </StatusPill>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {formatClassDate(c)} · {formatClassTime(c)} {timezoneLabel(c.timezone)} ·{" "}
                      {c.durationMinutes} min
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {c.mode === "ONLINE" ? "Online" : c.location || "Location not set"}
                    </p>
                    <p className="mt-1 text-sm">
                      {c._count.bookings} / {c.capacity} confirmed
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col gap-2">
                    <Button asChild variant="quiet" size="sm">
                      <Link href={`/dashboard/classes/${c.id}`}>View students</Link>
                    </Button>
                    {index === 0 ? (
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/dashboard/classes/${c.id}?tab=attendance`}>
                          Take attendance
                        </Link>
                      </Button>
                    ) : null}
                    {index === 0 &&
                    c.mode === "ONLINE" &&
                    c.location &&
                    /^https?:\/\//i.test(c.location) ? (
                      <Button asChild variant="clay" size="sm">
                        <a href={c.location} target="_blank" rel="noopener noreferrer">
                          Open meeting
                        </a>
                      </Button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-8 mb-3 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Recent transactions
            </h2>
            <Link
              href="/dashboard/analytics#transactions"
              className="inline-flex min-h-11 items-center text-sm text-primary"
            >
              View all transactions →
            </Link>
          </div>

          {recent.rows.length ? (
            <TransactionTable rows={recent.rows} compact />
          ) : (
            <p className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
              Class bookings, 1:1 sessions, and ebook purchases will appear here.
            </p>
          )}
        </div>

        <div>
          <h2 className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Needs attention
          </h2>
          {actionableAttention.length === 0 && instructor.payoutStatus === "CONNECTED" ? (
            <EmptyState
              className="mt-3"
              icon={CheckCircle2}
              title="You're all caught up"
              body="Nothing needs your attention right now."
            />
          ) : (
            <div className="mt-3 rounded-3xl bg-linear-to-br from-warning/20 via-clay/10 to-clay/5 p-4">
              <div className="space-y-3">
                {instructor.payoutStatus !== "CONNECTED" ? (
                  <div className="rounded-xl bg-white p-4">
                    <p className="text-sm font-medium">Set up payouts</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Connect your bank account to receive your earnings.
                    </p>
                    <Link
                      href="/dashboard/payouts"
                      className="mt-3 inline-flex text-sm font-medium text-clay underline"
                    >
                      Set up payouts →
                    </Link>
                  </div>
                ) : null}
                {actionableAttention.map((a) => {
                  const meta = attentionMeta[a.kind] ?? {
                    icon: AlertCircle,
                    tone: "muted" as const,
                  };
                  const Icon = meta.icon;
                  return (
                    <div
                      key={a.id}
                      className="flex gap-3 rounded-2xl bg-white/70 p-4 shadow-(--shadow-soft)"
                    >
                      <span
                        className={cn(
                          "grid size-8 shrink-0 place-items-center rounded-full",
                          attentionToneClasses[meta.tone],
                        )}
                      >
                        <Icon className="size-4" />
                      </span>
                      <div>
                        <p className="text-sm font-medium">{a.kind}</p>
                        <p className="text-sm text-muted-foreground">{a.detail}</p>
                        <Link
                          href={a.href}
                          className="mt-2 inline-flex text-sm font-medium text-clay underline"
                        >
                          {a.action} →
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
