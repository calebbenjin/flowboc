import type { Metadata } from "next";
import { formatDistanceToNow } from "date-fns";
import {
  CalendarCheck,
  Clock,
  CreditCard,
  Gift,
  Mail,
  UserPlus,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getAdminOverviewStats, getRecentActivity } from "./queries";

export const metadata: Metadata = {
  title: "Overview — Flowboc admin",
};

const activityIcons: Record<string, LucideIcon> = {
  INSTRUCTOR_SIGNED_UP: UserPlus,
  INSTRUCTOR_FIRST_BOOKING: CalendarCheck,
  SUBSCRIPTION_ACTIVATED: CreditCard,
  SUBSCRIPTION_CANCELED: XCircle,
  TRIAL_EXTENDED: Clock,
  COMP_GRANTED: Gift,
  CONTACT_MESSAGE: Mail,
};

export default async function AdminOverviewPage() {
  const [stats, activity] = await Promise.all([getAdminOverviewStats(), getRecentActivity()]);

  const cards = [
    { label: "Total instructors", value: stats.totalInstructors },
    { label: "New this week", value: stats.newInstructorsThisWeek },
    { label: "Converted to first booking", value: stats.convertedToFirstBooking },
    { label: "Active subscriptions", value: stats.activeSubscriptions },
    { label: "Trialing", value: stats.trialing },
    { label: "Past due", value: stats.pastDue },
    { label: "Contact messages this week", value: stats.contactMessagesThisWeek },
  ];

  return (
    <div>
      <div>
        <h1 className="text-3xl">Overview</h1>
        <p className="mt-1 text-sm text-muted-foreground">Platform activity at a glance.</p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className="surface bg-white p-5">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{c.label}</p>
            <p className="display mt-2 text-3xl">{c.value}</p>
          </div>
        ))}
      </div>

      <h2 className="mt-8 text-xs uppercase tracking-[0.18em] text-muted-foreground">
        Recent activity
      </h2>
      {activity.length === 0 ? (
        <div className="surface mt-3 bg-white p-8 text-center text-sm text-muted-foreground">
          No activity yet.
        </div>
      ) : (
        <div className="surface mt-3 overflow-hidden bg-white divide-y divide-border">
          {activity.map((a) => {
            const Icon = activityIcons[a.type] ?? Clock;
            return (
              <div key={a.id} className="flex items-center gap-3 p-4">
                <span
                  className={cn(
                    "grid size-8 shrink-0 place-items-center rounded-full bg-secondary text-secondary-foreground",
                  )}
                >
                  <Icon className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{a.message}</p>
                </div>
                <p className="shrink-0 text-xs text-muted-foreground">
                  {formatDistanceToNow(a.createdAt, { addSuffix: true })}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
