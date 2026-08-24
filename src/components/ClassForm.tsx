"use client";

import { useRef, useState, type FormEvent } from "react";
import { upload } from "@vercel/blob/client";
import { toast } from "sonner";
import { ImagePlus, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { currencies, timezones } from "@/lib/demo";
import { DEADLINE_OPTIONS, deadlineMinutesToLabel } from "@/lib/class-deadline";
import { useInstructor } from "@/components/InstructorProvider";
import { RECURRING_HORIZON_OPTIONS } from "@/lib/class-recurrence";

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DEFAULT_HORIZON_DAYS = 30;
const horizonLabels: Record<number, string> = { 14: "2 weeks", 30: "1 month", 60: "2 months" };

export type ClassFormInitial = {
  name: string;
  type: string;
  description: string;
  coverUrl: string | null;
  recurring: boolean;
  recurringDays: string[];
  horizonDays?: number;
  date: string;
  time: string;
  timezone: string;
  durationMinutes: number;
  online: boolean;
  location: string;
  capacity: number;
  price: number;
  originalPrice: number | null;
  deadlineMinutesBeforeStart: number;
  cancellationPolicy: string;
};

export type ClassFormProps = {
  initial?: ClassFormInitial;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  primaryLabel: string;
  secondaryLabel: string;
  onSecondary?: () => void;
  // When true, the secondary button also submits the form (tagged
  // name="intent" value="draft" vs the primary's value="publish") instead
  // of just navigating away — used by "Create a class" for its "Save as
  // draft" action.
  secondarySubmits?: boolean;
  pending?: boolean;
};

function CoverPhotoUpload({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (url: string | null) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      return;
    }

    setUploading(true);
    try {
      const blob = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/api/upload",
      });
      onChange(blob.url);
    } catch {
      toast.error("Couldn't upload image. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  return (
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
        if (file) void handleFile(file);
      }}
      className={cn(
        "relative flex h-28 cursor-pointer items-center gap-4 overflow-hidden rounded-lg border border-dashed border-border text-sm text-muted-foreground transition-colors hover:bg-accent/40",
        dragActive && "border-clay bg-clay/5",
        value ? "justify-start p-3" : "justify-center",
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
          if (file) void handleFile(file);
        }}
      />
      {uploading ? (
        <Loader2 className="size-5 animate-spin" />
      ) : value ? (
        <>
          <img src={value} alt="" className="h-20 w-20 shrink-0 rounded-lg object-cover" />
          <span>Drop an image or click to replace</span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Remove cover photo"
            className="absolute right-2 top-2"
            onClick={(e) => {
              e.stopPropagation();
              onChange(null);
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
  );
}

export function ClassForm({
  initial,
  onSubmit,
  primaryLabel,
  secondaryLabel,
  onSecondary,
  secondarySubmits = false,
  pending = false,
}: ClassFormProps) {
  const instructor = useInstructor();
  const [recurring, setRecurring] = useState(initial?.recurring ?? false);
  const [online, setOnline] = useState(initial?.online ?? false);
  const [pickedDays, setPickedDays] = useState<string[]>(initial?.recurringDays ?? ["Tue", "Thu"]);
  const [horizonDays, setHorizonDays] = useState(initial?.horizonDays ?? DEFAULT_HORIZON_DAYS);
  const [coverUrl, setCoverUrl] = useState<string | null>(initial?.coverUrl ?? null);

  const initialDeadlineLabel = initial
    ? deadlineMinutesToLabel(initial.deadlineMinutesBeforeStart)
    : DEADLINE_OPTIONS[0].label;
  const standardLabels: string[] = DEADLINE_OPTIONS.map((o) => o.label);
  const deadlineList = standardLabels.includes(initialDeadlineLabel)
    ? standardLabels
    : [initialDeadlineLabel, ...standardLabels];

  return (
    <form className="mt-6 space-y-8" onSubmit={onSubmit}>
      <input type="hidden" name="recurring" value={recurring ? "true" : "false"} />
      <input type="hidden" name="recurringDays" value={pickedDays.join(",")} />
      <input type="hidden" name="horizonDays" value={horizonDays} />
      <input type="hidden" name="online" value={online ? "true" : "false"} />
      <input type="hidden" name="coverUrl" value={coverUrl ?? ""} />

      <section className="surface space-y-4 p-6">
        <h2 className="text-xs uppercase tracking-[0.18em] text-muted-foreground">The class</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="cname">Class name</Label>
            <Input
              id="cname"
              name="name"
              placeholder="Morning Flow"
              defaultValue={initial?.name}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ctype">Class type</Label>
            <Input id="ctype" name="type" placeholder="Vinyasa" defaultValue={initial?.type} />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="cdesc">Description</Label>
          <Textarea
            id="cdesc"
            name="description"
            rows={3}
            placeholder="What should students expect?"
            defaultValue={initial?.description}
          />
        </div>
        <div className="space-y-2">
          <Label>Cover photo</Label>
          <CoverPhotoUpload value={coverUrl} onChange={setCoverUrl} />
        </div>
      </section>

      <section className="surface space-y-4 p-6">
        <h2 className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
          When &amp; where
        </h2>
        <div className="flex items-center justify-between rounded-lg bg-sand/60 px-4 py-3">
          <div>
            <p className="text-sm font-medium">Recurring class</p>
            <p className="text-xs text-muted-foreground">Repeats weekly until you end the series</p>
          </div>
          <Switch checked={recurring} onCheckedChange={setRecurring} />
        </div>

        {recurring && (
          <div className="flex flex-wrap gap-2">
            {days.map((d) => {
              const on = pickedDays.includes(d);
              return (
                <button
                  type="button"
                  key={d}
                  onClick={() =>
                    setPickedDays(on ? pickedDays.filter((x) => x !== d) : [...pickedDays, d])
                  }
                  className={
                    on
                      ? "rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
                      : "rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent"
                  }
                >
                  {d}
                </button>
              );
            })}
          </div>
        )}

        {/* Only offered on creation: editing doesn't regenerate a series'
            occurrences, so changing this on an existing class would do nothing. */}
        {recurring && !initial && (
          <div className="space-y-2">
            <Label>Repeat for</Label>
            <div className="flex flex-wrap gap-2">
              {RECURRING_HORIZON_OPTIONS.map((n) => (
                <button
                  type="button"
                  key={n}
                  onClick={() => setHorizonDays(n)}
                  className={
                    horizonDays === n
                      ? "rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground"
                      : "rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent"
                  }
                >
                  {horizonLabels[n] ?? `${n} days`}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="cdate">{recurring ? "Starts on" : "Date"}</Label>
            <Input id="cdate" name="date" type="date" defaultValue={initial?.date} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ctime">Start time</Label>
            <Input
              id="ctime"
              name="time"
              type="time"
              defaultValue={initial?.time ?? "07:00"}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ctz">Timezone</Label>
            <select
              id="ctz"
              name="timezone"
              defaultValue={initial?.timezone ?? "Africa/Lagos"}
              className="h-9 w-full rounded-md border border-input bg-card px-3 text-sm"
            >
              {timezones.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label} — {t.city}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="cdur">Duration (min)</Label>
            <Input
              id="cdur"
              name="durationMinutes"
              type="number"
              defaultValue={initial?.durationMinutes ?? 60}
            />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg bg-sand/60 px-4 py-3">
          <div>
            <p className="text-sm font-medium">Online class</p>
            <p className="text-xs text-muted-foreground">
              Students receive a link instead of an address
            </p>
          </div>
          <Switch checked={online} onCheckedChange={setOnline} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="cloc">{online ? "Meeting link" : "Location"}</Label>
          <Input
            id="cloc"
            name="location"
            placeholder={online ? "https://zoom.us/j/…" : "Freedom Park Studio, Lekki"}
            defaultValue={initial?.location}
          />
        </div>
      </section>

      <section className="surface space-y-4 p-6">
        <h2 className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
          Price &amp; spots
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="ccur">Currency</Label>
            <select
              id="ccur"
              disabled
              defaultValue={instructor.currency}
              className="h-9 w-full rounded-md border border-input bg-muted px-3 text-sm text-muted-foreground"
            >
              {currencies.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.symbol} {c.code}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              Matches your account currency. Change it from your profile.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ccap">Max capacity</Label>
            <Input id="ccap" name="capacity" type="number" defaultValue={initial?.capacity ?? 12} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cprice">Price</Label>
            <Input
              id="cprice"
              name="price"
              type="number"
              placeholder="8000"
              defaultValue={initial?.price}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="coprice">Original price (optional)</Label>
            <Input
              id="coprice"
              name="originalPrice"
              type="number"
              placeholder="e.g. 9500 to show a discount"
              defaultValue={initial?.originalPrice ?? undefined}
            />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="cdead">Booking deadline</Label>
            <select
              id="cdead"
              name="deadline"
              defaultValue={initialDeadlineLabel}
              className="h-9 w-full rounded-md border border-input bg-card px-3 text-sm"
            >
              {deadlineList.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ccancel">Cancellation policy</Label>
            <Input
              id="ccancel"
              name="cancellationPolicy"
              defaultValue={
                initial?.cancellationPolicy ?? "Free cancellation up to 12 hours before class."
              }
            />
          </div>
        </div>
      </section>

      <div className="flex flex-wrap justify-end gap-3">
        <Button
          type={secondarySubmits ? "submit" : "button"}
          name={secondarySubmits ? "intent" : undefined}
          value={secondarySubmits ? "draft" : undefined}
          variant="ghost"
          onClick={secondarySubmits ? undefined : onSecondary}
          disabled={pending}
        >
          {secondaryLabel}
        </Button>
        <Button
          type="submit"
          name={secondarySubmits ? "intent" : undefined}
          value={secondarySubmits ? "publish" : undefined}
          variant="clay"
          size="lg"
          disabled={pending}
        >
          {pending ? (
            <>
              <Loader2 className="size-4 animate-spin" /> Saving…
            </>
          ) : (
            primaryLabel
          )}
        </Button>
      </div>
    </form>
  );
}
