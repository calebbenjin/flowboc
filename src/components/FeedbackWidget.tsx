"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, MessageCircleHeart } from "lucide-react";
import { submitFeedback } from "@/app/dashboard/actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Deliberately just one free-text field — no name/email/subject like the
// public contact form, since the instructor is already authenticated and
// this is meant to be a low-friction "say the thing" tab, not a form.
export function FeedbackWidget() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit() {
    setPending(true);
    try {
      const result = await submitFeedback(message);
      if (result.ok) {
        toast.success("Thanks — we read every one of these!");
        setMessage("");
        setOpen(false);
      } else {
        toast.error(result.error);
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Send feedback"
        className="fixed right-0 top-1/2 z-40 flex -translate-y-1/2 items-center gap-1.5 rounded-l-lg bg-clay px-2 py-3 text-xs font-medium text-clay-foreground shadow-soft transition-transform hover:-translate-x-0.5 [writing-mode:vertical-rl]"
      >
        <MessageCircleHeart className="size-4 rotate-90" />
        Feedback
      </button>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setMessage("");
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Got a feature idea or found a bug?</DialogTitle>
            <DialogDescription>
              Tell us about a feature you&apos;d love to see, or a bug you ran into — we read every
              message.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            autoFocus
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="I'd love it if…"
          />
          <div className="flex justify-end">
            <Button
              variant="clay"
              disabled={pending || !message.trim()}
              onClick={() => void handleSubmit()}
            >
              {pending ? <Loader2 className="size-4 animate-spin" /> : "Send feedback"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
