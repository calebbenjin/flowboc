"use client";

import {
  PUBLIC_FONT_OPTIONS,
  canUseProDesign,
  effectivePublicTheme,
  SAGE_COVER,
  type PublicPageTemplate,
  type PublicPageFont,
} from "@/lib/public-page-theme";
import { Fragment, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";
import { toast } from "sonner";
import { compressImage } from "@/lib/compress-image";
import { Check, ImagePlus, Loader2, X, Flower2, Leaf, ArrowUpRight, Eye } from "lucide-react";
import { DashboardShell } from "@/components/DashboardShell";
import { useInstructor } from "@/components/InstructorProvider";
import { PublicPageLivePreview } from "@/components/PublicPageLivePreview";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";
import type { PublicDesignPreview } from "@/lib/public-preview";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import styles from "./design.module.css";
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
          aria-pressed={value.toLowerCase() === preset.value.toLowerCase()}
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

export function DesignClient({ embedded = false }: { embedded?: boolean }) {
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
  const isStarter = !canUseProDesign(instructor);
  const [previewOpen, setPreviewOpen] = useState(false);
  const designSettings: PublicDesignPreview = useMemo(
    () => ({
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
    }),
    [
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
    ],
  );
  const [savedDesign, setSavedDesign] = useState(() => JSON.stringify(designSettings));
  const hasChanges = JSON.stringify(designSettings) !== savedDesign;
  const { dialog: leaveDialog } = useUnsavedChanges(
    hasChanges,
    "Your page design has unsaved changes. Stay to save it, or discard your changes and leave.",
  );
  const liveTemplate = effectivePublicTheme(instructor).pageTemplate;

  async function handleBackgroundFile(file: File, target: "background" | "cover" = "background") {
    if (isStarter) {
      setUpgradeOpen(true);
      return;
    }
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
        setSavedDesign(JSON.stringify(designSettings));
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
      <div className={styles["studio"]}>
        <div className={styles["studioHeader"]}>
          <div>
            <span className={styles["eyebrow"]}>
              <Flower2 size={15} strokeWidth={1.4} /> Your page studio
            </span>
            <h2>Make it feel like you.</h2>
            <p>Start with a template, then add your own rhythm, colour, and character.</p>
          </div>
          <button
            type="button"
            className={styles["mobilePreview"]}
            onClick={() => setPreviewOpen(true)}
          >
            <Eye size={16} /> Preview page
          </button>
        </div>
        {isStarter && (
          <div className={styles["proNote"]}>
            <Leaf size={19} strokeWidth={1.4} />
            <p>
              Explore every style here. <strong>Pro lets you publish your own design.</strong>
            </p>
            <button onClick={() => setUpgradeOpen(true)}>
              Discover Pro <ArrowUpRight size={15} />
            </button>
          </div>
        )}
        <div className={styles["workspace"]}>
          <div className={styles["controls"]}>
            <section className={styles["templateSection"]} aria-labelledby="template-heading">
              <div className={styles["sectionHeading"]}>
                <span>01 · Your foundation</span>
                <h3 id="template-heading">Choose your canvas</h3>
                <p>
                  Two ways to welcome your students. Select a template to explore it with your own
                  content.
                </p>
              </div>
              <div className={styles["templates"]}>
                {(
                  [
                    {
                      value: "STANDARD",
                      name: "Standard",
                      tag: "Starter template",
                      body: "Clean, familiar, and easy to browse.",
                      features: "Flexible class layouts · simple profile",
                    },
                    {
                      value: "SAGE",
                      name: "Sage",
                      tag: "Pro template",
                      body: "A softer home for your teaching.",
                      features: "Botanical cover · portrait profile",
                    },
                  ] as const
                ).map((template) => (
                  <article
                    key={template.value}
                    className={styles["template"]}
                    data-selected={pageTemplate === template.value}
                  >
                    <div className={styles["templateArt"]} aria-hidden="true">
                      <PublicPageLivePreview
                        thumbnail
                        design={{ ...designSettings, pageTemplate: template.value }}
                      />
                    </div>
                    <div className={styles["templateCopy"]}>
                      <div>
                        <h4>{template.name}</h4>
                        <span>{template.tag}</span>
                      </div>
                      <p>{template.body}</p>
                      <small>{template.features}</small>
                      <div className={styles["templateStatus"]}>
                        {pageTemplate === template.value ? (
                          <span>
                            <Check size={14} /> Selected
                          </span>
                        ) : (
                          <span>
                            Try this look <ArrowUpRight size={13} />
                          </span>
                        )}
                        {liveTemplate === template.value && <em>Live on your page</em>}
                      </div>
                    </div>
                    <button
                      type="button"
                      aria-label={`Preview ${template.name} template`}
                      aria-pressed={pageTemplate === template.value}
                      className={styles["selectTemplate"]}
                      onClick={() => {
                        setPageTemplate(template.value);
                      }}
                    />
                  </article>
                ))}
              </div>
            </section>
            <section className="surface space-y-4 p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg">Find your voice</h3>
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
                <h3 className="text-lg">Set the scene</h3>
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
                Your signature colour
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
                  The backdrop
                </h2>
                <div className="flex rounded-lg border border-border p-0.5">
                  {BACKGROUND_TYPE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setBackgroundType(opt.value)}
                      aria-pressed={backgroundType === opt.value}
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
                  How your classes appear
                </h2>
                <div className="grid gap-3 sm:grid-cols-3">
                  {LAYOUT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setPageLayout(opt.value)}
                      aria-pressed={pageLayout === opt.value}
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

            <div className={styles["saveBar"]}>
              <div>
                <strong>
                  {isStarter
                    ? "Explore your next chapter"
                    : hasChanges
                      ? "Your next look is taking shape"
                      : "Your design is up to date"}
                </strong>
                <p>
                  {isStarter
                    ? "Try the styles here. Upgrade to publish your design."
                    : hasChanges
                      ? "Preview changes first. Save when it feels right."
                      : "Changes only go live when you save."}
                </p>
              </div>
              <Button
                variant="clay"
                size="lg"
                onClick={() => void handleSave()}
                disabled={saving || uploading || (!hasChanges && !isStarter)}
              >
                {saving ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Saving…
                  </>
                ) : isStarter ? (
                  "Unlock my design with Pro"
                ) : (
                  "Save page design"
                )}
              </Button>
            </div>
            <UpgradeModal
              open={upgradeOpen}
              onOpenChange={setUpgradeOpen}
              feature="Custom page design"
            />
          </div>

          <aside className={styles["preview"]}>
            <div className={styles["previewHeading"]}>
              <span>
                <span /> Live preview
              </span>
              <small>
                {isStarter ? "Pro design preview" : hasChanges ? "Unsaved design" : "Saved design"}
              </small>
            </div>
            <PublicPageLivePreview design={designSettings} />
            <p className={styles["previewNote"]}>
              Your actual public-page renderer, with your profile, offers, classes, and links.
            </p>
          </aside>
        </div>
      </div>
      {leaveDialog}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-h-[95dvh] w-[calc(100%-1rem)] overflow-y-auto rounded-2xl p-4 sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Your next look</DialogTitle>
            <DialogDescription>
              This is a preview. Your page updates after you save.
            </DialogDescription>
          </DialogHeader>
          <PublicPageLivePreview design={designSettings} />
        </DialogContent>
      </Dialog>
    </Wrapper>
  );
}
