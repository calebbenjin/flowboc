"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import posthog from "posthog-js";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/RichTextEditor";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { sendNewsletterCampaign } from "./actions";

type PendingCampaign = { subject: string; bodyHtml: string };

function isBlank(html: string) {
  return html.replace(/<[^>]*>/g, "").trim().length === 0;
}

export function ComposeClient({ subscriberCount }: { subscriberCount: number }) {
  const router = useRouter();
  const [bodyHtml, setBodyHtml] = useState("");
  const [pending, setPending] = useState<PendingCampaign | null>(null);
  const [sending, setSending] = useState(false);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const subject = String(formData.get("subject") ?? "").trim();
    if (!subject) return;
    if (isBlank(bodyHtml)) {
      toast.error("Please enter a message.");
      return;
    }
    setPending({ subject, bodyHtml });
  }

  async function handleSend() {
    if (!pending) return;
    setSending(true);
    try {
      const result = await sendNewsletterCampaign(pending);
      if (result.ok) {
        if (
          process.env["NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN"] &&
          process.env["NEXT_PUBLIC_POSTHOG_HOST"]
        ) {
          posthog.capture("newsletter_campaign_sent", { recipient_count: result.sent });
        }
        toast.success(`Campaign sent to ${result.sent} recipient${result.sent === 1 ? "" : "s"}`);
        router.push("/dashboard/newsletter");
      } else {
        toast.error(result.error);
      }
    } finally {
      setSending(false);
      setPending(null);
    }
  }

  return (
    <DashboardShell>
      <div>
        <h1 className="text-3xl">New campaign</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Goes to every student who&apos;s booked with you, plus anyone who&apos;s signed up
          separately — {subscriberCount} {subscriberCount === 1 ? "person" : "people"} right now.
        </p>
      </div>

      <form className="surface mt-6 flex flex-col gap-4 p-6" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="subject">Subject</Label>
          <Input
            id="subject"
            name="subject"
            required
            placeholder="New classes this week"
            maxLength={200}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="body">Message</Label>
          <RichTextEditor
            content={bodyHtml}
            onChange={setBodyHtml}
            placeholder="Hi everyone, here's what's new..."
          />
        </div>
        <div className="flex justify-end">
          <Button type="submit" variant="clay" disabled={subscriberCount === 0}>
            Send campaign
          </Button>
        </div>
      </form>

      <AlertDialog open={pending !== null} onOpenChange={(open) => !open && setPending(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send this campaign?</AlertDialogTitle>
            <AlertDialogDescription>
              This will email {subscriberCount} recipient{subscriberCount === 1 ? "" : "s"}{" "}
              immediately. This can&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => setPending(null)}>
              Never mind
            </Button>
            <Button variant="clay" disabled={sending} onClick={() => void handleSend()}>
              {sending ? <Loader2 className="size-4 animate-spin" /> : null}
              Send now
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardShell>
  );
}
