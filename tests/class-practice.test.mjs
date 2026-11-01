import assert from "node:assert/strict";
import test from "node:test";
import { suggestedClassDate } from "../src/lib/class-practice.ts";

test("class date suggestions use the instructor's day across the date line", () => {
  const now = new Date("2026-10-31T23:30:00Z");
  assert.equal(suggestedClassDate("Africa/Lagos", 1, now), "2026-11-02");
  assert.equal(suggestedClassDate("America/Los_Angeles", 1, now), "2026-11-01");
});

test("class date suggestions advance calendar days across DST and year boundaries", () => {
  assert.equal(
    suggestedClassDate("America/New_York", 1, new Date("2026-03-08T04:30:00Z")),
    "2026-03-08",
  );
  assert.equal(
    suggestedClassDate("Africa/Lagos", 7, new Date("2026-12-28T12:00:00Z")),
    "2027-01-04",
  );
});
