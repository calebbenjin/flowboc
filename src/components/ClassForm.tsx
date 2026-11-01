"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { upload } from "@vercel/blob/client";
import { toast } from "sonner";
import { compressImage } from "@/lib/compress-image";
import { ArrowLeft, ArrowRight, Check, Flower2, ImagePlus, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ClassReviewCard } from "@/components/ClassReviewCard";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ProBadge, UpgradeModal } from "@/components/ProGate";
import { cn } from "@/lib/utils";
import { currencies, money, timezones } from "@/lib/demo";
import { DEADLINE_OPTIONS, deadlineMinutesToLabel } from "@/lib/class-deadline";
import { estimatePaystackFee, payoutProviderForCurrency } from "@/lib/payout";
import { useInstructor } from "@/components/InstructorProvider";
import { recurringDates } from "@/lib/class-schedule";
import { usePayoutSetup } from "@/hooks/use-payout-setup";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { CLASS_PRACTICES, suggestedClassDate } from "@/lib/class-practice";
import styles from "./ClassForm.module.css";
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
  guided?: boolean;
  requiresPayout?: boolean;
  initial?: ClassFormInitial;
  onSubmit: (e: FormEvent<HTMLFormElement>) => Promise<boolean>;
  editScope?: "single" | "future";
  affectedCount?: number;
  primaryLabel: string;
  secondaryLabel: string;
  onSecondary?: () => void;
  // When true, the secondary button also submits the form (tagged
  // name="intent" value="draft" vs the primary's value="publish") instead
  // of just navigating away — used by "Create a class" for its "Save as
  // draft" action.
  secondarySubmits?: boolean;
  pending?: boolean;
  // Fires on every change to the fields that matter for a live preview
  // (name, cover, date/time, price). Not included in the effect's deps —
  // identity changes on the callback itself shouldn't retrigger it.
  onLiveChange?: (draft: ClassFormDraft) => void;
};

export type ClassFormDraft = {
  capacity?: number;
  location?: string;
  recurring?: boolean;
  recurringDays?: string[];
  horizonDays?: number;
  durationMinutes?: number;
  online?: boolean;
  description?: string;
  name: string;
  coverUrl: string | null;
  date: string;
  time: string;
  timezone: string;
  price: number;
  originalPrice: number | null;
};

