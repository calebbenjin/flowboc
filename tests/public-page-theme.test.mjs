import assert from "node:assert/strict";
import test from "node:test";
import { canUseProDesign, effectivePublicTheme, publicFont } from "../src/lib/public-page-theme.ts";

const profile = {
  planTier: "PRO",
  planStatus: "ACTIVE",
  trialEndsAt: null,
  compedUntil: null,
  pageTemplate: "SAGE",
  pageFont: "LITERARY",
  coverImageUrl: "https://example.com/cover.jpg",
};

test("Pro themes and fonts are available only with a valid Pro or Premium entitlement", () => {
  assert.equal(canUseProDesign(profile), true);
  assert.equal(canUseProDesign({ ...profile, planTier: "PREMIUM" }), true);
  assert.equal(canUseProDesign({ ...profile, planTier: "STARTER" }), false);
  assert.equal(canUseProDesign({ ...profile, planStatus: "CANCELED" }), false);
  assert.equal(
    canUseProDesign({
      ...profile,
      planStatus: "TRIALING",
      trialEndsAt: new Date(Date.now() - 1000),
    }),
    false,
  );
  assert.equal(
    canUseProDesign({ ...profile, planStatus: "COMPED", compedUntil: new Date(Date.now() - 1000) }),
    false,
  );
});

test("downgrades fall back publicly while retaining the stored theme preferences", () => {
  const downgraded = { ...profile, planTier: "STARTER" };
  assert.deepEqual(effectivePublicTheme(downgraded), {
    pageTemplate: "STANDARD",
    pageFont: "EDITORIAL",
    coverImageUrl: null,
  });
  assert.equal(downgraded.pageTemplate, "SAGE");
  assert.deepEqual(effectivePublicTheme(profile), {
    pageTemplate: "SAGE",
    pageFont: "LITERARY",
    coverImageUrl: profile.coverImageUrl,
  });
});

test("unknown saved appearance values fall back to supported defaults", () => {
  assert.equal(publicFont("unknown").value, "EDITORIAL");
  assert.equal(publicFont("MODERN").heading, publicFont("MODERN").body);
  assert.deepEqual(
    effectivePublicTheme({ ...profile, pageTemplate: "unknown", pageFont: "unknown" }),
    { pageTemplate: "STANDARD", pageFont: "EDITORIAL", coverImageUrl: profile.coverImageUrl },
  );
});
