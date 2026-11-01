"use server";

import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/db";
import { requireInstructor } from "@/lib/require-instructor";
import { deadlineLabelToMinutes } from "@/lib/class-deadline";
import { utcToZonedDateTime, zonedDateTimeToUtc } from "@/lib/timezone";
import { sendCancellationEmail } from "@/lib/email";
import { RECURRING_HORIZON_OPTIONS } from "@/lib/class-recurrence";
import { accessBlockedReason } from "@/lib/trial";
import { Prisma } from "@/generated/prisma/client";
import {
  recurringDates,
  shiftedOccurrence,
  shiftedRepeatDays,
  WEEKDAYS,
} from "@/lib/class-schedule";
import type { ClassStatus } from "@/generated/prisma/enums";

type ActionResult =
  | { ok: true; firstPublication?: boolean; classCount?: number; firstDate?: string }
  | { ok: false; error: string };

const publicationHistory = {
  OR: [
    { publishedAt: { not: null } },
    { status: { in: ["PUBLISHED", "FULL", "COMPLETED"] as ClassStatus[] } },
  ],
};

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
  coverUrl?: string | null;
  recurring: boolean;
  recurringDays: string[];
  horizonDays: number;
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
  if (!["DRAFT", "PUBLISHED", "FULL", "COMPLETED", "CANCELLED"].includes(input.status))
    return "Invalid class status.";
  if (!input.name.trim()) return "Please enter a class name.";
  if (!input.date || !input.time) return "Please set a date and time.";
  if (!Number.isInteger(input.capacity) || input.capacity < 1)
    return "Capacity must be at least 1.";
  if (!Number.isFinite(input.price) || input.price < 0) return "Price can't be negative.";
  if (!Number.isFinite(input.durationMinutes) || input.durationMinutes < 1) {
    return "Duration must be at least 1 minute.";
  }
  if (
    input.recurring &&
    input.recurringDays.length > 0 &&
    !RECURRING_HORIZON_OPTIONS.includes(
      input.horizonDays as (typeof RECURRING_HORIZON_OPTIONS)[number],
    )
  ) {
    return "Please choose how long the class should repeat.";
  }
  try {
    new Intl.DateTimeFormat("en", { timeZone: input.timezone }).format();
    const start = zonedDateTimeToUtc(input.date, input.time, input.timezone);
    if (!Number.isFinite(start.getTime())) return "Please set a valid date and time.";
  } catch {
    return "Choose a valid timezone, date and time.";
  }
  if (
    input.recurring &&
    (!input.recurringDays.length || input.recurringDays.some((day) => !WEEKDAYS.includes(day)))
  )
    return "Choose at least one valid repeat day.";
  if (input.online && input.location && !/^https?:\/\//i.test(input.location))
    return "Meeting link must start with https:// or http://.";
  return null;
}

