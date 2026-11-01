"use client";
import type { ClassFormDraft } from "@/components/ClassForm";
import { PublicPageLivePreview } from "@/components/PublicPageLivePreview";
export function ClassPublicPagePreview({ draft }: { draft: ClassFormDraft | null }) {
  return <PublicPageLivePreview draft={draft} />;
}
