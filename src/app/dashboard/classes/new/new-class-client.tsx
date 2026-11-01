"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import posthog from "posthog-js";
import { toast } from "sonner";
import { DashboardShell } from "@/components/DashboardShell";
import { FirstClassCelebration, type ClassMilestone } from "@/components/FirstClassCelebration";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ClassPublicPagePreview } from "@/components/ClassPublicPagePreview";
import { ClassForm, type ClassFormDraft } from "@/components/ClassForm";
import { createClass, type ClassInput } from "../actions";

function readClassFormData(formData: FormData): Omit<ClassInput, "status"> {
  const num = (key: string, fallback = 0) => {
    const raw = formData.get(key);
    const n = raw ? Number(raw) : NaN;
    return Number.isFinite(n) ? n : fallback;
  };
  const optionalNum = (key: string) => {
    const raw = formData.get(key);
    if (!raw) return null;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  };

  return {
    name: String(formData.get("name") ?? ""),
    type: String(formData.get("type") ?? ""),
    description: String(formData.get("description") ?? ""),
    coverUrl: String(formData.get("coverUrl") ?? "").trim() || null,
    recurring: formData.get("recurring") === "true",
    recurringDays: String(formData.get("recurringDays") ?? "")
      .split(",")
      .filter(Boolean),
    horizonDays: num("horizonDays", 30),
    date: String(formData.get("date") ?? ""),
    time: String(formData.get("time") ?? ""),
    timezone: String(formData.get("timezone") ?? "Africa/Lagos"),
    durationMinutes: num("durationMinutes", 60),
    online: formData.get("online") === "true",
    location: String(formData.get("location") ?? ""),
    capacity: num("capacity", 12),
    price: num("price", 0),
    originalPrice: optionalNum("originalPrice"),
    deadlineLabel: String(formData.get("deadline") ?? "2 hours before start"),
    cancellationPolicy: String(formData.get("cancellationPolicy") ?? ""),
  };
}

export function NewClassClient() {
  const router = useRouter();
  const [milestone, setMilestone] = useState<ClassMilestone | null>(null);
  const [pending, setPending] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [draft, setDraft] = useState<ClassFormDraft | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget, (e.nativeEvent as SubmitEvent).submitter);
    const intent = String(formData.get("intent") ?? "publish");

    setPending(true);
    try {
      const result = await createClass({
        ...readClassFormData(formData),
        status: intent === "draft" ? "DRAFT" : "PUBLISHED",
      });
      if (result.ok) {
        if (
          process.env["NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN"] &&
          process.env["NEXT_PUBLIC_POSTHOG_HOST"]
        ) {
          posthog.capture("class_created", { status: intent === "draft" ? "draft" : "published" });
        }
        if (intent !== "draft" && result.firstPublication) {
          const values = Object.fromEntries(
            Array.from(formData.entries()).map(([key, value]) => [key, String(value)]),
          );
          if (result.firstDate) values["date"] = result.firstDate;
          setMilestone({ values, classCount: result.classCount ?? 1 });
        } else {
          toast.success(
            intent === "draft" ? "A lovely beginning—your draft is saved." : "Class published",
          );
          router.push("/dashboard/classes");
        }
        return true;
      } else {
        toast.error(result.error);
        return false;
      }
    } catch {
      toast.error("Could not save the class. Your changes are still here; please try again.");
      return false;
    } finally {
      setPending(false);
    }
  }

  if (milestone)
    return (
      <DashboardShell>
        <FirstClassCelebration milestone={milestone} />
      </DashboardShell>
    );

  return (
    <DashboardShell>
      <div className="mx-auto max-w-5xl lg:grid lg:grid-cols-[minmax(0,1fr)_350px] lg:items-start lg:gap-10">
        <div className="max-w-3xl">
          <Link href="/dashboard/classes" className="text-sm text-muted-foreground hover:text-clay">
            ← Back to classes
          </Link>
          <h1 className="mt-3 text-3xl">Create a class</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            From an intention to an invitation. We’ll take it one step at a time.
          </p>

          <button
            type="button"
            className="mt-4 min-h-11 rounded-xl border border-[#e0d5ed] px-4 text-sm text-[#6355ff] lg:hidden"
            aria-haspopup="dialog"
            onClick={() => setPreviewOpen((value) => !value)}
          >
            Preview my public page
          </button>
          <ClassForm
            guided
            primaryLabel="Publish class"
            secondaryLabel="Save as draft"
            secondarySubmits
            pending={pending}
            onSubmit={handleSubmit}
            onLiveChange={setDraft}
          />
        </div>

        <aside id="class-live-preview" className="hidden mt-8 lg:sticky lg:top-6 lg:mt-24 lg:block">
          <p className="mb-3 text-xs text-muted-foreground">Live public-page preview</p>
          <ClassPublicPagePreview draft={draft} />
        </aside>
      </div>
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-h-[95dvh] w-[calc(100%-1rem)] overflow-y-auto rounded-2xl p-4 sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Your public page</DialogTitle>
            <DialogDescription>
              Preview your latest class details in your public-page design.
            </DialogDescription>
          </DialogHeader>
          <ClassPublicPagePreview draft={draft} />
        </DialogContent>
      </Dialog>
    </DashboardShell>
  );
}
