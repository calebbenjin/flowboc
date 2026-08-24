"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { Mail, Trash2, UserX } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import { EmptyState } from "@/components/EmptyState";
import { StatusPill } from "@/components/StatusPill";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { NewsletterCampaign, NewsletterSubscriber } from "@/generated/prisma/client";
import { deleteSubscriber, unsubscribeManually } from "./actions";

function campaignTone(status: NewsletterCampaign["status"]) {
  if (status === "SENT") return "good" as const;
  if (status === "FAILED") return "bad" as const;
  if (status === "SENDING") return "warn" as const;
  return "neutral" as const;
}

function toCsv(subscribers: NewsletterSubscriber[]): string {
  const header = "name,email,status,source,subscribed_at";
  const rows = subscribers.map((s) =>
    [s.name ?? "", s.email, s.status, s.source ?? "", s.subscribedAt.toISOString()]
      .map((v) => `"${v.replace(/"/g, '""')}"`)
      .join(","),
  );
  return [header, ...rows].join("\n");
}

function downloadCsv(subscribers: NewsletterSubscriber[]) {
  const blob = new Blob([toCsv(subscribers)], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "subscribers.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export function NewsletterClient({
  subscribers,
  campaigns,
}: {
  subscribers: NewsletterSubscriber[];
  campaigns: NewsletterCampaign[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);

  const subscribedCount = subscribers.filter((s) => s.status === "SUBSCRIBED").length;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return subscribers;
    return subscribers.filter(
      (s) => s.email.toLowerCase().includes(q) || (s.name ?? "").toLowerCase().includes(q),
    );
  }, [subscribers, query]);

  async function handleUnsubscribe(id: string) {
    setPendingId(id);
    try {
      const result = await unsubscribeManually(id);
      if (result.ok) {
        toast.success("Marked as unsubscribed");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } finally {
      setPendingId(null);
    }
  }

  async function handleDelete(id: string) {
    setPendingId(id);
    try {
      const result = await deleteSubscriber(id);
      if (result.ok) {
        toast.success("Subscriber removed");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } finally {
      setPendingId(null);
    }
  }

  return (
    <DashboardShell>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl">Newsletter</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {subscribedCount} people you can email · {subscribers.length} total
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => downloadCsv(subscribers)}>
            Export CSV
          </Button>
          <Button asChild variant="clay">
            <Link href="/dashboard/newsletter/compose">New campaign</Link>
          </Button>
        </div>
      </div>

      <Input
        placeholder="Search students"
        className="mt-6 w-full max-w-xs"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {filtered.length === 0 ? (
        <EmptyState
          className="mt-4"
          icon={Mail}
          title={subscribers.length === 0 ? "No one to email yet" : "No matches"}
          body={
            subscribers.length === 0
              ? "Anyone who books a class with you shows up here automatically."
              : "Try a different name or email."
          }
        />
      ) : (
        <div className="surface mt-4 divide-y divide-border">
          {filtered.map((s) => (
            <div key={s.id} className="flex flex-wrap items-center gap-4 p-4">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{s.name || s.email}</p>
                <p className="truncate text-sm text-muted-foreground">{s.email}</p>
              </div>
              <span className="hidden text-sm text-muted-foreground sm:block">
                {s.source === "booking" ? "Booked a class" : "Signed up"}
              </span>
              <StatusPill tone={s.status === "SUBSCRIBED" ? "good" : "neutral"}>
                {s.status.toLowerCase()}
              </StatusPill>
              <span className="text-sm text-muted-foreground">
                {formatDistanceToNow(s.subscribedAt, { addSuffix: true })}
              </span>
              {s.status === "SUBSCRIBED" && (
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Unsubscribe"
                  disabled={pendingId === s.id}
                  onClick={() => void handleUnsubscribe(s.id)}
                >
                  <UserX className="size-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                aria-label="Delete"
                disabled={pendingId === s.id}
                onClick={() => void handleDelete(s.id)}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <h2 className="mt-12 text-xs uppercase tracking-[0.18em] text-muted-foreground">
        Campaign history
      </h2>

      {campaigns.length === 0 ? (
        <EmptyState className="mt-4" icon={Mail} title="No campaigns sent yet" />
      ) : (
        <div className="surface mt-4 divide-y divide-border">
          {campaigns.map((c) => (
            <div key={c.id} className="flex flex-wrap items-center gap-4 p-4">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{c.subject}</p>
                <p className="text-sm text-muted-foreground">
                  {c.sentAt
                    ? formatDistanceToNow(c.sentAt, { addSuffix: true })
                    : formatDistanceToNow(c.createdAt, { addSuffix: true })}
                </p>
              </div>
              <span className="text-sm text-muted-foreground">
                {c.sentCount}/{c.recipientCount} sent
              </span>
              <StatusPill tone={campaignTone(c.status)}>{c.status.toLowerCase()}</StatusPill>
            </div>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
