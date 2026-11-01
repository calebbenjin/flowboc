"use client";

import { canUseProOffers } from "@/lib/offer-access";
import { newsletterButtonVisible } from "@/lib/newsletter/access";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import posthog from "posthog-js";
import { toast } from "sonner";
import { DashboardShell } from "@/components/DashboardShell";
import { FirstClassCelebration, type ClassMilestone } from "@/components/FirstClassCelebration";
import { ClassForm, type ClassFormInitial, type ClassFormDraft } from "@/components/ClassForm";
import { effectivePublicTheme } from "@/lib/public-page-theme";
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

export function EditClassClient({ cls, futureCount }: { cls: YogaClass; futureCount: number }) {
  const router = useRouter();
  const instructor = useInstructor();
  const [scope, setScope] = useState<"single" | "future">("single");
  const [milestone, setMilestone] = useState<ClassMilestone | null>(null);
  const [pending, setPending] = useState(false);
  const [draft, setDraft] = useState<ClassFormDraft | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget, (e.nativeEvent as SubmitEvent).submitter);

    setPending(true);
    try {
      const result = await updateClass(
        cls.id,
        {
          ...readClassFormData(formData),
          status:
            cls.status === "DRAFT" && formData.get("intent") !== "draft" ? "PUBLISHED" : cls.status,
        },
        scope,
      );
      if (result.ok) {
        if (
          process.env["NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN"] &&
          process.env["NEXT_PUBLIC_POSTHOG_HOST"]
        ) {
          posthog.capture("class_updated", { status: cls.status.toLowerCase() });
        }
        if (result.firstPublication) {
          const values = Object.fromEntries(
            Array.from(formData.entries()).map(([key, value]) => [key, String(value)]),
          );
          if (result.firstDate) values["date"] = result.firstDate;
          setMilestone({ values, classCount: result.classCount ?? 1 });
        } else {
          toast.success(
            cls.status === "DRAFT" && formData.get("intent") === "draft"
              ? "A lovely beginning—your draft is saved."
              : scope === "future"
                ? "Series classes updated"
                : "Class updated",
          );
          router.push(`/dashboard/classes/${cls.id}`);
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
      <div className="mx-auto max-w-5xl lg:grid lg:grid-cols-[1fr_280px] lg:items-start lg:gap-10">
        <div className="max-w-3xl">
          <Link
            href={`/dashboard/classes/${cls.id}`}
            className="text-sm text-muted-foreground hover:text-clay"
          >
            ← Back to class
          </Link>
          <h1 className="mt-3 text-3xl">Edit class</h1>

          {cls.seriesId ? (
            <fieldset className="mt-5 space-y-3 rounded-xl border border-border p-4">
              <legend className="px-1 text-sm font-medium">Apply changes to</legend>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="edit-scope"
                  checked={scope === "single"}
                  onChange={() => setScope("single")}
                />
                This class only
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="edit-scope"
                  checked={scope === "future"}
                  disabled={futureCount === 0}
                  onChange={() => setScope("future")}
                />
                This and future classes ({futureCount} dates)
              </label>
              <p className="text-xs text-muted-foreground">
                {scope === "future"
                  ? "Updates existing scheduled dates. Changing the date shifts all affected dates by the same number of days. Past and cancelled classes stay unchanged."
                  : "Other dates in this series stay unchanged."}{" "}
                Existing bookings keep their original prices. Notify booked students if you change
                their schedule.
              </p>
            </fieldset>
          ) : null}
          <ClassForm
            editScope={scope}
            affectedCount={scope === "future" ? futureCount : 1}
            initial={toFormInitial(cls)}
            primaryLabel={cls.status === "DRAFT" ? "Publish class" : "Save changes"}
            secondaryLabel={cls.status === "DRAFT" ? "Save as draft" : "Cancel"}
            secondarySubmits={cls.status === "DRAFT"}
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
              ...effectivePublicTheme(instructor),
              ebookEnabled: canUseProOffers(instructor) && instructor.ebookEnabled,
              ebookTitle: instructor.ebookTitle,
              ebookDescription: instructor.ebookDescription,
              ebookPrice: instructor.ebookPrice,
              ebookCoverUrl: instructor.ebookCoverUrl,
              name: instructor.name,
              photoUrl: instructor.photoUrl,
              themeColor: instructor.themeColor,
              newsletterEnabled: newsletterButtonVisible(instructor),
              backgroundType: instructor.backgroundType,
              backgroundImageUrl: instructor.backgroundImageUrl,
              backgroundColor: instructor.backgroundColor,
              backgroundGradientFrom: instructor.backgroundGradientFrom,
              backgroundGradientTo: instructor.backgroundGradientTo,
              pageLayout: instructor.pageLayout,
              bio: instructor.bio,
              videoCallEnabled: canUseProOffers(instructor) && instructor.videoCallEnabled,
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
