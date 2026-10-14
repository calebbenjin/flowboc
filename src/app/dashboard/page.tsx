import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowUpRight,
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Pencil,
  UserRound,
  Users,
  Wallet,
} from "lucide-react";
import { BookingLinkAction } from "@/components/BookingLinkAction";
import { DashboardShell } from "@/components/DashboardShell";
import { EmptyState } from "@/components/EmptyState";
import { PublicPagePreview, type PreviewClass } from "@/components/PublicPagePreview";
import { StatusPill, paymentTone } from "@/components/StatusPill";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/db";
import { getCurrentInstructor } from "@/lib/get-current-instructor";
import { formatClassDate, formatClassTime } from "@/lib/format-class-time";
import {
  getAttentionItems,
  getDashboardStats,
  getOnboardingChecklist,
  getRecentBookings,
} from "./queries";
import { OnboardingChecklist } from "./OnboardingChecklist";
import { money, timezoneLabel } from "@/lib/demo";
import { siteHost } from "@/lib/site";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

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
      take: 5,
    }),
    getAttentionItems(instructor.id),
    getDashboardStats(instructor.id),
    getRecentBookings(instructor.id),
    instructor.checklistDismissedAt ? null : getOnboardingChecklist(instructor),
  ]);
  const today = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date());

  const previewClasses: PreviewClass[] = upcoming.map((c) => ({
    id: c.id,
    name: c.name,
    coverUrl: c.coverUrl,
    dateLabel: `${formatClassDate(c)} · ${formatClassTime(c)}`,
    price: c.price,
    originalPrice: c.originalPrice,
    currency: instructor.currency,
    spots: null,
  }));

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

      {checklist ? (
        <div className="mt-6">
          <OnboardingChecklist items={checklist} />
        </div>
      ) : null}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
            icon: CalendarDays,
            tone: "mint",
          },
          { label: "Bookings", value: stats.totalBookings, icon: Users, tone: "success" },
          { label: "Students", value: stats.totalStudents, icon: UserRound, tone: "warning" },
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
                  "grid size-9 shrink-0 place-items-center rounded-full",
                  statToneClasses[s.tone as keyof typeof statToneClasses],
                )}
              >
                <s.icon className="size-4" />
              </span>
            </div>
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
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{c.name}</p>
                      <StatusPill tone={c.status === "FULL" ? "warn" : "good"}>
                        {c.status === "FULL" ? "Full" : "Open"}
                      </StatusPill>
                    </div>
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
          <div className=" pt-4">
            <PublicPagePreview
              size="md"
              instructor={{
                name: instructor.name,
                photoUrl: instructor.photoUrl,
                themeColor: instructor.themeColor,
                backgroundImageUrl: instructor.backgroundImageUrl,
                pageLayout: instructor.pageLayout,
                bio: instructor.bio,
                videoCallEnabled: instructor.videoCallEnabled,
                videoCallTitle: instructor.videoCallTitle,
                videoCallDescription: instructor.videoCallDescription,
                videoCallImageUrl: instructor.videoCallImageUrl,
                videoCallPrice: instructor.videoCallPrice,
                currency: instructor.currency,
                socials: instructor.socials.map((s) => ({
                  platform: s.platform.toLowerCase(),
                  handle: s.handle,
                })),
              }}
              classes={previewClasses}
            />
            <Link
              href={`/${instructor.slug}`}
              className="mt-4 flex items-center justify-center gap-1 text-sm text-clay hover:underline"
            >
              View live page <ArrowUpRight className="size-3.5" />
            </Link>
          </div>

          <h2 className="mt-8 text-xs uppercase tracking-[0.18em] text-muted-foreground">
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
            <div className="mt-3 rounded-3xl bg-linear-to-br from-warning/20 via-clay/10 to-clay/5 p-4">
              <div className="space-y-3">
                {attention.map((a) => {
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
