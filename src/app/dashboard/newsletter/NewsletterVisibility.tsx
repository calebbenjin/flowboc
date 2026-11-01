"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useInstructor } from "@/components/InstructorProvider";
import { ProBadge } from "@/components/ProGate";
import { canUseNewsletter } from "@/lib/newsletter/access";
import { Switch } from "@/components/ui/switch";
import { setNewsletterVisibility } from "./actions";

export function NewsletterVisibility() {
  const instructor = useInstructor();
  const router = useRouter();
  const eligible = canUseNewsletter(instructor);
  const [visible, setVisible] = useState(instructor.newsletterEnabled ?? true);
  const [pending, setPending] = useState(false);
  const saving = useRef(false);
  useEffect(() => {
    setVisible(instructor.newsletterEnabled ?? true);
  }, [instructor.newsletterEnabled]);

  async function toggle(next: boolean) {
    if (saving.current || !eligible) return;
    saving.current = true;
    const previous = visible;
    setVisible(next);
    setPending(true);
    try {
      const result = await setNewsletterVisibility(next);
      if (!result.ok) {
        setVisible(previous);
        toast.error(result.error);
        return;
      }
      toast.success(
        next
          ? "Newsletter button is visible on your page."
          : "Newsletter button is hidden from your page.",
      );
      router.refresh();
    } catch {
      setVisible(previous);
      toast.error("Couldn’t save this setting. Please try again.");
    } finally {
      setPending(false);
      saving.current = false;
    }
  }

  return (
    <section
      className="mt-6 rounded-2xl border border-[#e0d8ed] bg-[#faf7ff] p-5 sm:p-6"
      aria-labelledby="newsletter-visibility-title"
      aria-busy={pending}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <span className="mt-1 grid size-10 shrink-0 place-items-center rounded-xl bg-[#eeebff] text-[#6355ff]">
            <Mail className="size-5" aria-hidden="true" />
          </span>
          <div>
            <h2 id="newsletter-visibility-title" className="text-sm font-medium text-[#30293e]">
              Show newsletter button on my public page <ProBadge />
            </h2>
            <p
              id="newsletter-visibility-description"
              className="mt-2 max-w-lg text-xs leading-relaxed text-[#756782]"
            >
              Let visitors join your newsletter from your public page. Hiding the button keeps your
              subscribers and booking email opt-ins intact.
            </p>
          </div>
        </div>
        <div className="flex min-h-11 shrink-0 items-center">
          <Switch
            checked={eligible && visible}
            disabled={pending || !eligible}
            onCheckedChange={(next) => void toggle(next)}
            aria-labelledby="newsletter-visibility-title"
            aria-describedby="newsletter-visibility-description"
          />
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-[#756782]">
        <p role="status" className="flex items-center gap-2">
          {pending && <Loader2 className="size-3 animate-spin" aria-hidden="true" />}
          {!eligible
            ? "Available with an active Pro plan"
            : pending
              ? "Saving…"
              : visible
                ? "Visible on your public page"
                : "Hidden from your public page"}
        </p>
        {!eligible && (
          <Link
            href="/dashboard/billing"
            className="inline-flex min-h-11 items-center font-medium text-[#6355ff]"
          >
            Explore Pro →
          </Link>
        )}
        <Link
          href={`/${instructor.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center font-medium text-[#6355ff] underline-offset-4 hover:underline"
        >
          View my public page ↗
        </Link>
      </div>
    </section>
  );
}
