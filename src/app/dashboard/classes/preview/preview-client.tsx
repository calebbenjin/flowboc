"use client";
import { useEffect, useState, type ComponentProps } from "react";
import { publicDesignSchema, type PublicDesignPreview } from "@/lib/public-preview";
import { z } from "zod";
import { PublicPageClient } from "@/app/[slug]/public-page-client";
import type { ClassFormDraft } from "@/components/ClassForm";
import { draftToPublicClasses } from "@/lib/class-public-preview";

const draftSchema = z.object({
  name: z.string(),
  coverUrl: z.string().nullable(),
  date: z.string(),
  time: z.string(),
  timezone: z.string(),
  price: z.number().finite(),
  originalPrice: z.number().finite().nullable(),
  description: z.string().optional(),
  durationMinutes: z.number().finite().optional(),
  online: z.boolean().optional(),
  capacity: z.number().finite().optional(),
  location: z.string().optional(),
  recurring: z.boolean().optional(),
  recurringDays: z.array(z.string()).optional(),
  horizonDays: z.number().int().min(1).max(60).optional(),
});
export function LivePreviewPage({ content }: { content: ComponentProps<typeof PublicPageClient> }) {
  const [draft, setDraft] = useState<ClassFormDraft | null>(null);
  const [design, setDesign] = useState<PublicDesignPreview | null>(null);
  const [mode, setMode] = useState("class");
  useEffect(() => {
    function receive(event: MessageEvent) {
      if (
        event.origin !== window.location.origin ||
        event.source !== window.parent ||
        event.data?.type !== "flowboc:public-preview"
      )
        return;
      setMode(event.data.mode === "design" ? "design" : "class");
      const settings = publicDesignSchema.safeParse(event.data.design);
      if (settings.success) setDesign(settings.data);
      const result = draftSchema.safeParse(event.data.draft);
      if (result.success) setDraft(result.data as ClassFormDraft);
    }
    window.addEventListener("message", receive);
    window.parent.postMessage({ type: "flowboc:public-preview-ready" }, window.location.origin);
    return () => window.removeEventListener("message", receive);
  }, []);
  const items = draft ? draftToPublicClasses(draft) : [];
  const classes = [...content.classes, ...items].sort(
    (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
  );
  return (
    <>
      {mode === "class" && items.length === 0 && (
        <p className="bg-[#f4effa] px-4 py-2 text-center text-xs leading-relaxed text-[#806c88]">
          Choose an upcoming date and time to see your new class here.
        </p>
      )}
      <div inert>
        <PublicPageClient
          {...content}
          instructor={{ ...content.instructor, ...design }}
          classes={classes}
        />
      </div>
    </>
  );
}
