import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import ts from "typescript";
import { z } from "zod";
import { needsPayoutSetup } from "../src/lib/payout-setup.ts";
import { canUseProOffers } from "../src/lib/offer-access.ts";
const active = { planTier: "PRO", planStatus: "ACTIVE", trialEndsAt: null, compedUntil: null };
const denied = [
  { ...active, planTier: "STARTER" },
  { ...active, planStatus: "CANCELED" },
  { ...active, planStatus: "TRIALING", trialEndsAt: new Date(0) },
  { ...active, planStatus: "COMPED", compedUntil: new Date(0) },
];
function loadActions(path, account) {
  const writes = [];
  const dependencies = {
    "@/lib/offer-access": { canUseProOffers },
    "@/lib/payout-setup": { needsPayoutSetup },
    "@/lib/require-instructor": {
      requireInstructor: async () => ({ id: "teacher", slug: "teacher", ...account }),
    },
    "@/lib/db": {
      prisma: {
        instructor: {
          findUnique: async () => ({
            id: "teacher",
            slug: "teacher",
            videoCallEnabled: true,
            consultationLink: "https://example.com/session",
            ebookEnabled: true,
            ebookFileUrl: "https://example.com/ebook.pdf",
            ...account,
          }),
          update: async (data) => writes.push(data),
        },
      },
    },
    "next/cache": { revalidatePath: () => {} },
    zod: { z },
  };
  const source = readFileSync(new URL(path, import.meta.url), "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const exports = {};
  new Function("require", "exports", output)((name) => dependencies[name] ?? {}, exports);
  return { ...exports, writes };
}

test("Pro offer access includes valid Pro/Premium plans and rejects Starter or expired access", () => {
  assert.equal(canUseProOffers(active), true);
  assert.equal(canUseProOffers({ ...active, planTier: "PREMIUM" }), true);
  for (const account of denied) assert.equal(canUseProOffers(account), false);
});
test("ineligible accounts cannot save consultation or ebook offers even via direct server calls", async () => {
  for (const account of denied) {
    const actions = loadActions("../src/app/dashboard/offers/actions.ts", account);
    assert.equal(
      (
        await actions.updateVideoCallOffer({
          enabled: true,
          meetingLink: "https://example.com/session",
        })
      ).ok,
      false,
    );
    assert.equal(
      (await actions.updateEbookOffer({ enabled: true, fileUrl: "https://example.com/ebook.pdf" }))
        .ok,
      false,
    );
    assert.equal(actions.writes.length, 0);
  }
});
test("eligible instructors can still save both offer types", async () => {
  const actions = loadActions("../src/app/dashboard/offers/actions.ts", active);
  assert.equal(
    (
      await actions.updateVideoCallOffer({
        enabled: true,
        meetingLink: "https://example.com/session",
      })
    ).ok,
    true,
  );
  assert.equal(
    (await actions.updateEbookOffer({ enabled: true, fileUrl: "https://example.com/ebook.pdf" }))
      .ok,
    true,
  );
  assert.equal(actions.writes.length, 2);
});
test("direct public consultation booking and ebook checkout reject ineligible instructors", async () => {
  for (const account of denied) {
    const actions = loadActions("../src/app/[slug]/actions.ts", account);
    const input = { slug: "teacher", name: "Student", email: "student@example.com" };
    assert.equal((await actions.bookVideoCall(input)).ok, false);
    assert.equal((await actions.buyEbook(input)).ok, false);
    assert.equal(actions.writes.length, 0);
  }
});

test("paid enabled offers require payouts; hidden drafts and free offers can still save", async () => {
  const actions = loadActions("../src/app/dashboard/offers/actions.ts", active);
  const session = { enabled: true, price: 20, meetingLink: "https://example.com/session" };
  const ebook = { enabled: true, price: 15, fileUrl: "https://example.com/ebook.pdf" };
  assert.equal((await actions.updateVideoCallOffer(session)).ok, false);
  assert.equal((await actions.updateEbookOffer(ebook)).ok, false);
  assert.equal(actions.writes.length, 0);
  assert.equal((await actions.updateVideoCallOffer({ ...session, enabled: false })).ok, true);
  assert.equal((await actions.updateEbookOffer({ ...ebook, enabled: false })).ok, true);
  assert.equal((await actions.updateVideoCallOffer({ ...session, price: 0 })).ok, true);
  assert.equal((await actions.updateEbookOffer({ ...ebook, price: 0 })).ok, true);
  const connected = loadActions("../src/app/dashboard/offers/actions.ts", {
    ...active,
    payoutStatus: "CONNECTED",
    payoutAccountId: "test-account",
  });
  assert.equal((await connected.updateVideoCallOffer(session)).ok, true);
  assert.equal((await connected.updateEbookOffer(ebook)).ok, true);
});
