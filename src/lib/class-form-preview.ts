import type { ClassFormDraft } from "@/components/ClassForm";
import type { PreviewClass } from "@/components/PublicPagePreview";
import type { CurrencyCode } from "@/lib/demo";

function formatDraftDate(dateStr: string): string | null {
  const [y, m, d] = dateStr.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatDraftTime(timeStr: string): string | null {
  const [h, min] = timeStr.split(":").map(Number);
  if (h === undefined || Number.isNaN(h)) return null;
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(min ?? 0).padStart(2, "0")} ${period}`;
}

export function draftToPreviewClass(draft: ClassFormDraft, currency: CurrencyCode): PreviewClass {
  const dateLabel = formatDraftDate(draft.date);
  const timeLabel = formatDraftTime(draft.time);
  return {
    id: "draft",
    name: draft.name || "Your class name",
    coverUrl: draft.coverUrl,
    dateLabel: dateLabel && timeLabel ? `${dateLabel} · ${timeLabel}` : "Pick a date & time",
    price: draft.price,
    originalPrice: draft.originalPrice,
    currency,
    spots: null,
  };
}
