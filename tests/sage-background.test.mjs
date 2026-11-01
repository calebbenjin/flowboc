import assert from "node:assert/strict";
import test from "node:test";
import { sageBackgroundStyle } from "../src/lib/sage-background.ts";

test("solid backgrounds remove the Sage gradient and adapt profile contrast", () => {
  const dark = sageBackgroundStyle({ backgroundType: "COLOR", backgroundColor: "#111827" });
  assert.equal(dark.backgroundColor, "#111827");
  assert.equal(dark.backgroundImage, "none");
  assert.equal(dark["--sage-profile-ink"], "#fffdf7");
  assert.equal(
    sageBackgroundStyle({ backgroundType: "COLOR", backgroundColor: "#ffffff" })[
      "--sage-profile-ink"
    ],
    "#303b2d",
  );
});

test("gradient and image settings replace the default background", () => {
  const gradient = sageBackgroundStyle({
    backgroundType: "GRADIENT",
    backgroundGradientFrom: "#111827",
    backgroundGradientTo: "#6355ff",
  });
  assert.equal(gradient.backgroundImage, "linear-gradient(135deg, #111827, #6355ff)");
  const image = sageBackgroundStyle({
    backgroundType: "IMAGE",
    backgroundImageUrl: "https://example.com/photo.jpg",
  });
  assert.match(image.backgroundImage, /url\(https:\/\/example.com\/photo.jpg\)/);
  assert.match(image.backgroundImage, /linear-gradient/);
  assert.equal(image["--sage-profile-ink"], "#303b2d");
});

test("cleared background settings restore the Sage default", () => {
  assert.match(
    sageBackgroundStyle({ backgroundType: "IMAGE", backgroundImageUrl: null }).backgroundImage,
    /radial-gradient/,
  );
});
