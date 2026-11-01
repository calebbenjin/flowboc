import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import ts from "typescript";
import { canUseNewsletter, newsletterButtonVisible } from "../src/lib/newsletter/access.ts";

function visibilityActions(authenticated = true, overrides = {}) {
  const writes = [];
  const invalidations = [];
  const dependencies = {
    "@/lib/newsletter/access": { canUseNewsletter },
    "@/lib/db": { prisma: { instructor: { update: async (query) => writes.push(query) } } },
    "@/lib/require-instructor": {
      requireInstructor: async () => {
        if (!authenticated) throw new Error("Not authenticated");
        return {
          id: "teacher-a",
          slug: "teacher-a",
          planTier: "PRO",
          planStatus: "ACTIVE",
          trialEndsAt: null,
          compedUntil: null,
          ...overrides,
        };
      },
    },
    "next/cache": { revalidatePath: (path) => invalidations.push(path) },
  };
  const source = readFileSync(
    new URL("../src/app/dashboard/newsletter/actions.ts", import.meta.url),
    "utf8",
  );
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const exports = {};
  new Function("require", "exports", output)((name) => {
    assert.ok(name in dependencies);
    return dependencies[name];
  }, exports);
  return { ...exports, writes, invalidations };
}

test("newsletter visibility updates only the signed-in instructor's display preference", async () => {
  for (const enabled of [false, true]) {
    const actions = visibilityActions();
    assert.equal((await actions.setNewsletterVisibility(enabled)).ok, true);
    assert.deepEqual(actions.writes, [
      { where: { id: "teacher-a" }, data: { newsletterEnabled: enabled } },
    ]);
    assert.ok(actions.invalidations.includes("/teacher-a"));
    assert.ok(actions.invalidations.includes("/dashboard/newsletter"));
    assert.ok(actions.invalidations.includes("/dashboard/booking-page"));
  }
});

test("unauthenticated or malformed visibility changes cannot write a preference", async () => {
  const unauthorized = visibilityActions(false);
  await assert.rejects(() => unauthorized.setNewsletterVisibility(false), /Not authenticated/);
  assert.equal(unauthorized.writes.length, 0);
  const actions = visibilityActions();
  for (const value of ["false", null, 0, undefined])
    assert.equal((await actions.setNewsletterVisibility(value)).ok, false);
  assert.equal(actions.writes.length, 0);
});

test("Starter and expired Pro accounts cannot change visibility or show the public button", async () => {
  for (const overrides of [
    { planTier: "STARTER" },
    { planStatus: "CANCELED" },
    { planStatus: "TRIALING", trialEndsAt: new Date(0) },
  ]) {
    const actions = visibilityActions(true, overrides);
    assert.equal((await actions.setNewsletterVisibility(true)).ok, false);
    assert.equal((await actions.setNewsletterVisibility(false)).ok, false);
    assert.equal(actions.writes.length, 0);
    assert.equal(
      newsletterButtonVisible({
        planTier: "PRO",
        planStatus: "ACTIVE",
        trialEndsAt: null,
        compedUntil: null,
        newsletterEnabled: true,
        ...overrides,
      }),
      false,
    );
  }
});
test("eligible Pro and Premium pages respect the saved visibility choice", () => {
  for (const planTier of ["PRO", "PREMIUM"]) {
    const account = { planTier, planStatus: "ACTIVE", trialEndsAt: null, compedUntil: null };
    assert.equal(newsletterButtonVisible(account), true);
    assert.equal(newsletterButtonVisible({ ...account, newsletterEnabled: false }), false);
  }
});
