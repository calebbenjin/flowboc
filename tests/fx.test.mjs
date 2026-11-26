import assert from "node:assert/strict";
import test from "node:test";
import { convertAmount, getFxRate } from "../src/lib/fx.ts";

test("same-currency conversion needs no lookup", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = () => assert.fail("should not fetch");
  try {
    assert.equal(await getFxRate("NGN", "NGN"), 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("reads the target rate from the table", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () =>
    Response.json({ result: "success", rates: { NGN: 1, GHS: 0.0095 } });
  try {
    assert.equal(await getFxRate("NGN", "GHS"), 0.0095);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("an unavailable rate is null, never a guess", async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async () => {
      throw new Error("network down");
    };
    assert.equal(await getFxRate("NGN", "KES"), null);
    globalThis.fetch = async () => Response.json({ result: "error" });
    assert.equal(await getFxRate("NGN", "KES"), null);
    globalThis.fetch = async () => new Response("", { status: 500 });
    assert.equal(await getFxRate("NGN", "KES"), null);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("converted amounts round to whole units", () => {
  assert.equal(convertAmount(3000, 0.0095), 29);
  assert.equal(convertAmount(250, 1), 250);
});
