import assert from "node:assert/strict";
import test from "node:test";
import {
  addCalendarDays,
  recurringDates,
  shiftedOccurrence,
  shiftedRepeatDays,
} from "../src/lib/class-schedule.ts";
import { utcToZonedDateTime, zonedDateTimeToUtc } from "../src/lib/timezone.ts";
import { matchesClassFilter } from "../src/app/dashboard/classes/class-filters.ts";

test("recurrence uses calendar weekdays and excludes the horizon boundary", () => {
  assert.deepEqual(recurringDates("2026-10-28", ["Wed", "Fri"], 7), ["2026-10-28", "2026-10-30"]);
  assert.deepEqual(recurringDates("2026-10-28", [], 14), []);
  assert.equal(addCalendarDays("2026-12-31", 1), "2027-01-01");
});

test("series edits preserve local start time across daylight saving changes", () => {
  const timezone = "America/New_York";
  const original = { startAt: zonedDateTimeToUtc("2026-10-25", "07:00", timezone), timezone };
  const occurrence = { startAt: zonedDateTimeToUtc("2026-11-01", "07:00", timezone), timezone };
  const shifted = shiftedOccurrence(occurrence, original, {
    date: "2026-10-26",
    time: "08:30",
    timezone,
  });
  assert.deepEqual(utcToZonedDateTime(shifted, timezone), { date: "2026-11-02", time: "08:30" });
  assert.equal(shifted.toISOString(), "2026-11-02T13:30:00.000Z");
});

test("series edits support a new timezone and month boundary", () => {
  const original = {
    startAt: zonedDateTimeToUtc("2026-10-31", "07:00", "Africa/Lagos"),
    timezone: "Africa/Lagos",
  };
  const occurrence = {
    startAt: zonedDateTimeToUtc("2026-11-07", "07:00", "Africa/Lagos"),
    timezone: "Africa/Lagos",
  };
  const result = shiftedOccurrence(occurrence, original, {
    date: "2026-11-01",
    time: "18:00",
    timezone: "Asia/Tokyo",
  });
  assert.deepEqual(utcToZonedDateTime(result, "Asia/Tokyo"), { date: "2026-11-08", time: "18:00" });
  assert.deepEqual(shiftedRepeatDays(["Sat", "Tue"], "2026-10-31", "2026-11-01"), ["Sun", "Wed"]);
  assert.deepEqual(shiftedRepeatDays(["Sun"], "2026-11-01", "2026-10-31"), ["Sat"]);
});

test("class filters separate drafts, cancelled, past and upcoming classes", () => {
  const now = new Date("2026-10-28T12:00:00Z");
  const cls = {
    name: "Morning Flow",
    status: "PUBLISHED",
    startAt: new Date("2026-10-29T06:00:00Z"),
  };
  assert.equal(matchesClassFilter(cls, "upcoming", " FLOW ", now), true);
  assert.equal(matchesClassFilter(cls, "upcoming", "pilates", now), false);
  for (const status of ["DRAFT", "CANCELLED", "COMPLETED"])
    assert.equal(matchesClassFilter({ ...cls, status }, "upcoming", "", now), false);
  assert.equal(matchesClassFilter({ ...cls, status: "FULL" }, "upcoming", "", now), true);
  assert.equal(
    matchesClassFilter({ ...cls, startAt: new Date("2026-10-27T06:00:00Z") }, "past", "", now),
    true,
  );
  assert.equal(matchesClassFilter({ ...cls, status: "DRAFT" }, "drafts", "", now), true);
  assert.equal(matchesClassFilter({ ...cls, status: "CANCELLED" }, "past", "", now), false);
});
