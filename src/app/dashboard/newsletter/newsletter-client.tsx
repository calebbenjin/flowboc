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
import {
  hasNewsletterConsent,
  newsletterAudienceStatus,
  newsletterSourceLabels,
} from "@/lib/newsletter/consent";
import { NewsletterVisibility } from "./NewsletterVisibility";
import { ProBadge } from "@/components/ProGate";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
    [
      s.name ?? "",
      s.email,
      newsletterAudienceStatus(s),
      s.source ?? "",
      s.subscribedAt.toISOString(),
    ]
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

  const subscribedCount = subscribers.filter(hasNewsletterConsent).length;

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
          <div className="flex items-center gap-3">
            <h1 className="text-3xl">Newsletter</h1>
            <ProBadge />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Keep your students close. Give them a reason to book again.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="clay">
            <Link href="/dashboard/newsletter/compose">New campaign</Link>
          </Button>
        </div>
      </div>

      <NewsletterVisibility />

      <Tabs defaultValue="campaigns" className="mt-7">
        <TabsList aria-label="Newsletter sections">
          <TabsTrigger value="campaigns">Campaigns ({campaigns.length})</TabsTrigger>
          <TabsTrigger value="audience">Audience ({subscribedCount})</TabsTrigger>
        </TabsList>
        <TabsContent value="campaigns" className="mt-6 space-y-8">
          {(["drafts", "history"] as const).map((section) => {
            const rows = campaigns.filter((campaign) =>
              section === "drafts" ? campaign.status === "DRAFT" : campaign.status !== "DRAFT",
            );
            return (
              <section key={section}>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h2 className="text-lg">
                    {section === "drafts" ? "Your drafts" : "Campaign history"}
                  </h2>
                  <span className="text-xs text-muted-foreground">
                    {rows.length} {section === "drafts" ? "saved" : "campaigns"}
                  </span>
                </div>
                {!rows.length ? (
                  <div className="rounded-xl border border-dashed border-border px-6 py-9">
                    <Mail className="mb-3 size-5 text-muted-foreground" />
                    <h3 className="text-lg">
                      {section === "drafts"
                        ? "Your next class starts with a conversation"
                        : "No campaigns sent yet"}
                    </h3>
                    <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground">
                      {section === "drafts"
                        ? "Choose a template, add a class, and save a draft. You can come back when you’re ready to send."
                        : "Sent campaigns and their results will appear here."}
                    </p>
                    {section === "drafts" ? (
                      <Button asChild variant="quiet" size="sm" className="mt-4">
                        <Link href="/dashboard/newsletter/compose">Create your first draft</Link>
                      </Button>
                    ) : null}
                  </div>
                ) : (
                  <div className="surface divide-y divide-border">
                    {rows.map((campaign) => (
                      <div
                        key={campaign.id}
                        className="flex flex-wrap items-center gap-4 p-4 sm:p-5"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="break-words font-medium">
                            {section === "drafts" ? (
                              <Link
                                className="hover:text-clay hover:underline"
                                href={`/dashboard/newsletter/compose?draft=${campaign.id}`}
                              >
                                {campaign.subject || "Untitled campaign"}
                              </Link>
                            ) : (
                              campaign.subject
                            )}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {section === "drafts" ? "Edited " : "Created "}
                            {formatDistanceToNow(
                              section === "drafts" ? campaign.updatedAt : campaign.createdAt,
                              { addSuffix: true },
                            )}
                          </p>
                          {campaign.failedCount > 0 ? (
                            <p className="mt-2 text-xs text-destructive">
                              {campaign.failedCount} failed · {campaign.sentCount} sent
                            </p>
                          ) : null}
                          {campaign.errorMessage ? (
                            <p className="mt-1 max-w-lg break-words text-xs text-muted-foreground">
                              {campaign.errorMessage}
                            </p>
                          ) : null}
                        </div>
                        {section === "drafts" ? (
                          <Button asChild variant="quiet" size="sm">
                            <Link href={`/dashboard/newsletter/compose?draft=${campaign.id}`}>
                              Continue editing
                            </Link>
                          </Button>
                        ) : (
                          <>
                            <span className="text-sm tabular-nums text-muted-foreground">
                              {campaign.sentCount}/{campaign.recipientCount} sent
                            </span>
                            <StatusPill tone={campaignTone(campaign.status)}>
                              {campaign.status === "FAILED" && campaign.sentCount > 0
                                ? "partially sent"
                                : campaign.status.toLowerCase()}
                            </StatusPill>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </TabsContent>
        <TabsContent value="audience" className="mt-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg">Your audience</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {subscribedCount} subscribed ·{" "}
                {subscribers.filter((s) => s.status === "UNSUBSCRIBED").length} unsubscribed ·{" "}
                {subscribers.filter((s) => newsletterAudienceStatus(s) === "consent needed").length}{" "}
                consent needed
              </p>
            </div>
            <Button variant="outline" onClick={() => downloadCsv(subscribers)}>
              Export CSV
            </Button>
          </div>
          <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
            Only people with an explicit opt-in receive campaigns. Legacy booking contacts marked
            “consent needed” are excluded until they subscribe.
          </p>
          <Input
            aria-label="Search audience"
            placeholder="Search your audience"
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
                  ? "People appear here when they subscribe on your booking page or opt in during class, e-book, or 1:1 checkout."
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
                    {newsletterSourceLabels[s.source ?? ""] ?? "No opt-in recorded"}
                  </span>
                  <StatusPill tone={hasNewsletterConsent(s) ? "good" : "neutral"}>
                    {newsletterAudienceStatus(s)}
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
        </TabsContent>
      </Tabs>
    </DashboardShell>
  );
}
