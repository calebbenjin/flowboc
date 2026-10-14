"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import posthog from "posthog-js";
import { toast } from "sonner";
import { DashboardShell } from "@/components/DashboardShell";
import { ClassForm, type ClassFormInitial, type ClassFormDraft } from "@/components/ClassForm";
import { PublicPagePreview } from "@/components/PublicPagePreview";
import { useInstructor } from "@/components/InstructorProvider";
import { draftToPreviewClass } from "@/lib/class-form-preview";
import { utcToZonedDateTime } from "@/lib/timezone";
import type { YogaClass } from "@/generated/prisma/client";
import { updateClass, type ClassInput } from "../../actions";
import { deadlineMinutesToLabel } from "@/lib/class-deadline";

function toFormInitial(cls: YogaClass): ClassFormInitial {
  const { date, time } = utcToZonedDateTime(cls.startAt, cls.timezone);
  return {
    name: cls.name,
    type: cls.type ?? "",
    description: cls.description ?? "",
    coverUrl: cls.coverUrl,
    recurring: cls.recurringDays.length > 0,
    recurringDays: cls.recurringDays,
    date,
    time,
    timezone: cls.timezone,
    durationMinutes: cls.durationMinutes,
    online: cls.mode === "ONLINE",
    location: cls.location ?? "",
    capacity: cls.capacity,
    price: cls.price,
    originalPrice: cls.originalPrice,
    deadlineMinutesBeforeStart: cls.deadlineMinutesBeforeStart,
    cancellationPolicy: cls.cancellationPolicy ?? "",
  };
}

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
    deadlineLabel: String(formData.get("deadline") ?? deadlineMinutesToLabel(120)),
    cancellationPolicy: String(formData.get("cancellationPolicy") ?? ""),
  };
}

export function EditClassClient({ cls }: { cls: YogaClass }) {
  const router = useRouter();
  const instructor = useInstructor();
  const [pending, setPending] = useState(false);
  const [draft, setDraft] = useState<ClassFormDraft | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    setPending(true);
    try {
      const result = await updateClass(cls.id, {
        ...readClassFormData(formData),
        status: cls.status,
      });
      if (result.ok) {
        if (
          process.env["NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN"] &&
          process.env["NEXT_PUBLIC_POSTHOG_HOST"]
        ) {
          posthog.capture("class_updated", { status: cls.status.toLowerCase() });
        }
        toast.success("Class updated");
        router.push(`/dashboard/classes/${cls.id}`);
      } else {
        toast.error(result.error);
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <DashboardShell>
      <div className="mx-auto max-w-5xl lg:grid lg:grid-cols-[1fr_280px] lg:items-start lg:gap-10">
        <div className="max-w-3xl">
          <Link
            href={`/dashboard/classes/${cls.id}`}
            className="text-sm text-muted-foreground hover:text-clay"
          >
            ← Back to class
          </Link>
          <h1 className="mt-3 text-3xl">Edit class</h1>

          <ClassForm
            initial={toFormInitial(cls)}
            primaryLabel="Save changes"
            secondaryLabel="Cancel"
            pending={pending}
            onSecondary={() => router.push(`/dashboard/classes/${cls.id}`)}
            onSubmit={handleSubmit}
            onLiveChange={setDraft}
          />
        </div>

        <div className="mt-8 hidden lg:sticky lg:top-8 lg:mt-24 lg:block">
          <p className="mb-3 text-xs uppercase tracking-[0.18em] text-muted-foreground">Preview</p>
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
            classes={draft ? [draftToPreviewClass(draft, instructor.currency)] : []}
          />
        </div>
      </div>
    </DashboardShell>
  );
}
