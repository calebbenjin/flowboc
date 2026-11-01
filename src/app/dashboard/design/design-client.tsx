"use client";

import { canUseProOffers } from "@/lib/offer-access";
import { newsletterButtonVisible } from "@/lib/newsletter/access";
import Image from "next/image";
import {
  PUBLIC_FONT_OPTIONS,
  SAGE_PREVIEW,
  SAGE_COVER,
  type PublicPageTemplate,
  type PublicPageFont,
} from "@/lib/public-page-theme";
import type { PreviewClass } from "@/components/PublicPagePreview";
import { Fragment, useRef, useState } from "react";
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

export function DesignClient({
  embedded = false,
  classes = [],
}: {
  embedded?: boolean;
  classes?: PreviewClass[];
}) {
  const Wrapper = embedded ? Fragment : DashboardShell;
  const router = useRouter();
  const instructor = useInstructor();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [pageTemplate, setPageTemplate] = useState<PublicPageTemplate>(
    instructor.pageTemplate === "SAGE" ? "SAGE" : "STANDARD",
  );
  const [pageFont, setPageFont] = useState<PublicPageFont>(
    PUBLIC_FONT_OPTIONS.some((font) => font.value === instructor.pageFont)
      ? (instructor.pageFont as PublicPageFont)
      : "EDITORIAL",
  );
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(instructor.coverImageUrl);

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

  async function handleBackgroundFile(file: File, target: "background" | "cover" = "background") {
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
      if (target === "cover") setCoverImageUrl(blob.url);
      else setBackgroundImageUrl(blob.url);
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
        pageTemplate,
        pageFont,
        coverImageUrl,
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
    } catch {
      toast.error("Could not save your design. Your changes are still here; please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Wrapper>
      <div className="max-w-5xl">
        <h2 className="text-xl">Appearance</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Customize the theme color, background and layout of your public booking page.
        </p>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_280px] lg:items-start">
          <div className="space-y-6">
            <section className="surface space-y-4 p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg">Page template</h3>
                <ProBadge />
              </div>
              <p className="text-sm text-muted-foreground">
                Choose the look of your booking page. Preview before publishing.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  aria-pressed={pageTemplate === "STANDARD"}
                  onClick={() => setPageTemplate("STANDARD")}
                  className={cn(
                    "overflow-hidden rounded-xl border-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay",
                    pageTemplate === "STANDARD" ? "border-clay" : "border-border",
                  )}
                >
                  <div className="flex h-60 flex-col items-center gap-3 bg-sand px-5 pt-8">
                    <div className="size-12 rounded-full bg-border" />
                    <span className="text-sm font-medium">Your booking page</span>
                    {[1, 2, 3].map((value) => (
                      <div
                        key={value}
                        className="h-9 w-full rounded-lg border border-border bg-white"
                      />
                    ))}
                  </div>
                  <div className="p-3">
                    <p className="flex items-center justify-between text-sm font-medium">
                      Current layout
                      {pageTemplate === "STANDARD" ? <Check className="size-4 text-clay" /> : null}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">Keep your existing design.</p>
                  </div>
                </button>
                <button
                  type="button"
                  aria-pressed={pageTemplate === "SAGE"}
                  onClick={() => {
                    if (pageTemplate !== "SAGE") setThemeColor("#3e4935");
                    setPageTemplate("SAGE");
                  }}
                  className={cn(
                    "overflow-hidden rounded-xl border-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay",
                    pageTemplate === "SAGE" ? "border-clay" : "border-border",
                  )}
                >
                  <div className="relative h-60 overflow-hidden bg-[#e7ebdf]">
                    <Image
                      src={SAGE_PREVIEW}
                      alt="Sage template with botanical cover, overlapping portrait, and ivory booking cards"
                      width={913}
                      height={1723}
                      sizes="(max-width: 640px) 45vw, 230px"
                      className="h-full w-full object-contain p-2"
                    />
                  </div>
                  <div className="p-3">
                    <p className="flex items-center justify-between text-sm font-medium">
                      Sage <ProBadge />
                      {pageTemplate === "SAGE" ? <Check className="size-4 text-clay" /> : null}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Botanical, warm, and personal.
                    </p>
                  </div>
                </button>
              </div>
            </section>
            <section className="surface space-y-4 p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg">Typography</h3>
                <ProBadge />
              </div>
              <div className="space-y-2">
                {PUBLIC_FONT_OPTIONS.map((font) => (
                  <button
                    type="button"
                    key={font.value}
                    aria-pressed={pageFont === font.value}
                    onClick={() => setPageFont(font.value)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-lg border p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clay",
                      pageFont === font.value ? "border-clay bg-clay/5" : "border-border",
                    )}
                  >
                    <span>
                      <span className="block text-2xl" style={{ fontFamily: font.heading }}>
                        {font.label}
                      </span>
                      <span className="mt-1 block text-xs text-muted-foreground">
                        {font.description}
                      </span>
                    </span>
                    {pageFont === font.value ? <Check className="size-4 text-clay" /> : null}
                  </button>
                ))}
              </div>
            </section>
            {pageTemplate === "SAGE" ? (
              <section className="surface space-y-4 p-6">
                <h3 className="text-lg">Cover banner</h3>
                <img
                  src={coverImageUrl || SAGE_COVER}
                  alt="Your Sage cover banner"
                  className="aspect-[3/1] w-full rounded-lg object-cover"
                />
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    event.target.value = "";
                    if (file) void handleBackgroundFile(file, "cover");
                  }}
                />
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="quiet"
                    disabled={uploading}
                    onClick={() => coverInputRef.current?.click()}
                  >
                    {uploading ? "Uploading…" : "Upload cover"}
                  </Button>
                  {coverImageUrl ? (
                    <Button variant="ghost" onClick={() => setCoverImageUrl(null)}>
                      Use botanical cover
                    </Button>
                  ) : null}
                </div>
                <p className="text-xs text-muted-foreground">
                  Your profile photo and content come from your account. Content order is managed in
                  Content and links.
                </p>
              </section>
            ) : null}
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

              {pageTemplate === "SAGE" ? (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs text-muted-foreground">
                    Applies behind your profile and cards. Your cover banner stays separate.
                  </p>
                  <Button
                    variant="quiet"
                    size="sm"
                    onClick={() => {
                      setBackgroundType("IMAGE");
                      setBackgroundImageUrl(null);
                    }}
                  >
                    Use Sage background
                  </Button>
                </div>
              ) : null}
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

            {pageTemplate === "STANDARD" ? (
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
            ) : null}

            <div className="flex items-center justify-end gap-3">
              {isStarter && <ProBadge />}
              <Button
                variant="clay"
                size="lg"
                onClick={() => void handleSave()}
                disabled={saving || uploading}
              >
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
              showSampleClasses={false}
              size="md"
              instructor={{
                pageTemplate,
                pageFont,
                coverImageUrl,
                ebookEnabled: canUseProOffers(instructor) && instructor.ebookEnabled,
                ebookTitle: instructor.ebookTitle,
                ebookDescription: instructor.ebookDescription,
                ebookPrice: instructor.ebookPrice,
                ebookCoverUrl: instructor.ebookCoverUrl,
                name: instructor.name,
                photoUrl: instructor.photoUrl,
                themeColor,
                newsletterEnabled: newsletterButtonVisible(instructor),
                backgroundType,
                backgroundImageUrl,
                backgroundColor,
                backgroundGradientFrom,
                backgroundGradientTo,
                pageLayout,
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
              classes={classes}
            />
          </div>
        </div>
      </div>
    </Wrapper>
  );
}
