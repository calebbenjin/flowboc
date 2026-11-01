import { utcToZonedDateTime, zonedDateTimeToUtc } from "./timezone.ts";

export const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function addCalendarDays(date: string, days: number): string {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

export function recurringDates(date: string, days: string[], horizon: number): string[] {
  return Array.from({ length: horizon }, (_, index) => addCalendarDays(date, index)).filter(
    (value) => days.includes(WEEKDAYS[new Date(`${value}T12:00:00Z`).getUTCDay()]!),
  );
}

// Shift calendar dates, rather than elapsed UTC hours, to preserve local time across DST.
export function shiftedOccurrence(
  occurrence: { startAt: Date; timezone: string },
  original: { startAt: Date; timezone: string },
  input: { date: string; time: string; timezone: string },
): Date {
  const originalDate = utcToZonedDateTime(original.startAt, original.timezone).date;
  const localDate = utcToZonedDateTime(occurrence.startAt, occurrence.timezone).date;
  const offset = Math.round(
    (Date.parse(`${input.date}T12:00:00Z`) - Date.parse(`${originalDate}T12:00:00Z`)) / 86400000,
  );
  return zonedDateTimeToUtc(addCalendarDays(localDate, offset), input.time, input.timezone);
}

export function shiftedRepeatDays(
  days: string[],
  originalDate: string,
  nextDate: string,
): string[] {
  const shift = Math.round(
    (Date.parse(`${nextDate}T12:00:00Z`) - Date.parse(`${originalDate}T12:00:00Z`)) / 86400000,
  );
  return days.map((day) => WEEKDAYS[(((WEEKDAYS.indexOf(day) + shift) % 7) + 7) % 7]!);
}

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

export function buildRecurringLabel(days: string[]): string {
  const ordered = WEEKDAY_ABBREVS.filter((d) => days.includes(d)).map((d) => WEEKDAY_FULL[d]);
  if (ordered.length === 0) return "Recurring";
  if (ordered.length === 1) return `Every ${ordered[0]}`;
  return `Every ${ordered.slice(0, -1).join(", ")} & ${ordered[ordered.length - 1]}`;
}
