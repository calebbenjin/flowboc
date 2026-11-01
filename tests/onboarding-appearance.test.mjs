import assert from "node:assert/strict";
import test from "node:test";
import { onboardingAppearance, ONBOARDING_MOODS } from "../src/lib/onboarding-appearance.ts";

test("onboarding cannot persist a Pro theme without design access", () => {
  for (const mood of Object.keys(ONBOARDING_MOODS))
    assert.equal(onboardingAppearance(mood, false), null);
});

test("onboarding rejects unknown moods, including inherited property names", () => {
  for (const mood of ["", "unknown", "__proto__", "constructor", "toString"])
    assert.equal(onboardingAppearance(mood, true), null);
});

test("each eligible mood persists the matching Sage palette and color background", () => {
  for (const [mood, palette] of Object.entries(ONBOARDING_MOODS)) {
    assert.deepEqual(onboardingAppearance(mood, true), {
      pageTemplate: "SAGE",
      themeColor: palette.color,
      backgroundType: "COLOR",
      backgroundColor: palette.background,
    });
  }
});
