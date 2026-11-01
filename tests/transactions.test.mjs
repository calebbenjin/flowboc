import assert from "node:assert/strict";
import test from "node:test";
import ts from "typescript";
import { readFileSync } from "node:fs";
import { Prisma } from "../src/generated/prisma/client.ts";
import { parseTransactionFilters, transactionPageHref } from "../src/lib/transactions/filters.ts";

function transactions({ admin = true, instructor = true, total = 60n } = {}) {
  const queries = [];
  const query = async (sql) => {
    queries.push(sql);
    return sql.sql.includes("count(*)") ? [{ total }] : [];
  };
  const dependencies = {
    "server-only": {},
    "@/lib/db": {
      prisma: {
        $transaction: async (callback, options) => {
          assert.equal(options.isolationLevel, "RepeatableRead");
          return callback({ $queryRaw: query });
        },
      },
    },
    "@/generated/prisma/client": { Prisma },
    "@/lib/require-admin": {
      requireAdmin: async () => {
        if (!admin) throw new Error("Not authorized");
      },
    },
    "@/lib/require-instructor": {
      requireInstructor: async () => {
        if (!instructor) throw new Error("Not authenticated");
        return { id: "teacher-a" };
      },
    },
    "./filters": { parseTransactionFilters },
  };
  const source = readFileSync(
    new URL("../src/lib/transactions/queries.ts", import.meta.url),
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
  return { ...exports, queries };
}

test("transaction dates include the entire UTC end day and reject impossible ranges", () => {
  const filters = parseTransactionFilters({ from: "2026-10-31", to: "2026-11-01" });
  assert.equal(filters.start.toISOString(), "2026-10-31T00:00:00.000Z");
  assert.equal(filters.endExclusive.toISOString(), "2026-11-02T00:00:00.000Z");
  for (const params of [
    { from: "2026-02-30" },
    { from: "2026-12-01", to: "2026-11-01" },
    { min: "50", max: "20" },
    { min: "-1" },
    { type: "bogus" },
    { status: "bogus" },
    { currency: "bogus" },
  ])
    assert.ok(parseTransactionFilters(params).errors.length);
});

test("both queries require the appropriate account access before touching the database", async () => {
  const deniedAdmin = transactions({ admin: false });
  await assert.rejects(() => deniedAdmin.getAdminTransactions({}), /Not authorized/);
  assert.equal(deniedAdmin.queries.length, 0);
  const deniedInstructor = transactions({ instructor: false });
  await assert.rejects(() => deniedInstructor.getInstructorTransactions({}), /Not authenticated/);
  assert.equal(deniedInstructor.queries.length, 0);
});

test("instructors are always scoped to their authenticated ID even with a forged instructor filter", async () => {
  const service = transactions();
  await service.getInstructorTransactions({ instructor: "teacher-b", type: "EBOOK" });
  for (const query of service.queries) {
    assert.match(query.sql, /t\."instructorId" = \?/);
    assert.ok(query.values.includes("teacher-a"));
    assert.ok(!query.values.includes("teacher-b"));
    assert.ok(query.values.includes("EBOOK"));
    for (const source of ["Booking", "VideoCallBooking", "EbookPurchase"])
      assert.ok(query.sql.includes(`"${source}"`));
    assert.ok(!query.sql.includes("downloadToken"));
  }
});

test("search text is bound as data and pagination is clamped to the last available page", async () => {
  const service = transactions();
  const q = "x'); DROP TABLE Instructor; -- %_";
  const result = await service.getAdminTransactions({
    q,
    instructor: "sarah",
    page: "9999",
    pageSize: "25",
    status: "PAID",
  });
  assert.equal(result.page, 3);
  for (const query of service.queries) {
    assert.ok(!query.sql.includes(q));
    assert.ok(query.values.includes(q));
    assert.ok(query.values.includes("sarah"));
    assert.ok(query.values.includes("PAID"));
  }
  assert.deepEqual(service.queries[1].values.slice(-2), [25, 50]);
});

test("invalid filters cannot run a broad unfiltered query; pagination preserves filters", async () => {
  const service = transactions();
  const result = await service.getAdminTransactions({ min: "50", max: "20" });
  assert.ok(result.errors.length);
  assert.equal(service.queries.length, 0);
  const href = transactionPageHref(
    "/admin/transactions",
    { q: "Sarah & Yoga", status: "PAID", page: "1" },
    2,
  );
  const url = new URL(href, "https://example.com");
  assert.equal(url.searchParams.get("q"), "Sarah & Yoga");
  assert.equal(url.searchParams.get("status"), "PAID");
  assert.equal(url.searchParams.get("page"), "2");
});
