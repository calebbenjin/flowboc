"use client";

import { useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { currencies, instructor, timezones, type YogaClass } from "@/lib/demo";

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const dayNames: Record<string, string> = {
  Mon: "Monday",
  Tue: "Tuesday",
  Wed: "Wednesday",
  Thu: "Thursday",
  Fri: "Friday",
  Sat: "Saturday",
  Sun: "Sunday",
};
const deadlineOptions = [
  "2 hours before start",
  "1 hour before start",
  "24 hours before start",
  "Until class starts",
];

function parseRecurringDays(recurring?: string) {
  if (!recurring) return [];
  return days.filter((d) => recurring.includes(dayNames[d] ?? d));
}

// Best-effort conversion of the display strings in demo data ("7:00 AM",
// "Tue, 11 Aug") into the value formats native date/time inputs expect.
function to24HourTime(label?: string) {
  const m = label ? /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(label.trim()) : null;
  if (!m || !m[1] || !m[2] || !m[3]) return "07:00";
  let hour = parseInt(m[1], 10) % 12;
  if (m[3].toUpperCase() === "PM") hour += 12;
  return `${String(hour).padStart(2, "0")}:${m[2]}`;
}

function toISODate(label?: string) {
  if (!label) return "";
  const parsed = new Date(`${label} ${new Date().getFullYear()}`);
  if (Number.isNaN(parsed.getTime())) return "";
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export type ClassFormProps = {
  initial?: YogaClass;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  primaryLabel: string;
  secondaryLabel: string;
  onSecondary?: () => void;
  pending?: boolean;
};

export function ClassForm({
  initial,
  onSubmit,
  primaryLabel,
  secondaryLabel,
  onSecondary,
  pending = false,
}: ClassFormProps) {
  const [recurring, setRecurring] = useState(Boolean(initial?.recurring));
  const [online, setOnline] = useState(initial?.mode === "Online");
  const [pickedDays, setPickedDays] = useState<string[]>(
    initial ? parseRecurringDays(initial.recurring) : ["Tue", "Thu"],
  );

  const deadlineList =
    initial?.deadline && !deadlineOptions.includes(initial.deadline)
      ? [initial.deadline, ...deadlineOptions]
      : deadlineOptions;

  return (
    <form className="mt-6 space-y-8" onSubmit={onSubmit}>
      <section className="surface space-y-4 p-6">
        <h2 className="text-xs uppercase tracking-[0.18em] text-muted-foreground">The class</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="cname">Class name</Label>
            <Input id="cname" placeholder="Morning Flow" defaultValue={initial?.name} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ctype">Class type</Label>
            <Input id="ctype" placeholder="Vinyasa" defaultValue={initial?.type} />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="cdesc">Description</Label>
          <Textarea
            id="cdesc"
            rows={3}
            placeholder="What should students expect?"
            defaultValue={initial?.description}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ccover">Cover photo</Label>
          {initial?.cover ? (
            <div className="flex items-center gap-4">
              <img
                src={initial.cover}
                alt=""
                className="h-20 w-20 shrink-0 rounded-lg object-cover"
              />
              <div className="flex h-20 flex-1 items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">
                Drop an image or click to replace
              </div>
            </div>
          ) : (
            <div className="flex h-28 items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">
              Drop an image or click to upload
            </div>
          )}
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

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="cdate">{recurring ? "Starts on" : "Date"}</Label>
            <Input id="cdate" type="date" defaultValue={toISODate(initial?.date)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ctime">Start time</Label>
            <Input id="ctime" type="time" defaultValue={to24HourTime(initial?.time)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ctz">Timezone</Label>
            <select
              id="ctz"
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
            <Input id="cdur" type="number" defaultValue={initial?.duration ?? 60} />
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
              defaultValue={instructor.currency}
              className="h-9 w-full rounded-md border border-input bg-card px-3 text-sm"
            >
              {currencies.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.symbol} {c.code}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="ccap">Max capacity</Label>
            <Input id="ccap" type="number" defaultValue={initial?.capacity ?? 12} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cprice">Price</Label>
            <Input id="cprice" type="number" placeholder="8000" defaultValue={initial?.price} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="coprice">Original price (optional)</Label>
            <Input
              id="coprice"
              type="number"
              placeholder="e.g. 9500 to show a discount"
              defaultValue={initial?.originalPrice}
            />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="cdead">Booking deadline</Label>
            <select
              id="cdead"
              defaultValue={initial?.deadline}
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
              defaultValue={
                initial?.cancellation ?? "Free cancellation up to 12 hours before class."
              }
            />
          </div>
        </div>
      </section>

      <div className="flex flex-wrap justify-end gap-3">
        <Button type="button" variant="ghost" onClick={onSecondary} disabled={pending}>
          {secondaryLabel}
        </Button>
        <Button type="submit" variant="clay" size="lg" disabled={pending}>
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
