import assert from "node:assert/strict";
import test from "node:test";
import {
  currencyForCountry,
  isSubscriptionCurrency,
  resolveBillingCurrency,
} from "../src/lib/billing-currency.ts";

test("USD is not a subscription currency", () => {
  assert.equal(isSubscriptionCurrency("USD"), false);
  assert.equal(isSubscriptionCurrency("NGN"), true);
});

test("non-subscribers bill in their own currency", () => {
  assert.equal(
    resolveBillingCurrency({ currency: "KES", planStatus: "TRIALING", activePlanCurrency: null }),
    "KES",
  );
});

test("unsupported currencies have no billing currency", () => {
  for (const currency of ["USD", "GBP", "EUR"]) {
    assert.equal(
      resolveBillingCurrency({ currency, planStatus: "TRIALING", activePlanCurrency: null }),
      null,
    );
  }
});

test("active subscribers stay locked to their plan's currency", () => {
  assert.equal(
    resolveBillingCurrency({ currency: "GHS", planStatus: "ACTIVE", activePlanCurrency: "NGN" }),
    "NGN",
  );
});

test("a legacy USD plan doesn't lock an active subscriber to USD", () => {
  assert.equal(
    resolveBillingCurrency({ currency: "NGN", planStatus: "ACTIVE", activePlanCurrency: "USD" }),
    "NGN",
  );
});

test("canceled subscribers re-subscribe in their current currency", () => {
  assert.equal(
    resolveBillingCurrency({ currency: "ZAR", planStatus: "CANCELED", activePlanCurrency: null }),
    "ZAR",
  );
});

test("visitor country maps to a subscription currency", () => {
  assert.equal(currencyForCountry("NG"), "NGN");
  assert.equal(currencyForCountry("sn"), "XOF");
  assert.equal(currencyForCountry("US"), null);
  assert.equal(currencyForCountry(null), null);
});
