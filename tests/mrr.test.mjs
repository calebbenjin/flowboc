import assert from "node:assert/strict";
import test from "node:test";
import { summarizeMrr } from "../src/lib/mrr.ts";

test("annual plans count as a twelfth of their price", () => {
  const summary = summarizeMrr(
    [
      { price: 15000, interval: "MONTHLY", currency: "NGN" },
      { price: 150000, interval: "ANNUAL", currency: "NGN" },
    ],
    { NGN: 0.001 },
  );
  assert.deepEqual(summary.byCurrency, [
    { currency: "NGN", subscribers: 2, mrr: 27500, usdMrr: 28 },
  ]);
  assert.equal(summary.usdTotal, 28);
});

test("currencies are totalled separately and summed in USD", () => {
  const summary = summarizeMrr(
    [
      { price: 15000, interval: "MONTHLY", currency: "NGN" },
      { price: 200, interval: "MONTHLY", currency: "GHS" },
    ],
    { NGN: 0.001, GHS: 0.08 },
  );
  assert.deepEqual(
    summary.byCurrency.map((c) => [c.currency, c.usdMrr]),
    [
      ["GHS", 16],
      ["NGN", 15],
    ],
  );
  assert.equal(summary.usdTotal, 31);
});

test("a missing rate is excluded from the total and reported", () => {
  const summary = summarizeMrr(
    [
      { price: 15000, interval: "MONTHLY", currency: "NGN" },
      { price: 500, interval: "MONTHLY", currency: "KES" },
    ],
    { NGN: 0.001, KES: null },
  );
  assert.equal(summary.usdTotal, 15);
  assert.deepEqual(summary.missingRates, ["KES"]);
});
