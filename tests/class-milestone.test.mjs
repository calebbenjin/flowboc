import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import ts from "typescript";
import { needsPayoutSetup } from "../src/lib/payout-setup.ts";
import { recurringDates, buildRecurringLabel } from "../src/lib/class-schedule.ts";

// Exercise the real server actions with an in-memory transaction boundary.
// No database, account, payment, or email is touched by these tests.
function actionsWithHistory(
  history = [],
  account = { payoutStatus: "CONNECTED", payoutAccountId: "test-account" },
) {
  let rows = history.map((row, i) => ({
    id: `class-${i}`,
    instructorId: "teacher",
    status: "DRAFT",
    publishedAt: null,
    recurringDays: [],
    startAt: new Date("2026-11-03T07:00:00Z"),
    timezone: "UTC",
    ...row,
  }));
  const find = (where) => rows.find((row) => row.id === where.id);
  const yogaClass = {
    count: async ({ where }) =>
      rows.filter(
        (row) =>
          row.instructorId === where.instructorId &&
          (row.publishedAt !== null || where.OR[1].status.in.includes(row.status)),
      ).length,
    create: async ({ data }) => {
      const row = { id: randomUUID(), ...data };
      rows.push(row);
      return row;
    },
    createMany: async ({ data }) => {
      for (const row of data) rows.push({ id: randomUUID(), ...row });
      return { count: data.length };
    },
    findUnique: async ({ where }) => find(where) ?? null,
    findMany: async ({ where }) =>
      rows
        .filter(
          (row) => row.instructorId === where.instructorId && (!where.id || row.id === where.id),
        )
        .map((row) => ({ ...row, _count: { bookings: 0 } })),
    update: async ({ where, data }) => Object.assign(find(where), data),
  };
  const prisma = {
    yogaClass,
    $transaction: async (callback, options) => {
      assert.equal(options.isolationLevel, "Serializable");
      const before = structuredClone(rows);
      try {
        return await callback({ yogaClass });
      } catch (error) {
        rows = before;
        throw error;
      }
    },
  };
  const modules = {
    "node:crypto": { randomUUID },
    "@/lib/payout-setup": { needsPayoutSetup },
    "@/lib/db": { prisma },
    "@/lib/require-instructor": {
      requireInstructor: async () => ({ id: "teacher", planTier: "PRO", ...account }),
    },
    "@/lib/class-deadline": { deadlineLabelToMinutes: () => 120 },
    "@/lib/timezone": { zonedDateTimeToUtc: (date, time) => new Date(`${date}T${time}:00Z`) },
    "@/lib/email": {},
    "@/lib/class-recurrence": { RECURRING_HORIZON_OPTIONS: [14, 30, 60] },
    "@/lib/trial": { accessBlockedReason: () => null },
    "@/generated/prisma/client": {
      Prisma: {
        TransactionIsolationLevel: { Serializable: "Serializable" },
        PrismaClientKnownRequestError: class extends Error {},
      },
    },
    "@/lib/class-schedule": {
      recurringDates,
      buildRecurringLabel,
      WEEKDAYS: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    },
  };
  const source = readFileSync(
    new URL("../src/app/dashboard/classes/actions.ts", import.meta.url),
    "utf8",
  );
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const exports = {};
  new Function("require", "exports", compiled)((name) => {
    assert.ok(name in modules, `Unexpected dependency: ${name}`);
    return modules[name];
  }, exports);
  return { ...exports, rows: () => rows };
}
const practice = {
  name: "Morning Flow",
  recurring: false,
  recurringDays: [],
  horizonDays: 30,
  date: "2026-11-02",
  time: "07:00",
  timezone: "UTC",
  durationMinutes: 60,
  online: false,
  capacity: 12,
  price: 28,
  deadlineLabel: "2 hours before start",
  status: "PUBLISHED",
};

test("draft creation is quiet; the first publication celebrates and later classes do not", async () => {
  const actions = actionsWithHistory();
  assert.equal(
    (await actions.createClass({ ...practice, status: "DRAFT" })).firstPublication,
    false,
  );
  assert.equal((await actions.createClass(practice)).firstPublication, true);
  assert.equal((await actions.createClass(practice)).firstPublication, false);
});

test("publishing an existing draft earns the milestone once", async () => {
  const actions = actionsWithHistory([{}]);
  const first = await actions.updateClass("class-0", practice);
  assert.equal(first.firstPublication, true);
  assert.equal(first.classCount, 1);
  assert.equal((await actions.updateClass("class-0", practice)).firstPublication, false);
});

test("cancelled publication history and legacy completed classes prevent repeat celebrations", async () => {
  for (const history of [
    { status: "CANCELLED", publishedAt: new Date() },
    { status: "COMPLETED", publishedAt: null },
  ]) {
    assert.equal(
      (await actionsWithHistory([history]).createClass(practice)).firstPublication,
      false,
    );
  }
});

test("a recurring first publication reports the first actual occurrence and total dates", async () => {
  const actions = actionsWithHistory();
  const result = await actions.createClass({
    ...practice,
    recurring: true,
    recurringDays: ["Tue"],
    horizonDays: 14,
  });
  assert.equal(result.firstPublication, true);
  assert.equal(result.firstDate, "2026-11-03");
  assert.equal(result.classCount, 2);
  assert.equal(actions.rows().length, 2);
});

test("invalid classes cannot trigger a milestone or write rows", async () => {
  const actions = actionsWithHistory();
  assert.equal((await actions.createClass({ ...practice, name: "" })).ok, false);
  assert.equal(actions.rows().length, 0);
});

test("paid publication requires connected payouts, while drafts and free classes remain available", async () => {
  for (const account of [
    { payoutStatus: "NOT_CONNECTED", payoutAccountId: null },
    { payoutStatus: "CONNECTED", payoutAccountId: null },
  ]) {
    const actions = actionsWithHistory([{}], account);
    assert.equal((await actions.createClass(practice)).ok, false);
    assert.equal((await actions.updateClass("class-0", practice)).ok, false);
    assert.equal(actions.rows().length, 1);
    assert.equal(actions.rows()[0].status, "DRAFT");
    assert.equal((await actions.createClass({ ...practice, status: "DRAFT" })).ok, true);
    assert.equal((await actions.createClass({ ...practice, price: 0 })).ok, true);
  }
});
