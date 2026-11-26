import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import ts from "typescript";
import { Prisma } from "../src/generated/prisma/client.ts";
import { canUseFullAnalytics } from "../src/lib/analytics/access.ts";
import {
  analyticsWeekStarts,
  currencySeries,
  emptyOfferMetrics,
  illustrativeAnalytics,
} from "../src/lib/analytics/metrics.ts";
import { NEWSLETTER_CONSENT_SOURCES } from "../src/lib/newsletter/consent.ts";
import { zonedDateTimeToUtc } from "../src/lib/timezone.ts";
const account = {
  id: "teacher-a",
  planTier: "PRO",
  planStatus: "ACTIVE",
  trialEndsAt: null,
  compedUntil: null,
  currency: "USD",
  timezone: "Africa/Lagos",
};
function loadAnalytics(overrides = {}) {
  const calls = [];
  const week = analyticsWeekStarts("Africa/Lagos").at(-1);
  const sales = [
    { week, kind: "CLASS", currency: "USD", revenue: 28n, orders: 1n },
    { week, kind: "SESSION", currency: "USD", revenue: 70n, orders: 1n },
    { week, kind: "EBOOK", currency: "USD", revenue: 18n, orders: 1n },
    { week, kind: "EBOOK", currency: "NGN", revenue: 8000n, orders: 1n },
  ];
  const activity = [
    { week, kind: "VIEW", count: 12n },
    { week, kind: "SIGNUP", count: 3n },
    { week, kind: "UNSUBSCRIBE", count: 1n },
  ];
  const dependencies = {
    "server-only": {},
    "@/lib/db": {
      prisma: {
        $queryRaw: async (query) => {
          calls.push(query);
          return calls.length === 1 ? sales : activity;
        },
        newsletterSubscriber: { count: async () => 5 },
        yogaClass: { findMany: async () => [] },
      },
    },
    "@/lib/require-instructor": { requireInstructor: async () => ({ ...account, ...overrides }) },
    "@/lib/analytics/access": { canUseFullAnalytics },
    "@/lib/analytics/metrics": { analyticsWeekStarts, emptyOfferMetrics },
    "@/lib/newsletter/consent": { NEWSLETTER_CONSENT_SOURCES },
    "@/lib/timezone": { zonedDateTimeToUtc },
    "@/generated/prisma/client": { Prisma },
  };
  const source = readFileSync(
    new URL("../src/app/dashboard/analytics/queries.ts", import.meta.url),
    "utf8",
  );
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const exports = {};
  new Function("require", "exports", output)((name) => {
    assert.ok(name in dependencies, name);
    return dependencies[name];
  }, exports);
  return { ...exports, calls };
}
test("Full analytics rejects canceled and expired trial accounts before querying", async () => {
  for (const overrides of [
    { planStatus: "CANCELED" },
    { planStatus: "TRIALING", trialEndsAt: new Date(0) },
  ]) {
    const analytics = loadAnalytics(overrides);
    await assert.rejects(() => analytics.getFullAnalytics(), /eligible plan/);
    assert.equal(analytics.calls.length, 0);
  }
  assert.equal(canUseFullAnalytics({ ...account, planTier: "PREMIUM" }), true);
});
test("revenue and successful orders include all three offers without mixing currencies", async () => {
  const analytics = loadAnalytics({ planTier: "STARTER" });
  const result = await analytics.getFullAnalytics();
  const usd = currencySeries(result.weeks, "USD").at(-1),
    ngn = currencySeries(result.weeks, "NGN").at(-1);
  assert.equal(usd.revenue, 116);
  assert.equal(usd.orders, 3);
  assert.equal(usd.ebookRevenue, 18);
  assert.equal(ngn.revenue, 8000);
  assert.equal(ngn.orders, 1);
  assert.equal(usd.views, 12);
  assert.equal(usd.signups, 3);
  assert.equal(usd.unsubscribes, 1);
  assert.equal(result.activeSubscribers, 5);
  const sales = analytics.calls[0];
  assert.ok(sales.values.includes("teacher-a"));
  assert.equal((sales.sql.match(/"paymentStatus"='PAID'/g) || []).length, 3);
  assert.match(sales.sql, /status='CONFIRMED'/);
});
test("weekly boundaries follow the instructor's timezone across a year boundary", () => {
  const weeks = analyticsWeekStarts("Pacific/Auckland", new Date("2026-12-27T12:00:00Z"));
  assert.equal(weeks.length, 16);
  assert.equal(weeks.at(-1), "2026-12-28");
  assert.equal(
    analyticsWeekStarts("America/Los_Angeles", new Date("2026-12-27T12:00:00Z")).at(-1),
    "2026-12-21",
  );
});
test("locked previews are labelled illustrative and generated independently of instructor records", () => {
  const preview = illustrativeAnalytics("USD", "Africa/Lagos");
  assert.equal(preview.weeks.length, 16);
  assert.ok(currencySeries(preview.weeks, "USD").at(-1).ebookRevenue > 0);
});
