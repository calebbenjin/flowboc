import type { ClassFormDraft } from "@/components/ClassForm";
import type { PublicClass } from "@/lib/public-page-layout";
import { recurringDates, buildRecurringLabel } from "./class-schedule.ts";
import { zonedDateTimeToUtc } from "./timezone.ts";

export function draftToPublicClasses(draft: ClassFormDraft, now = new Date()): PublicClass[] {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(draft.date) || !/^\d{2}:\d{2}$/.test(draft.time)) return [];
  try {
    const dates = draft.recurring
      ? recurringDates(draft.date, draft.recurringDays ?? [], draft.horizonDays ?? 30)
      : [draft.date];
    return dates
      .map<PublicClass>((date, index) => ({
        id: `preview-draft-${index}`,
        seriesId: draft.recurring ? "preview-draft-series" : null,
        recurringLabel: draft.recurring ? buildRecurringLabel(draft.recurringDays ?? []) : null,
        name: draft.name || "Your class name",
        coverUrl: draft.coverUrl,
        description: draft.description ?? null,
        startAt: zonedDateTimeToUtc(date, draft.time, draft.timezone),
        timezone: draft.timezone,
        durationMinutes: draft.durationMinutes ?? 60,
        mode: draft.online ? "ONLINE" : "IN_PERSON",
        location: draft.location ?? null,
        price: draft.price,
        originalPrice: draft.originalPrice,
        capacity: draft.capacity ?? 12,
        spots: draft.capacity ?? 12,
      }))
      .filter((cls) => Number.isFinite(cls.startAt.getTime()) && cls.startAt >= now);
  } catch {
    return [];
  }
}
