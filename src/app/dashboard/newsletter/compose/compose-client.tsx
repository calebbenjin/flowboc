"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import posthog from "posthog-js";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  Eye,
  FileText,
  Loader2,
  Plus,
  Send,
  X,
} from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import { useInstructor } from "@/components/InstructorProvider";
import { ProBadge, UpgradeModal } from "@/components/ProGate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/RichTextEditor";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";
import { newsletterTemplates, MAX_CAMPAIGN_CLASSES } from "@/lib/newsletter/templates";
import { newsletterSendError } from "@/lib/newsletter/access";
import { money } from "@/lib/demo";
import { formatClassDate, formatClassTime } from "@/lib/format-class-time";
import {
  saveNewsletterDraft,
  previewNewsletter,
  sendNewsletterTest,
  sendNewsletterCampaign,
} from "./actions";

type Draft = {
  id: string;
  revision: string;
  subject: string;
  bodyHtml: string;
  classIds: string[];
};
type ClassOption = {
  id: string;
  name: string;
  coverUrl: string | null;
  startAt: Date;
  timezone: string;
  durationMinutes: number;
  price: number;
  mode: string;
  location: string | null;
};
type Template = (typeof newsletterTemplates)[number];

export function ComposeClient({
  subscriberCount,
  classes,
  initial,
}: {
  subscriberCount: number;
  classes: ClassOption[];
  initial: Draft | null;
}) {
  const router = useRouter();
  const instructor = useInstructor();
  const [subject, setSubject] = useState(initial?.subject ?? "");
  const [bodyHtml, setBodyHtml] = useState(initial?.bodyHtml ?? "");
  const [classIds, setClassIds] = useState<string[]>(initial?.classIds ?? []);
  const [saved, setSaved] = useState(
    initial ? { id: initial.id, revision: initial.revision } : null,
  );
  const [baseline, setBaseline] = useState(
    JSON.stringify({
      subject: initial?.subject ?? "",
      bodyHtml: initial?.bodyHtml ?? "",
      classIds: initial?.classIds ?? [],
    }),
  );
  const [busy, setBusy] = useState<"save" | "preview" | "test" | "send" | null>(null);
  const [editorKey, setEditorKey] = useState(0);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [replaceTemplate, setReplaceTemplate] = useState<Template | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [pending, setPending] = useState<{ id: string; revision: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const content = { subject, bodyHtml, classIds };
  const fingerprint = JSON.stringify(content);
  const dirty = fingerprint !== baseline;
  const { dialog: leaveDialog } = useUnsavedChanges(
    dirty,
    "Your campaign has unsaved changes. Save a draft before leaving, or discard your changes.",
  );
  const unavailableIds = classIds.filter((id) => !classes.some((cls) => cls.id === id));
  const proBlocked = newsletterSendError(instructor);

  function showError(message: string) {
    setError(message);
    toast.error(message);
  }
  function canSend() {
    if (!proBlocked) return true;
    if (instructor.planTier === "STARTER") setUpgradeOpen(true);
    else showError(proBlocked);
    return false;
  }
  function applyTemplate(template: Template) {
    setSubject(template.subject);
    setBodyHtml(template.bodyHtml);
    setEditorKey((value) => value + 1);
    setReplaceTemplate(null);
    setError(null);
  }
  async function persist() {
    const result = await saveNewsletterDraft({ ...content, ...(saved ?? {}) });
    if (!result.ok) {
      showError(result.error);
      return null;
    }
    const next = { id: result.id, revision: result.revision };
    setSaved(next);
    setBaseline(fingerprint);
    return next;
  }
  async function saveDraft() {
    setBusy("save");
    setError(null);
    try {
      const draft = await persist();
      if (draft) {
        toast.success("Draft saved");
        if (!saved)
          router.replace(`/dashboard/newsletter/compose?draft=${draft.id}`, { scroll: false });
      }
    } catch {
      showError("Could not save your draft. Your changes are still here.");
    } finally {
      setBusy(null);
    }
  }
  async function openPreview() {
    setBusy("preview");
    setError(null);
    try {
      const result = await previewNewsletter(content);
      if (result.ok) setPreview(result.html);
      else showError(result.error);
    } catch {
      showError("Could not load the preview. Please try again.");
    } finally {
      setBusy(null);
    }
  }
  async function sendTest() {
    if (!canSend()) return;
    setBusy("test");
    setError(null);
    try {
      const result = await sendNewsletterTest(content);
      if (result.ok) toast.success(`Test sent to ${result.email}`);
      else showError(result.error);
    } catch {
      showError("Could not send the test. Please try again.");
    } finally {
      setBusy(null);
    }
  }
  async function reviewRecipients() {
    if (!canSend()) return;
    setBusy("save");
    try {
      const draft = await persist();
      if (draft) {
        setPreview(null);
        setPending(draft);
      }
    } catch {
      showError("Could not save your campaign. Please try again.");
    } finally {
      setBusy(null);
    }
  }
  async function sendCampaign() {
    if (!pending || !canSend()) return;
    setBusy("send");
    try {
      const result = await sendNewsletterCampaign(pending);
      if (result.ok) {
        if (
          process.env["NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN"] &&
          process.env["NEXT_PUBLIC_POSTHOG_HOST"]
        ) {
          posthog.capture("newsletter_campaign_sent", {
            recipient_count: result.sent,
            failed_count: result.failed,
          });
        }
        if (result.failed)
          toast.warning(`${result.sent} sent; ${result.failed} failed. See campaign history.`);
        else
          toast.success(
            `Campaign sent to ${result.sent} ${result.sent === 1 ? "recipient" : "recipients"}`,
          );
        setBaseline(fingerprint);
        router.push("/dashboard/newsletter");
      } else showError(result.error);
    } catch {
      showError("Could not confirm the send. Check campaign history before trying again.");
    } finally {
      setBusy(null);
      setPending(null);
    }
  }

  return (
    <DashboardShell>
      <Link
        href="/dashboard/newsletter"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> All campaigns
      </Link>
      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl">{saved ? "Edit campaign" : "New campaign"}</h1>
            <ProBadge />
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            A note from you. A reason to come back to class.
          </p>
        </div>
        <span role="status" className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {dirty ? (
            "Unsaved changes"
          ) : saved ? (
            <>
              <Check className="size-3.5" /> Draft saved
            </>
          ) : (
            "Not saved yet"
          )}
        </span>
      </div>

      <section aria-labelledby="template-heading" className="mt-7">
        <h2 id="template-heading" className="text-sm font-medium">
          Start with a template
        </h2>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          {newsletterTemplates.map((template) => (
            <button
              type="button"
              key={template.id}
              disabled={busy !== null}
              className="rounded-xl border border-border bg-card p-4 text-left transition-colors hover:border-clay/50 hover:bg-sand/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay disabled:opacity-50"
              onClick={() => {
                if (subject.trim() || bodyHtml.replace(/<[^>]*>/g, "").trim())
                  setReplaceTemplate(template);
                else applyTemplate(template);
              }}
            >
              <FileText className="mb-3 size-4 text-clay" />
              <span className="block text-sm font-medium">{template.name}</span>
              <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                {template.description}
              </span>
            </button>
          ))}
        </div>
      </section>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
        <fieldset disabled={busy !== null} className="surface min-w-0 space-y-6 p-5 sm:p-6">
          <legend className="sr-only">Campaign content</legend>
          <div className="space-y-2">
            <Label htmlFor="campaign-subject">Subject line</Label>
            <Input
              id="campaign-subject"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              placeholder="Your classes for the week ahead"
              maxLength={200}
            />
            <p className="text-xs text-muted-foreground">
              The first thing your students see in their inbox.
            </p>
          </div>
          <div className="space-y-2">
            <Label>Message</Label>
            <RichTextEditor
              key={editorKey}
              disabled={busy !== null}
              content={bodyHtml}
              onChange={setBodyHtml}
              placeholder="Hi everyone, here’s what’s coming up…"
            />
          </div>
          <section aria-labelledby="inserted-classes">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 id="inserted-classes" className="text-sm font-medium">
                Class cards
              </h2>
              <Button
                size="sm"
                variant="quiet"
                disabled={classIds.length >= MAX_CAMPAIGN_CLASSES || busy !== null}
                onClick={() => setPickerOpen(true)}
              >
                <Plus className="size-4" /> Insert class
              </Button>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Added below your message, with a photo, schedule, price, and booking button.
            </p>
            <div className="mt-3 space-y-2">
              {classIds.map((id) => {
                const cls = classes.find((item) => item.id === id);
                return (
                  <div
                    key={id}
                    className="flex items-center gap-3 rounded-lg border border-border p-3"
                  >
                    {cls?.coverUrl ? (
                      <img src={cls.coverUrl} alt="" className="size-12 rounded-md object-cover" />
                    ) : (
                      <span className="grid size-12 shrink-0 place-items-center rounded-md bg-sand">
                        <CalendarDays className="size-5 text-muted-foreground" />
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="break-words text-sm font-medium">
                        {cls?.name ?? "Class no longer available"}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {cls
                          ? `${formatClassDate(cls)} · ${formatClassTime(cls)} · ${money(cls.price, instructor.currency)}`
                          : "Remove this card to preview or send."}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Remove ${cls?.name ?? "unavailable class"}`}
                      onClick={() => setClassIds((ids) => ids.filter((value) => value !== id))}
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
            {!classIds.length ? (
              <p className="mt-4 rounded-lg border border-dashed border-border px-4 py-5 text-sm text-muted-foreground">
                Give students a direct way to book your next class.
              </p>
            ) : null}
          </section>
        </fieldset>
        <aside className="surface space-y-5 p-5 lg:sticky lg:top-6">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Audience</p>
            <p className="mt-2 text-3xl tabular-nums">{subscriberCount}</p>
            <p className="mt-1 text-sm text-muted-foreground">
              subscribed {subscriberCount === 1 ? "recipient" : "recipients"}
            </p>
          </div>
          <p className="border-t border-border pt-4 text-xs leading-relaxed text-muted-foreground">
            Sent individually to your subscribed audience. Each email includes an unsubscribe link.
          </p>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Class details are refreshed when you preview and send.
          </p>
          {instructor.planTier === "STARTER" ? (
            <p className="text-sm leading-relaxed">
              Prepare your draft here.{" "}
              <Link href="/dashboard/billing" className="font-medium text-clay underline">
                Upgrade to Pro
              </Link>{" "}
              to send it.
            </p>
          ) : null}
        </aside>
      </div>
      {error ? (
        <p role="alert" className="mt-4 text-sm text-destructive">
          {error}
        </p>
      ) : null}
      {unavailableIds.length ? (
        <p className="mt-4 text-sm text-destructive">
          Remove unavailable class cards before previewing or sending.
        </p>
      ) : null}
      <div className="sticky bottom-20 z-20 mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card/95 p-4 backdrop-blur lg:bottom-4">
        <Button variant="quiet" disabled={busy !== null} onClick={() => void saveDraft()}>
          {busy === "save" ? <Loader2 className="size-4 animate-spin" /> : null} Save draft
        </Button>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            disabled={busy !== null || unavailableIds.length > 0}
            onClick={() => void openPreview()}
          >
            <Eye className="size-4" />
            {busy === "preview" ? "Loading…" : "Preview email"}
          </Button>
          <Button
            variant="clay"
            disabled={busy !== null || unavailableIds.length > 0}
            onClick={() => void openPreview()}
          >
            <Send className="size-4" /> Review & send
          </Button>
        </div>
      </div>
      {leaveDialog}
      <UpgradeModal open={upgradeOpen} onOpenChange={setUpgradeOpen} feature="Newsletter sending" />
      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="max-h-[85dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Insert a class</DialogTitle>
            <DialogDescription>
              Choose up to {MAX_CAMPAIGN_CLASSES} upcoming classes. Cards appear in the order you
              select them.
            </DialogDescription>
          </DialogHeader>
          {classes.length ? (
            <div className="space-y-2">
              {classes.map((cls) => (
                <label
                  key={cls.id}
                  className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3"
                >
                  <input
                    type="checkbox"
                    className="mt-1 accent-clay"
                    checked={classIds.includes(cls.id)}
                    disabled={!classIds.includes(cls.id) && classIds.length >= MAX_CAMPAIGN_CLASSES}
                    onChange={(event) =>
                      setClassIds((ids) =>
                        event.target.checked ? [...ids, cls.id] : ids.filter((id) => id !== cls.id),
                      )
                    }
                  />
                  <span>
                    <span className="block text-sm font-medium">{cls.name}</span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      {formatClassDate(cls)} · {formatClassTime(cls)} ·{" "}
                      {money(cls.price, instructor.currency)}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          ) : (
            <p className="py-6 text-sm text-muted-foreground">
              Publish an upcoming class to add a booking card to your email.
            </p>
          )}
          <DialogFooter>
            <Button variant="clay" onClick={() => setPickerOpen(false)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog
        open={preview !== null}
        onOpenChange={(open) => {
          if (!open && !busy) setPreview(null);
        }}
      >
        <DialogContent className="flex max-h-[90dvh] w-[calc(100%-2rem)] max-w-3xl flex-col overflow-hidden rounded-xl p-0">
          <DialogHeader className="px-5 pt-6 text-left">
            <DialogTitle className="pr-6">Email preview</DialogTitle>
            <DialogDescription>{subject}</DialogDescription>
          </DialogHeader>
          <iframe
            title="Newsletter email preview"
            tabIndex={-1}
            sandbox=""
            referrerPolicy="no-referrer"
            srcDoc={preview ?? ""}
            className="min-h-0 h-[55dvh] w-full border-y border-border bg-sand"
          />
          <div className="px-5 text-xs text-muted-foreground">
            Test emails go only to {instructor.email}.
          </div>
          <DialogFooter className="gap-2 px-5 pb-5">
            <Button variant="outline" disabled={busy !== null} onClick={() => void sendTest()}>
              {busy === "test" ? "Sending test…" : "Send test to me"}
            </Button>
            <Button
              variant="clay"
              disabled={busy !== null || subscriberCount === 0}
              onClick={() => void reviewRecipients()}
            >
              {busy === "save" ? "Saving…" : "Review recipients"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <AlertDialog
        open={replaceTemplate !== null}
        onOpenChange={(open) => {
          if (!open) setReplaceTemplate(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Replace your message?</AlertDialogTitle>
            <AlertDialogDescription>
              This template replaces your subject and message. Your inserted class cards stay in
              place.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="quiet" onClick={() => setReplaceTemplate(null)}>
              Keep writing
            </Button>
            <Button
              variant="clay"
              onClick={() => {
                if (replaceTemplate) applyTemplate(replaceTemplate);
              }}
            >
              Use template
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog
        open={pending !== null}
        onOpenChange={(open) => {
          if (!open && busy !== "send") setPending(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send this campaign?</AlertDialogTitle>
            <AlertDialogDescription>
              “{subject}” will be emailed immediately to your subscribed audience ({subscriberCount}{" "}
              currently). The final recipient list is checked again when sending. This cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="quiet" disabled={busy === "send"} onClick={() => setPending(null)}>
              Keep as draft
            </Button>
            <Button variant="clay" disabled={busy === "send"} onClick={() => void sendCampaign()}>
              {busy === "send" ? (
                <>
                  <Loader2 className="size-4 animate-spin" /> Sending…
                </>
              ) : (
                "Send now"
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardShell>
  );
}
