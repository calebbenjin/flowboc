import { fromZonedTime, toZonedTime } from "date-fns-tz";

// A "wall clock" date (yyyy-MM-dd) + time (HH:mm) in the given IANA
// timezone, converted to the equivalent UTC instant. DST-aware.
export function zonedDateTimeToUtc(date: string, time: string, timeZone: string): Date {
  return fromZonedTime(`${date}T${time}:00`, timeZone);
}

// Reverse: given a stored UTC instant and the timezone it was created in,
// produce the {date, time} strings native date/time inputs expect.
export function utcToZonedDateTime(utc: Date, timeZone: string): { date: string; time: string } {
  const zoned = toZonedTime(utc, timeZone);
  const pad = (n: number) => String(n).padStart(2, "0");
  const date = `${zoned.getFullYear()}-${pad(zoned.getMonth() + 1)}-${pad(zoned.getDate())}`;
  const time = `${pad(zoned.getHours())}:${pad(zoned.getMinutes())}`;
  return { date, time };
}
