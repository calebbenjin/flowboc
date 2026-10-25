"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";
import { toast } from "sonner";
import { compressImage } from "@/lib/compress-image";
import { Check, ImagePlus, Loader2, X } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import { useInstructor } from "@/components/InstructorProvider";
import { PublicPagePreview } from "@/components/PublicPagePreview";
import { ProBadge, UpgradeModal } from "@/components/ProGate";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { BackgroundType, PageLayout } from "@/generated/prisma/enums";
import { updateDesign } from "./actions";

const THEME_PRESETS = [
  { label: "Indigo", value: "#6355ff" },
  { label: "Forest", value: "#16a34a" },
  { label: "Clay", value: "#c2622d" },
  { label: "Sunset", value: "#ea580c" },
  { label: "Rose", value: "#dc2626" },
  { label: "Teal", value: "#0891b2" },
  { label: "Orchid", value: "#d946ef" },
  { label: "Charcoal", value: "#111827" },
];

const BACKGROUND_TYPE_OPTIONS: { value: BackgroundType; label: string }[] = [
  { value: "IMAGE", label: "Image" },
  { value: "COLOR", label: "Solid" },
  { value: "GRADIENT", label: "Gradient" },
];

const GRADIENT_PRESETS: { label: string; from: string; to: string }[] = [
  { label: "Sunset", from: "#f97316", to: "#db2777" },
  { label: "Ocean", from: "#0891b2", to: "#4338ca" },
  { label: "Forest", from: "#16a34a", to: "#065f46" },
  { label: "Dusk", from: "#6355ff", to: "#111827" },
];

const LAYOUT_OPTIONS: { value: PageLayout; label: string; body: string }[] = [
  { value: "CLASSIC", label: "Classic", body: "Photo beside details, the current default." },
  { value: "COMPACT", label: "Compact", body: "Dense text rows — no photos needed." },
  { value: "COVER_GRID", label: "Cover grid", body: "Big photo-forward cards in a grid." },
];

