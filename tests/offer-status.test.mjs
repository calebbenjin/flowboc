import assert from "node:assert/strict";
import test from "node:test";
import { offerState } from "../src/lib/offer-status.ts";
const offer = {
  enabled: false,
  hasContent: false,
  hasRequiredAsset: false,
  price: null,
  payoutConnected: false,
};

test("new instructors see setup actions, while saved hidden offers remain editable", () => {
  assert.equal(offerState(offer).configured, false);
  assert.equal(offerState({ ...offer, hasContent: true }).configured, true);
  assert.equal(offerState({ ...offer, hasContent: true }).ready, false);
});

test("paid enabled offers need connected payouts; free complete offers do not", () => {
  const enabled = { ...offer, enabled: true, hasContent: true, hasRequiredAsset: true };
  assert.equal(offerState({ ...enabled, price: 28 }).label, "Connect payouts");
  assert.equal(offerState({ ...enabled, price: 28, payoutConnected: true }).ready, true);
  assert.equal(offerState({ ...enabled, price: null }).ready, true);
  assert.equal(offerState({ ...enabled, price: 0 }).ready, true);
});

test("enabled offers with a missing ebook file or meeting link never appear ready", () => {
  for (const payoutConnected of [false, true])
    assert.equal(
      offerState({ ...offer, enabled: true, hasContent: true, price: 28, payoutConnected }).label,
      "Finish setup",
    );
});