function CoverPhotoUpload({
  value,
  onChange,
  onBusyChange,
}: {
  value: string | null;
  onChange: (url: string | null) => void;
  onBusyChange?: (busy: boolean) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  async function handleFile(file: File) {
    if (uploading) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      return;
    }

    setUploading(true);
    onBusyChange?.(true);
    try {
      const compressed = await compressImage(file, { maxDimension: 1600 });
      const blob = await upload(compressed.name, compressed, {
        access: "public",
        handleUploadUrl: "/api/upload",
      });
      onChange(blob.url);
    } catch {
      toast.error("Couldn't upload image. Please try again.");
    } finally {
      setUploading(false);
      onBusyChange?.(false);
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
        "relative flex h-28 cursor-pointer items-center gap-4 overflow-hidden rounded-lg border border-dashed border-border text-sm text-muted-foreground transition-colors hover:bg-primary/10",
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
  guided = false,
  requiresPayout = true,
  initial,
  onSubmit,
  primaryLabel,
  secondaryLabel,
  onSecondary,
  secondarySubmits = false,
  pending = false,
  onLiveChange,
  editScope = "single",
  affectedCount = 1,
}: ClassFormProps) {
  const instructor = useInstructor();
  const payoutSetup = usePayoutSetup();
  const [step, setStep] = useState(0);
  const [furthestStep, setFurthestStep] = useState(0);
  const [imagePending, setImagePending] = useState(false);
  const [stepError, setStepError] = useState<string | null>(null);
  const [stepReview, setStepReview] = useState<Record<string, string>>({});
  const stepHeading = useRef<HTMLHeadingElement>(null);
  const focusField = useRef<string | null>(null);
  const journey = [
    {
      label: "Intention",
      title: "Set the intention.",
      body: "What kind of practice are you inviting people into? Start with a suggestion, or make it entirely yours.",
    },
    {
      label: "Rhythm",
      title: "Find your rhythm.",
      body: "Choose a time to gather, how long you’ll practise, and where your mats will meet.",
    },
    {
      label: "Invitation",
      title: "Welcome your students.",
      body: "Make space on the mat. Set your class size, price, and a few simple booking details.",
    },
    {
      label: "Review",
      title: "One mindful look.",
      body: "Take a breath and check the details. Publish when it feels right, or save a draft for later.",
    },
  ];
  useEffect(() => {
    if (!guided) return;
    if (focusField.current) {
      const field = document.getElementById(focusField.current);
      const details = field?.closest("details");
      if (details) details.open = true;
      field?.focus();
      focusField.current = null;
    } else stepHeading.current?.focus();
  }, [guided, step]);
  const isStarter = instructor.planTier === "STARTER";
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [recurring, setRecurring] = useState(initial?.recurring ?? false);
  const [online, setOnline] = useState(initial?.online ?? false);
  const [pickedDays, setPickedDays] = useState<string[]>(initial?.recurringDays ?? ["Tue", "Thu"]);
  const [horizonDays, setHorizonDays] = useState(initial?.horizonDays ?? DEFAULT_HORIZON_DAYS);
  const [coverUrl, setCoverUrl] = useState<string | null>(initial?.coverUrl ?? null);
  const [classType, setClassType] = useState(initial?.type ?? "");
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [date, setDate] = useState(initial?.date ?? "");
  const [time, setTime] = useState(initial?.time ?? "07:00");
  const [timezone, setTimezone] = useState(initial?.timezone ?? instructor.timezone);
  const [durationMinutes, setDurationMinutes] = useState(initial?.durationMinutes ?? 60);
  const [price, setPrice] = useState(initial?.price ?? 0);
  const [capacity, setCapacity] = useState(initial?.capacity ?? 12);
  const [location, setLocation] = useState(initial?.location ?? "");
  const [originalPrice, setOriginalPrice] = useState<number | null>(initial?.originalPrice ?? null);

  const formRef = useRef<HTMLFormElement>(null);
  const baseline = useRef<string | null>(null);
  const approved = useRef(false);
  const submitterRef = useRef<HTMLButtonElement | null>(null);
  const [dirty, setDirty] = useState(false);
  const [review, setReview] = useState<Record<string, string> | null>(null);
  const { confirmLeave, dialog: leaveDialog } = useUnsavedChanges(dirty);
  function fingerprint() {
    return formRef.current
      ? JSON.stringify(
          Array.from(new FormData(formRef.current).entries()).filter(([key]) => key !== "intent"),
        )
      : "";
  }
  function checkDirty() {
    if (baseline.current !== null) setDirty(fingerprint() !== baseline.current);
  }
  useEffect(() => {
    if (baseline.current === null) baseline.current = fingerprint();
    else checkDirty();
    // Hidden form fields are updated by React after switches and uploads change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    name,
    classType,
    description,
    durationMinutes,
    coverUrl,
    date,
    time,
    timezone,
    price,
    originalPrice,
    recurring,
    online,
    pickedDays,
    horizonDays,
  ]);

  const scheduleDates = date
    ? recurring && !initial
      ? recurringDates(date, pickedDays, horizonDays)
      : [date]
    : [];
  function readReview() {
    return Object.fromEntries(
      Array.from(new FormData(formRef.current!).entries()).map(([key, value]) => [
        key,
        String(value),
      ]),
    );
  }
  function navigateStep(next: number) {
    setStepError(null);
    if (next === 3) setStepReview(readReview());
    setStep(next);
    setFurthestStep((current) => Math.max(current, next));
  }
  function validateStep(all = false) {
    const form = formRef.current;
    if (!form) return false;
    const fields = Array.from(
      form.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(
        "input,select,textarea",
      ),
    );
    const invalid = fields.find(
      (field) =>
        (all ||
          field.closest("[data-class-step]")?.getAttribute("data-class-step") === String(step)) &&
        !field.disabled &&
        !field.validity.valid,
    );
    if (invalid) {
      const targetStep = Number(
        invalid.closest("[data-class-step]")?.getAttribute("data-class-step") ?? 0,
      );
      focusField.current = invalid.id;
      setStep(targetStep);
      setFurthestStep((current) => Math.max(current, targetStep));
      setStepError(invalid.validationMessage);
      if (targetStep === step) {
        const details = invalid.closest("details");
        if (details) details.open = true;
        invalid.focus();
        invalid.reportValidity();
        focusField.current = null;
      }
      return false;
    }
    if ((all || step === 0) && !name.trim()) {
      setStep(0);
      setStepError("Give your practice a class name before continuing.");
      return false;
    }
    if ((all || step === 1) && recurring && !scheduleDates.length) {
      setStep(1);
      setStepError("Choose a start date and at least one repeat day for your rhythm.");
      return false;
    }
    setStepError(null);
    return true;
  }
  function nextStep() {
    if (pending || imagePending) return;
    if (validateStep()) navigateStep(Math.min(step + 1, 3));
  }
  async function handleFormSubmit(event: FormEvent<HTMLFormElement>) {
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const isDraft = submitter?.value === "draft";
    if (guided) {
      event.preventDefault();
      if (pending || imagePending) return;
      if (!isDraft && step < 3) {
        nextStep();
        return;
      }
      if (!validateStep(true)) return;
    }
    if (!isDraft && payoutSetup.check(price, requiresPayout)) {
      event.preventDefault();
      return;
    }
    if (!guided && !isDraft && !approved.current) {
      event.preventDefault();
      if (recurring && !initial && scheduleDates.length === 0) {
        toast.error("Choose at least one repeat day.");
        return;
      }
      submitterRef.current = submitter;
      const data = new FormData(event.currentTarget);
      setReview(
        Object.fromEntries(Array.from(data.entries()).map(([key, value]) => [key, String(value)])),
      );
      return;
    }
    approved.current = false;
    const saved = await onSubmit(event);
    if (saved) {
      baseline.current = fingerprint();
      setDirty(false);
      setReview(null);
    }
  }

  const paystackFee =
    price > 0 && payoutProviderForCurrency(instructor.currency) === "PAYSTACK"
      ? estimatePaystackFee(price, instructor.currency)
      : null;

  useEffect(() => {
    onLiveChange?.({
      capacity,
      location,
      recurring,
      recurringDays: pickedDays,
      horizonDays,
      durationMinutes,
      online,
      name,
      description,
      coverUrl,
      date,
      time,
      timezone,
      price,
      originalPrice,
    });
    // onLiveChange's identity shouldn't retrigger this — only the field values should.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    capacity,
    location,
    recurring,
    pickedDays,
    horizonDays,
    durationMinutes,
    online,
    name,
    description,
    coverUrl,
    date,
    time,
    timezone,
    price,
    originalPrice,
  ]);

  const initialDeadlineLabel = initial
    ? deadlineMinutesToLabel(initial.deadlineMinutesBeforeStart)
    : DEADLINE_OPTIONS[0].label;
  const standardLabels: string[] = DEADLINE_OPTIONS.map((o) => o.label);
  const deadlineList = standardLabels.includes(initialDeadlineLabel)
    ? standardLabels
    : [initialDeadlineLabel, ...standardLabels];

  return (
    <>
      <form
        ref={formRef}
        className={cn("mt-6 space-y-8", guided && styles["guided"])}
        noValidate={guided}
        onKeyDown={(event) => {
          if (
            guided &&
            step < 3 &&
            event.key === "Enter" &&
            event.target instanceof HTMLInputElement &&
            event.target.type !== "file"
          ) {
            event.preventDefault();
            nextStep();
          }
        }}
        onSubmit={handleFormSubmit}
        onChangeCapture={checkDirty}
        onInvalidCapture={(event) => {
          const details = (event.target as HTMLElement).closest("details");
          if (details) details.open = true;
        }}
      >
        {guided && (
          <>
            <nav className={styles["progress"]} aria-label="Create class steps">
              {journey.map((item, index) => (
                <button
                  key={item.label}
                  type="button"
                  aria-current={step === index ? "step" : undefined}
                  disabled={index > furthestStep || pending || imagePending}
                  onClick={() => {
                    if (index <= step || validateStep(index === 3)) navigateStep(index);
                  }}
                >
                  <span>{index < step ? <Check size={13} /> : index + 1}</span>
                  {item.label}
                </button>
              ))}
            </nav>
            <header className={styles["stepHeading"]}>
              <Flower2 size={25} aria-hidden="true" />
              <p>Step {step + 1} of 4</p>
              <h2 ref={stepHeading} tabIndex={-1}>
                {journey[step]?.title}
              </h2>
              <p>{journey[step]?.body}</p>
            </header>
            {stepError && (
              <p className={styles["stepError"]} role="alert">
                {stepError}
              </p>
            )}
          </>
        )}

        <input type="hidden" name="recurring" value={recurring ? "true" : "false"} />
        <input type="hidden" name="recurringDays" value={pickedDays.join(",")} />
        <input type="hidden" name="horizonDays" value={horizonDays} />
        <input type="hidden" name="online" value={online ? "true" : "false"} />
        <input type="hidden" name="coverUrl" value={coverUrl ?? ""} />

        <section
          data-class-step="0"
          hidden={guided && step !== 0}
          className="surface space-y-4 p-6"
        >
          <h2 className="text-xs uppercase tracking-[0.18em] text-muted-foreground">The class</h2>
          {guided && (
            <div className={styles["practiceSuggestions"]}>
              <p>A starting point for your practice</p>
              {CLASS_PRACTICES.map((practice) => (
                <button
                  key={practice.name}
                  type="button"
                  aria-pressed={name === practice.name && classType === practice.type}
                  onClick={() => {
                    setName(practice.name);
                    setClassType(practice.type);
                    setDescription(practice.description);
                    setDurationMinutes(practice.durationMinutes);
                  }}
                >
                  <Flower2 size={14} />
                  {practice.name}
                </button>
              ))}
              <small>
                Choosing one fills the name, style, description, and duration. You can edit every
                detail.
              </small>
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cname">Class name</Label>
              <Input
                id="cname"
                name="name"
                placeholder="Morning Flow"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ctype">Class type</Label>
              <Input
                id="ctype"
                name="type"
                placeholder="Vinyasa"
                value={classType}
                onChange={(event) => setClassType(event.target.value)}
              />
            </div>
          </div>
          <details open={initial || guided ? true : undefined} className="space-y-4">
            <summary className="cursor-pointer text-sm font-medium">
              Description and cover photo (optional)
            </summary>
            <div className="space-y-2">
              <Label htmlFor="cdesc">Description</Label>
              <Textarea
                id="cdesc"
                name="description"
                rows={3}
                placeholder="What should students expect?"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Cover photo</Label>
              <CoverPhotoUpload
                value={coverUrl}
                onChange={setCoverUrl}
                onBusyChange={setImagePending}
              />
            </div>
          </details>
        </section>

        <section
          data-class-step="1"
          hidden={guided && step !== 1}
          className="surface space-y-4 p-6"
        >
          <h2 className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            When &amp; where
          </h2>
          {initial ? (
            <p className="rounded-lg bg-secondary p-3 text-sm text-muted-foreground">
              {initial.recurring
                ? `Part of a recurring series. Editing ${editScope === "future" ? "this and future classes" : "this class only"}. Repeat days are preserved; this does not create or remove dates.`
                : "One-time class. To create a recurring schedule, create a new class."}
            </p>
          ) : (
            <>
              <div className="flex items-center justify-between rounded-lg bg-primary/10 px-4 py-3">
                <div>
                  <p className="flex items-center gap-2 text-sm font-medium">
                    Recurring class {isStarter && <ProBadge />}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Create weekly dates for a fixed period
                  </p>
                </div>
                <Switch
                  checked={recurring}
                  aria-label="Recurring class"
                  onCheckedChange={(next) => {
                    if (next && isStarter) {
                      setUpgradeOpen(true);
                      return;
                    }
                    setRecurring(next);
                  }}
                />
              </div>
              <UpgradeModal
                open={upgradeOpen}
                onOpenChange={setUpgradeOpen}
                feature="Recurring classes"
              />

              {recurring && (
                <div className="flex flex-wrap gap-2">
                  {days.map((d) => {
                    const on = pickedDays.includes(d);
                    return (
                      <button
                        type="button"
                        key={d}
                        aria-pressed={on}
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
                        aria-pressed={horizonDays === n}
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
            </>
          )}
          {guided && (
            <div className={styles["dateSuggestions"]}>
              <span>A little help finding your day</span>
              <button type="button" onClick={() => setDate(suggestedClassDate(timezone, 1))}>
                Tomorrow
              </button>
              <button type="button" onClick={() => setDate(suggestedClassDate(timezone, 7))}>
                In one week
              </button>
              <small>Dates follow your selected timezone.</small>
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="cdate">{recurring ? "Starts on" : "Date"}</Label>
              <Input
                id="cdate"
                name="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ctime">Start time</Label>
              <Input
                id="ctime"
                name="time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ctz">Timezone</Label>
              <select
                id="ctz"
                name="timezone"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-card px-3 text-sm"
              >
                {!timezones.some((zone) => zone.value === timezone) ? (
                  <option value={timezone}>{timezone}</option>
                ) : null}
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
                min={1}
                required
                value={durationMinutes}
                onChange={(event) => setDurationMinutes(Number(event.target.value))}
              />
            </div>
          </div>

          {guided && (
            <div
              className={styles["durationSuggestions"]}
              role="group"
              aria-label="Practice duration"
            >
              {[30, 45, 60, 75, 90].map((minutes) => (
                <button
                  type="button"
                  key={minutes}
                  aria-pressed={durationMinutes === minutes}
                  onClick={() => setDurationMinutes(minutes)}
                >
                  {minutes} min
                </button>
              ))}
            </div>
          )}
          <div className="flex items-center justify-between rounded-lg bg-primary/10 px-4 py-3">
            <div>
              <p className="text-sm font-medium">Online class</p>
              <p className="text-xs text-muted-foreground">
                Students receive a link instead of an address
              </p>
            </div>
            <Switch checked={online} onCheckedChange={setOnline} aria-label="Online class" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cloc">{online ? "Meeting link" : "Location"}</Label>
            <Input
              id="cloc"
              name="location"
              type={guided && online ? "url" : "text"}
              placeholder={online ? "https://zoom.us/j/…" : "Freedom Park Studio, Lekki"}
              value={location}
              onChange={(event) => setLocation(event.target.value)}
            />
          </div>
        </section>

        <section
          data-class-step="2"
          hidden={guided && step !== 2}
          className="surface space-y-4 p-6"
        >
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
              <Label htmlFor="ccap">
                {guided ? "Spaces on the mat (capacity)" : "Max capacity"}
              </Label>
              <Input
                id="ccap"
                name="capacity"
                type="number"
                min={1}
                required
                value={capacity}
                onChange={(event) => setCapacity(Number(event.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cprice">{guided ? "Price per student" : "Price"}</Label>
              <Input
                id="cprice"
                name="price"
                type="number"
                min={0}
                placeholder="0"
                step="0.01"
                value={price || ""}
                onChange={(e) => setPrice(e.target.value ? Number(e.target.value) : 0)}
              />
              {guided && price === 0 && (
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Leave this at 0 for a free community practice.
                </p>
              )}
              {paystackFee !== null && (
                <p className="text-xs text-muted-foreground">
                  Paystack&apos;s fee is ~{money(paystackFee, instructor.currency)} on this price —
                  students pay {money(price, instructor.currency)}, you&apos;ll net about{" "}
                  {money(Math.max(0, price - paystackFee), instructor.currency)}.
                </p>
              )}
            </div>
            <details open={initial?.originalPrice != null ? true : undefined} className="space-y-2">
              <summary className="cursor-pointer text-sm font-medium">
                Show a discount (optional)
              </summary>
              <div className="space-y-2">
                <Label htmlFor="coprice">Original price (optional)</Label>
                <Input
                  id="coprice"
                  name="originalPrice"
                  type="number"
                  placeholder="Price before the discount"
                  min={0}
                  step="0.01"
                  value={originalPrice ?? ""}
                  onChange={(e) => setOriginalPrice(e.target.value ? Number(e.target.value) : null)}
                />
              </div>
            </details>
          </div>
          <details open={initial ? true : undefined} className="space-y-4">
            <summary className="cursor-pointer text-sm font-medium">
              Booking deadline and cancellation policy
            </summary>
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
          </details>
        </section>

        {guided && step === 3 && (
          <section className={styles["review"]}>
            <ClassReviewCard
              values={stepReview}
              currency={instructor.currency}
              scope={
                recurring
                  ? `You’re creating ${scheduleDates.length} class dates. First: ${scheduleDates[0]}. Last: ${scheduleDates[scheduleDates.length - 1]}.`
                  : "You’re creating one class. You can edit it later from Classes."
              }
            />
            <button type="button" className={styles["editDetails"]} onClick={() => navigateStep(0)}>
              <ArrowLeft size={14} /> Adjust the details
            </button>
          </section>
        )}
        <aside
          hidden={guided && step !== 1 && step !== 3}
          className="rounded-xl bg-secondary p-4 text-sm"
          aria-live="polite"
        >
          <p className="font-medium">Schedule preview</p>
          <p className="mt-1 text-muted-foreground">
            {date
              ? `${scheduleDates.length} ${scheduleDates.length === 1 ? "date" : "dates"} · ${date} at ${time} · ${timezone}`
              : "Choose a date to preview your schedule."}
            {initial && editScope === "future"
              ? ` Changes apply to ${affectedCount} scheduled dates.`
              : ""}
          </p>
          {recurring && !initial && scheduleDates.length > 0 ? (
            <p className="mt-1 text-muted-foreground">
              First: {scheduleDates[0]} · Last: {scheduleDates[scheduleDates.length - 1]}
            </p>
          ) : null}
        </aside>
        {guided ? (
          <div className={styles["actions"]}>
            <Button
              type="button"
              variant="ghost"
              disabled={step === 0 || pending || imagePending}
              onClick={() => navigateStep(step - 1)}
            >
              <ArrowLeft size={15} /> Back
            </Button>
            <Button
              type="submit"
              name="intent"
              value="draft"
              variant="ghost"
              disabled={pending || imagePending}
            >
              Save draft
            </Button>
            <Button
              type="submit"
              name="intent"
              value={step === 3 ? "publish" : "next"}
              variant="clay"
              disabled={pending || imagePending}
            >
              {pending ? (
                <>
                  <Loader2 size={15} className="animate-spin" /> Saving…
                </>
              ) : imagePending ? (
                "Uploading…"
              ) : step === 3 ? (
                "Publish class"
              ) : step === 2 ? (
                "Review my class"
              ) : (
                "Continue"
              )}
              <ArrowRight size={15} />
            </Button>
          </div>
        ) : (
          <div className="sticky bottom-20 z-20 flex flex-wrap justify-end gap-3 rounded-xl border border-border bg-white/95 p-4 backdrop-blur lg:bottom-4">
            <Button
              type={secondarySubmits ? "submit" : "button"}
              name={secondarySubmits ? "intent" : undefined}
              value={secondarySubmits ? "draft" : undefined}
              variant="ghost"
              onClick={secondarySubmits ? undefined : () => confirmLeave(() => onSecondary?.())}
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
              ) : secondarySubmits ? (
                "Review and publish"
              ) : (
                "Review changes"
              )}
            </Button>
          </div>
        )}
      </form>
      {leaveDialog}
      {payoutSetup.dialog}
      <Dialog
        open={review !== null}
        onOpenChange={(open) => {
          if (!open && !pending) setReview(null);
        }}
      >
        <DialogContent className="flex max-h-[90dvh] w-[calc(100%-2rem)] max-w-2xl flex-col gap-0 overflow-hidden rounded-2xl p-0">
          <DialogHeader className="shrink-0 px-5 pb-5 pt-6 text-left sm:px-6">
            <DialogTitle className="pr-7 text-xl">
              {secondarySubmits ? "Review your class" : "Review your changes"}
            </DialogTitle>
            <DialogDescription>
              Here’s how your class will look. Check the details before you confirm.
            </DialogDescription>
          </DialogHeader>
          <div className="min-h-0 overflow-y-auto overscroll-contain px-5 pb-5 sm:px-6">
            {review ? (
              <ClassReviewCard
                values={{ ...review, date: scheduleDates[0] ?? review["date"] ?? "" }}
                currency={instructor.currency}
                scope={
                  initial
                    ? `Changes apply to ${affectedCount} ${affectedCount === 1 ? "class" : "classes"}.`
                    : recurring
                      ? `${scheduleDates.length} classes · ${scheduleDates[0]} to ${scheduleDates[scheduleDates.length - 1]}`
                      : "One-time class"
                }
              />
            ) : null}
          </div>
          <DialogFooter className="shrink-0 gap-2 border-t border-border bg-card px-5 py-4 sm:px-6">
            <Button variant="quiet" disabled={pending} onClick={() => setReview(null)}>
              Back to editing
            </Button>
            <Button
              variant="clay"
              disabled={pending}
              onClick={() => {
                approved.current = true;
                formRef.current?.requestSubmit(submitterRef.current);
              }}
            >
              {pending ? "Saving…" : primaryLabel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