export async function createClass(input: ClassInput): Promise<ActionResult> {
  const instructor = await requireInstructor();

  const error = validate(input);
  if (error) return { ok: false, error };
  const blockedReason = input.status === "PUBLISHED" ? accessBlockedReason(instructor) : null;
  if (blockedReason) return { ok: false, error: blockedReason };

  const baseData = {
    instructorId: instructor.id,
    name: input.name.trim(),
    type: input.type?.trim() || null,
    description: input.description?.trim() || null,
    coverUrl: input.coverUrl || null,
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

  const occurrenceDates =
    input.recurring && input.recurringDays.length > 0
      ? recurringDates(input.date, input.recurringDays, input.horizonDays)
      : [input.date];
  if (!occurrenceDates.length) return { ok: false, error: "No class dates match this schedule." };
  try {
    return await prisma.$transaction(
      async (tx): Promise<ActionResult> => {
        const publishedBefore =
          input.status === "PUBLISHED"
            ? await tx.yogaClass.count({
                where: { instructorId: instructor.id, ...publicationHistory },
              })
            : null;
        if (input.recurring && input.recurringDays.length > 0) {
          const seriesId = randomUUID();
          const recurringLabel = buildRecurringLabel(input.recurringDays);
          await tx.yogaClass.createMany({
            data: occurrenceDates.map((day) => ({
              ...baseData,
              seriesId,
              recurringLabel,
              recurringDays: input.recurringDays,
              startAt: zonedDateTimeToUtc(day, input.time, input.timezone),
            })),
          });
        } else {
          await tx.yogaClass.create({
            data: {
              ...baseData,
              startAt: zonedDateTimeToUtc(input.date, input.time, input.timezone),
            },
          });
        }
        return {
          ok: true,
          firstPublication: input.status === "PUBLISHED" && publishedBefore === 0,
          classCount: occurrenceDates.length,
          firstDate: occurrenceDates[0] ?? input.date,
        };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034")
      return {
        ok: false,
        error: "Your classes changed while saving. Please review and try again.",
      };
    throw error;
  }
}

async function requireOwnedClass(classId: string) {
  const instructor = await requireInstructor();
  const cls = await prisma.yogaClass.findUnique({ where: { id: classId } });
  if (!cls || cls.instructorId !== instructor.id) {
    throw new Error("Class not found");
  }
  return { instructor, cls };
}

export async function updateClass(
  classId: string,
  input: ClassInput,
  scope: "single" | "future" = "single",
): Promise<ActionResult> {
  const { instructor, cls } = await requireOwnedClass(classId);
  const error = validate(input);
  if (error) return { ok: false, error };
  if (scope !== "single" && scope !== "future")
    return { ok: false, error: "Choose a valid edit scope." };
  const blockedReason =
    input.status === "PUBLISHED" && cls.status !== "PUBLISHED"
      ? accessBlockedReason(instructor)
      : null;
  if (blockedReason) return { ok: false, error: blockedReason };
  if (
    scope === "future" &&
    (!cls.seriesId || cls.startAt < new Date() || ["CANCELLED", "COMPLETED"].includes(cls.status))
  ) {
    return { ok: false, error: "Select an upcoming class in the series to edit future dates." };
  }
  const data = {
    name: input.name.trim(),
    type: input.type?.trim() || null,
    description: input.description?.trim() || null,
    coverUrl: input.coverUrl || null,
    timezone: input.timezone,
    durationMinutes: input.durationMinutes,
    mode: input.online ? ("ONLINE" as const) : ("IN_PERSON" as const),
    location: input.location?.trim() || null,
    price: input.price,
    originalPrice: input.originalPrice ?? null,
    capacity: input.capacity,
    deadlineMinutesBeforeStart: deadlineLabelToMinutes(input.deadlineLabel),
    cancellationPolicy: input.cancellationPolicy?.trim() || null,
  };
  try {
    return await prisma.$transaction(
      async (tx): Promise<ActionResult> => {
        const targets = await tx.yogaClass.findMany({
          where:
            scope === "future"
              ? {
                  instructorId: instructor.id,
                  seriesId: cls.seriesId,
                  startAt: { gte: cls.startAt },
                  status: { in: ["PUBLISHED", "FULL", "DRAFT"] },
                }
              : { id: cls.id, instructorId: instructor.id },
          include: { _count: { select: { bookings: { where: { status: "CONFIRMED" } } } } },
        });
        if (!targets.length)
          return { ok: false, error: "No editable classes were found. Refresh and try again." };
        if (targets.some((target) => target._count.bookings > input.capacity))
          return {
            ok: false,
            error: "Capacity cannot be lower than the confirmed bookings on any affected class.",
          };
        for (const target of targets) {
          const startAt =
            scope === "future"
              ? shiftedOccurrence(target, cls, input)
              : zonedDateTimeToUtc(input.date, input.time, input.timezone);
          if (scope === "future" && startAt < new Date())
            return { ok: false, error: "Future series dates cannot be moved into the past." };
        }
        const publishedBefore =
          input.status === "PUBLISHED" && cls.status === "DRAFT"
            ? await tx.yogaClass.count({
                where: { instructorId: instructor.id, ...publicationHistory },
              })
            : null;
        let newlyPublished = 0;
        for (const target of targets) {
          const requestedStatus =
            scope === "single" || (cls.status === "DRAFT" && target.status === "DRAFT")
              ? input.status
              : target.status;
          const status =
            requestedStatus === "PUBLISHED" || requestedStatus === "FULL"
              ? target._count.bookings >= input.capacity
                ? "FULL"
                : "PUBLISHED"
              : requestedStatus;
          if (target.publishedAt === null && (status === "PUBLISHED" || status === "FULL"))
            newlyPublished += 1;
          await tx.yogaClass.update({
            where: { id: target.id },
            data: {
              ...data,
              status,
              startAt:
                scope === "future"
                  ? shiftedOccurrence(target, cls, input)
                  : zonedDateTimeToUtc(input.date, input.time, input.timezone),
              ...(scope === "future"
                ? (() => {
                    const recurringDays = shiftedRepeatDays(
                      target.recurringDays,
                      utcToZonedDateTime(cls.startAt, cls.timezone).date,
                      input.date,
                    );
                    return { recurringDays, recurringLabel: buildRecurringLabel(recurringDays) };
                  })()
                : {}),
              // Editing preserves series membership and never creates or deletes dates.
              publishedAt:
                target.publishedAt ??
                (status === "PUBLISHED" || status === "FULL" ? new Date() : null),
            },
          });
        }
        return {
          ok: true,
          firstPublication: publishedBefore === 0 && newlyPublished > 0,
          classCount: newlyPublished,
          firstDate: input.date,
        };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034")
      return {
        ok: false,
        error: "Bookings changed while you were saving. Please review and try again.",
      };
    throw error;
  }
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
  const { instructor, cls } = await requireOwnedClass(classId);

  const bookings = await prisma.booking.findMany({
    where: { classId, status: "CONFIRMED" },
  });

  await prisma.$transaction([
    prisma.yogaClass.update({
      where: { id: classId },
      data: { status: "CANCELLED", cancelledAt: new Date() },
    }),
    // Paid bookings get marked REFUNDED (tracking only — doesn't call
    // Paystack's refund API) so revenue/payout views stop showing them as
    // clean sales; unpaid ones just move straight to CANCELLED.
    prisma.booking.updateMany({
      where: { classId, status: "CONFIRMED", paymentStatus: "PAID" },
      data: { status: "CANCELLED", paymentStatus: "REFUNDED" },
    }),
    prisma.booking.updateMany({
      where: { classId, status: "CONFIRMED", paymentStatus: { not: "PAID" } },
      data: { status: "CANCELLED", paymentStatus: "CANCELLED" },
    }),
  ]);

  // Refunding is still manual — real refunds need a payment provider.
  // allSettled rather than all: one student's address bouncing shouldn't
  // stop the rest of the class from being notified.
  const results = await Promise.allSettled(
    bookings.map((b) =>
      sendCancellationEmail({
        to: b.studentEmail,
        studentName: b.studentName,
        className: cls.name,
        instructorName: instructor.name,
        startAt: cls.startAt,
        timezone: cls.timezone,
      }),
    ),
  );
  for (const result of results) {
    if (result.status === "rejected") {
      console.error("Failed to send a class-cancellation email:", result.reason);
    }
  }

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
