"use server";

import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/db";
import { requireInstructor } from "@/lib/require-instructor";
import { deadlineLabelToMinutes } from "@/lib/class-deadline";
import { zonedDateTimeToUtc } from "@/lib/timezone";
import type { ClassStatus } from "@/generated/prisma/enums";

type ActionResult = { ok: true } | { ok: false; error: string };

const RECURRING_HORIZON_DAYS = 84; // ~12 weeks
const WEEKDAY_ABBREVS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WEEKDAY_FULL: Record<string, string> = {
  Mon: "Monday",
  Tue: "Tuesday",
  Wed: "Wednesday",
  Thu: "Thursday",
  Fri: "Friday",
  Sat: "Saturday",
  Sun: "Sunday",
};

function addDaysToDateString(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1));
  dt.setUTCDate(dt.getUTCDate() + days);
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, "0")}-${String(dt.getUTCDate()).padStart(2, "0")}`;
}

function weekdayAbbrev(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1));
  return WEEKDAY_ABBREVS[dt.getUTCDay()] ?? "Sun";
}

function buildRecurringLabel(days: string[]): string {
  const ordered = WEEKDAY_ABBREVS.filter((d) => days.includes(d)).map((d) => WEEKDAY_FULL[d]);
  if (ordered.length === 0) return "Recurring";
  if (ordered.length === 1) return `Every ${ordered[0]}`;
  return `Every ${ordered.slice(0, -1).join(", ")} & ${ordered[ordered.length - 1]}`;
}

export type ClassInput = {
  name: string;
  type?: string;
  description?: string;
  recurring: boolean;
  recurringDays: string[];
  date: string;
  time: string;
  timezone: string;
  durationMinutes: number;
  online: boolean;
  location?: string;
  capacity: number;
  price: number;
  originalPrice?: number | null;
  deadlineLabel: string;
  cancellationPolicy?: string;
  status: ClassStatus;
};

function validate(input: ClassInput): string | null {
  if (!input.name.trim()) return "Please enter a class name.";
  if (!input.date || !input.time) return "Please set a date and time.";
  if (!Number.isFinite(input.capacity) || input.capacity < 1) return "Capacity must be at least 1.";
  if (!Number.isFinite(input.price) || input.price < 0) return "Price can't be negative.";
  if (!Number.isFinite(input.durationMinutes) || input.durationMinutes < 1) {
    return "Duration must be at least 1 minute.";
  }
  return null;
}

export async function createClass(input: ClassInput): Promise<ActionResult> {
  const instructor = await requireInstructor();

  const error = validate(input);
  if (error) return { ok: false, error };

  const baseData = {
    instructorId: instructor.id,
    name: input.name.trim(),
    type: input.type?.trim() || null,
    description: input.description?.trim() || null,
    timezone: input.timezone,
    durationMinutes: input.durationMinutes,
    mode: input.online ? ("ONLINE" as const) : ("IN_PERSON" as const),
    location: input.location?.trim() || null,
    price: input.price,
    originalPrice: input.originalPrice ?? null,
    capacity: input.capacity,
    status: input.status,
    deadlineMinutesBeforeStart: deadlineLabelToMinutes(input.deadlineLabel),
    cancellationPolicy: input.cancellationPolicy?.trim() || null,
    publishedAt: input.status === "PUBLISHED" ? new Date() : null,
  };

  if (input.recurring && input.recurringDays.length > 0) {
    const seriesId = randomUUID();
    const recurringLabel = buildRecurringLabel(input.recurringDays);
    const occurrenceDates: string[] = [];
    for (let i = 0; i < RECURRING_HORIZON_DAYS; i++) {
      const d = addDaysToDateString(input.date, i);
      if (input.recurringDays.includes(weekdayAbbrev(d))) occurrenceDates.push(d);
    }

    await prisma.yogaClass.createMany({
      data: occurrenceDates.map((d) => ({
        ...baseData,
        seriesId,
        recurringLabel,
        recurringDays: input.recurringDays,
        startAt: zonedDateTimeToUtc(d, input.time, input.timezone),
      })),
    });
  } else {
    await prisma.yogaClass.create({
      data: {
        ...baseData,
        startAt: zonedDateTimeToUtc(input.date, input.time, input.timezone),
      },
    });
  }

  return { ok: true };
}

async function requireOwnedClass(classId: string) {
  const instructor = await requireInstructor();
  const cls = await prisma.yogaClass.findUnique({ where: { id: classId } });
  if (!cls || cls.instructorId !== instructor.id) {
    throw new Error("Class not found");
  }
  return { instructor, cls };
}

export async function updateClass(classId: string, input: ClassInput): Promise<ActionResult> {
  await requireOwnedClass(classId);

  const error = validate(input);
  if (error) return { ok: false, error };

  await prisma.yogaClass.update({
    where: { id: classId },
    data: {
      name: input.name.trim(),
      type: input.type?.trim() || null,
      description: input.description?.trim() || null,
      timezone: input.timezone,
      durationMinutes: input.durationMinutes,
      mode: input.online ? "ONLINE" : "IN_PERSON",
      location: input.location?.trim() || null,
      price: input.price,
      originalPrice: input.originalPrice ?? null,
      capacity: input.capacity,
      status: input.status,
      deadlineMinutesBeforeStart: deadlineLabelToMinutes(input.deadlineLabel),
      cancellationPolicy: input.cancellationPolicy?.trim() || null,
      startAt: zonedDateTimeToUtc(input.date, input.time, input.timezone),
      recurringDays: input.recurring ? input.recurringDays : [],
      recurringLabel: input.recurring ? buildRecurringLabel(input.recurringDays) : null,
      publishedAt: input.status === "PUBLISHED" ? new Date() : null,
    },
  });

  return { ok: true };
}

export async function duplicateClass(classId: string): Promise<ActionResult> {
  const { instructor, cls } = await requireOwnedClass(classId);

  await prisma.yogaClass.create({
    data: {
      instructorId: instructor.id,
      name: `${cls.name} (copy)`,
      type: cls.type,
      description: cls.description,
      coverUrl: cls.coverUrl,
      startAt: cls.startAt,
      timezone: cls.timezone,
      durationMinutes: cls.durationMinutes,
      mode: cls.mode,
      location: cls.location,
      price: cls.price,
      originalPrice: cls.originalPrice,
      capacity: cls.capacity,
      status: "DRAFT",
      deadlineMinutesBeforeStart: cls.deadlineMinutesBeforeStart,
      cancellationPolicy: cls.cancellationPolicy,
      // Deliberately not copied: seriesId/recurringDays/recurringLabel —
      // a duplicate is a new one-off draft, not another series occurrence.
    },
  });

  return { ok: true };
}

export async function cancelClass(classId: string): Promise<ActionResult> {
  await requireOwnedClass(classId);

  await prisma.yogaClass.update({
    where: { id: classId },
    data: { status: "CANCELLED", cancelledAt: new Date() },
  });

  // Notifying/refunding booked students happens once Booking exists
  // (a later batch) — no bookings can exist yet in this batch.

  return { ok: true };
}

export async function deleteClass(classId: string): Promise<ActionResult> {
  const { cls } = await requireOwnedClass(classId);

  if (cls.status !== "DRAFT") {
    return { ok: false, error: "Only draft classes can be deleted." };
  }

  await prisma.yogaClass.delete({ where: { id: classId } });
  return { ok: true };
}
