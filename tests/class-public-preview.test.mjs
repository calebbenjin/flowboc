import assert from "node:assert/strict";
import test from "node:test";
import { draftToPublicClasses } from "../src/lib/class-public-preview.ts";
import { utcToZonedDateTime } from "../src/lib/timezone.ts";

const draft = {
  name: "Morning Flow",
  description: "A full description for your practice",
  coverUrl: "https://example.com/cover.jpg",
  date: "2030-03-05",
  time: "07:30",
  timezone: "America/New_York",
  durationMinutes: 45,
  online: true,
  location: "https://example.com/meet",
  price: 28,
  originalPrice: 35,
  capacity: 18,
};
const now = new Date("2030-03-01T00:00:00Z");
test("public preview receives the actual class data, availability, and instructor timezone", () => {
  const [cls] = draftToPublicClasses(draft, now);
  assert.equal(cls.name, draft.name);
  assert.equal(cls.description, draft.description);
  assert.equal(cls.coverUrl, draft.coverUrl);
  assert.equal(cls.spots, 18);
  assert.equal(cls.capacity, 18);
  assert.equal(cls.mode, "ONLINE");
  assert.equal(cls.location, draft.location);
  assert.equal(cls.price, 28);
  assert.equal(cls.originalPrice, 35);
  assert.equal(cls.durationMinutes, 45);
  assert.deepEqual(utcToZonedDateTime(cls.startAt, cls.timezone), {
    date: "2030-03-05",
    time: "07:30",
  });
});
test("recurring preview uses publication schedule and preserves local times across DST", () => {
  const classes = draftToPublicClasses(
    { ...draft, recurring: true, recurringDays: ["Tue", "Thu"], horizonDays: 14 },
    now,
  );
  assert.equal(classes.length, 4);
  assert.ok(
    classes.every(
      (cls) =>
        cls.seriesId === "preview-draft-series" &&
        cls.recurringLabel === "Every Tuesday & Thursday",
    ),
  );
  assert.deepEqual(
    classes.map((cls) => utcToZonedDateTime(cls.startAt, cls.timezone).time),
    ["07:30", "07:30", "07:30", "07:30"],
  );
  assert.equal(classes[0].startAt.getUTCHours(), 12);
  assert.equal(classes[2].startAt.getUTCHours(), 11);
});
test("incomplete schedules and past occurrences do not invent a publicly visible class", () => {
  assert.deepEqual(draftToPublicClasses({ ...draft, date: "" }, now), []);
  assert.deepEqual(draftToPublicClasses({ ...draft, timezone: "invalid/timezone" }, now), []);
  assert.deepEqual(draftToPublicClasses(draft, new Date("2031-01-01T00:00:00Z")), []);
  assert.deepEqual(draftToPublicClasses({ ...draft, recurring: true, recurringDays: [] }, now), []);
});