function LayoutIcon({ layout }: { layout: PageLayout }) {
  if (layout === "COMPACT") {
    return (
      <div className="space-y-1">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-2 rounded-sm bg-border" />
        ))}
      </div>
    );
  }
  if (layout === "COVER_GRID") {
    return (
      <div className="grid grid-cols-2 gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="aspect-square h-5 w-full rounded-xs bg-border" />
        ))}
      </div>
    );
  }
  return (
    <div className="space-y-1.5">
      {[0, 1].map((i) => (
        <div key={i} className="flex gap-1.5">
          <div className="size-4 shrink-0 rounded-sm bg-border" />
          <div className="flex-1 space-y-1 pt-0.5">
            <div className="h-1.5 w-3/4 rounded-sm bg-border" />
            <div className="h-1.5 w-1/2 rounded-sm bg-border" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Shared by the solid-color and gradient pickers below — a labeled swatch
// grid plus a native color input for anything off the presets, same visual
// pattern as the theme color picker above it.
function ColorSwatchPicker({
  value,
  onChange,
  presets,
}: {
  value: string;
  onChange: (hex: string) => void;
  presets: { label: string; value: string }[];
}) {
  return (
    <div className="flex flex-wrap gap-3">
      {presets.map((preset) => (
        <button
          key={preset.value}
          type="button"
          aria-label={preset.label}
          onClick={() => onChange(preset.value)}
          className={cn(
            "grid size-10 place-items-center rounded-full border-2 transition-transform hover:scale-105",
            value.toLowerCase() === preset.value.toLowerCase()
              ? "border-foreground"
              : "border-transparent",
          )}
          style={{ backgroundColor: preset.value }}
        >
          {value.toLowerCase() === preset.value.toLowerCase() && (
            <Check className="size-4 text-white" />
          )}
        </button>
      ))}
      <label className="relative grid size-10 cursor-pointer place-items-center rounded-full border border-dashed border-border text-muted-foreground">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 size-full cursor-pointer opacity-0"
        />
        <span className="text-[0.6rem]">Custom</span>
      </label>
    </div>
  );
}

export function DesignClient() {
  const router = useRouter();
  const instructor = useInstructor();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [themeColor, setThemeColor] = useState(instructor.themeColor);
  const [backgroundType, setBackgroundType] = useState<BackgroundType>(instructor.backgroundType);
  const [backgroundImageUrl, setBackgroundImageUrl] = useState<string | null>(
    instructor.backgroundImageUrl,
  );
  const [backgroundColor, setBackgroundColor] = useState(instructor.backgroundColor ?? "#6355ff");
  const [backgroundGradientFrom, setBackgroundGradientFrom] = useState(
    instructor.backgroundGradientFrom ?? GRADIENT_PRESETS[0]!.from,
  );
  const [backgroundGradientTo, setBackgroundGradientTo] = useState(
    instructor.backgroundGradientTo ?? GRADIENT_PRESETS[0]!.to,
  );
  const [pageLayout, setPageLayout] = useState<PageLayout>(instructor.pageLayout);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [saving, setSaving] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const isStarter = instructor.planTier === "STARTER";

  async function handleBackgroundFile(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      return;
    }
    setUploading(true);
    try {
      const compressed = await compressImage(file, { maxDimension: 1920 });
      const blob = await upload(compressed.name, compressed, {
        access: "public",
        handleUploadUrl: "/api/upload",
      });
      setBackgroundImageUrl(blob.url);
    } catch {
      toast.error("Couldn't upload image. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    if (isStarter) {
      setUpgradeOpen(true);
      return;
    }
    setSaving(true);
    try {
      const result = await updateDesign({
        themeColor,
        pageLayout,
        backgroundType,
        backgroundImageUrl,
        backgroundColor,
        backgroundGradientFrom,
        backgroundGradientTo,
      });
      if (result.ok) {
        toast.success("Page design updated");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <DashboardShell>
      <div className="max-w-5xl">
        <h1 className="text-3xl">Page design</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Customize the theme color, background and layout of your public booking page.
        </p>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_280px] lg:items-start">
          <div className="space-y-6">
            <section className="surface space-y-4 p-6">
              <h2 className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Theme color
              </h2>
              <ColorSwatchPicker
                value={themeColor}
                onChange={setThemeColor}
                presets={THEME_PRESETS}
              />
            </section>

            <section className="surface space-y-4 p-6">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                  Background
                </h2>
                <div className="flex rounded-lg border border-border p-0.5">
                  {BACKGROUND_TYPE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setBackgroundType(opt.value)}
                      className={cn(
                        "rounded-md px-3 py-1 text-xs font-medium transition-colors",
                        backgroundType === opt.value
                          ? "bg-clay text-clay-foreground"
                          : "text-muted-foreground hover:bg-accent",
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {backgroundType === "IMAGE" && (
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => fileInputRef.current?.click()}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click();
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragActive(true);
                  }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragActive(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) void handleBackgroundFile(file);
                  }}
                  className={cn(
                    "relative flex h-28 cursor-pointer items-center gap-4 overflow-hidden rounded-lg border border-dashed border-border text-sm text-muted-foreground transition-colors hover:bg-primary/10",
                    dragActive && "border-clay bg-clay/5",
                    backgroundImageUrl ? "justify-start p-3" : "justify-center",
                  )}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      e.target.value = "";
                      if (file) void handleBackgroundFile(file);
                    }}
                  />
                  {uploading ? (
                    <Loader2 className="size-5 animate-spin" />
                  ) : backgroundImageUrl ? (
                    <>
                      <img
                        src={backgroundImageUrl}
                        alt=""
                        className="h-20 w-20 shrink-0 rounded-lg object-cover"
                      />
                      <span>Drop an image or click to replace</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label="Remove background image"
                        className="absolute right-2 top-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          setBackgroundImageUrl(null);
                        }}
                      >
                        <X className="size-4" />
                      </Button>
                    </>
                  ) : (
                    <span className="flex items-center gap-2">
                      <ImagePlus className="size-4" />
                      Drop an image or click to upload
                    </span>
                  )}
                </div>
              )}

              {backgroundType === "COLOR" && (
                <ColorSwatchPicker
                  value={backgroundColor}
                  onChange={setBackgroundColor}
                  presets={THEME_PRESETS}
                />
              )}

              {backgroundType === "GRADIENT" && (
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-3">
                    {GRADIENT_PRESETS.map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        aria-label={preset.label}
                        onClick={() => {
                          setBackgroundGradientFrom(preset.from);
                          setBackgroundGradientTo(preset.to);
                        }}
                        className={cn(
                          "grid size-10 place-items-center rounded-full border-2 transition-transform hover:scale-105",
                          backgroundGradientFrom.toLowerCase() === preset.from.toLowerCase() &&
                            backgroundGradientTo.toLowerCase() === preset.to.toLowerCase()
                            ? "border-foreground"
                            : "border-transparent",
                        )}
                        style={{
                          backgroundImage: `linear-gradient(135deg, ${preset.from}, ${preset.to})`,
                        }}
                      />
                    ))}
                    <div
                      className="h-10 w-16 shrink-0 rounded-lg"
                      style={{
                        backgroundImage: `linear-gradient(135deg, ${backgroundGradientFrom}, ${backgroundGradientTo})`,
                      }}
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="gradient-from" className="text-xs text-muted-foreground">
                        From
                      </Label>
                      <div className="flex items-center gap-2">
                        <input
                          id="gradient-from"
                          type="color"
                          value={backgroundGradientFrom}
                          onChange={(e) => setBackgroundGradientFrom(e.target.value)}
                          className="size-8 cursor-pointer rounded border border-border"
                        />
                        <span className="text-sm text-muted-foreground">
                          {backgroundGradientFrom}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="gradient-to" className="text-xs text-muted-foreground">
                        To
                      </Label>
                      <div className="flex items-center gap-2">
                        <input
                          id="gradient-to"
                          type="color"
                          value={backgroundGradientTo}
                          onChange={(e) => setBackgroundGradientTo(e.target.value)}
                          className="size-8 cursor-pointer rounded border border-border"
                        />
                        <span className="text-sm text-muted-foreground">
                          {backgroundGradientTo}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </section>

            <section className="surface space-y-4 p-6">
              <h2 className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Page layout
              </h2>
              <div className="grid gap-3 sm:grid-cols-3">
                {LAYOUT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setPageLayout(opt.value)}
                    className={cn(
                      "rounded-xl border p-4 text-left transition-colors",
                      pageLayout === opt.value
                        ? "border-clay bg-clay/5"
                        : "border-border hover:bg-accent",
                    )}
                  >
                    <div className="h-14 rounded-md bg-sand/60 p-2">
                      <LayoutIcon layout={opt.value} />
                    </div>
                    <p className="mt-3 flex items-center gap-1.5 text-sm font-medium">
                      {opt.label}
                      {pageLayout === opt.value && <Check className="size-3.5 text-clay" />}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">{opt.body}</p>
                  </button>
                ))}
              </div>
            </section>

            <div className="flex items-center justify-end gap-3">
              {isStarter && <ProBadge />}
              <Button variant="clay" size="lg" onClick={() => void handleSave()} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Saving…
                  </>
                ) : (
                  "Save changes"
                )}
              </Button>
            </div>
            <UpgradeModal
              open={upgradeOpen}
              onOpenChange={setUpgradeOpen}
              feature="Custom page design"
            />
          </div>

          <div className="lg:sticky lg:top-8">
            <Label className="mb-3 block text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Preview
            </Label>
            <PublicPagePreview
              size="md"
              instructor={{
                name: instructor.name,
                photoUrl: instructor.photoUrl,
                themeColor,
                backgroundType,
                backgroundImageUrl,
                backgroundColor,
                backgroundGradientFrom,
                backgroundGradientTo,
                pageLayout,
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
              classes={[]}
            />
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
