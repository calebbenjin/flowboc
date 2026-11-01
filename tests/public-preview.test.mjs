import assert from "node:assert/strict";
import test from "node:test";
import { publicDesignSchema } from "../src/lib/public-preview.ts";
const settings = {
  pageTemplate: "SAGE",
  pageFont: "EDITORIAL",
  coverImageUrl: null,
  themeColor: "#6355ff",
  pageLayout: "CLASSIC",
  backgroundType: "IMAGE",
  backgroundImageUrl: null,
  backgroundColor: null,
  backgroundGradientFrom: null,
  backgroundGradientTo: null,
};
test("public design previews accept both live templates and retain explicit background resets", () => {
  assert.deepEqual(publicDesignSchema.parse(settings), settings);
  assert.equal(
    publicDesignSchema.parse({
      ...settings,
      pageTemplate: "STANDARD",
      backgroundType: "COLOR",
      backgroundColor: "#faf7ee",
    }).pageTemplate,
    "STANDARD",
  );
});
test("preview messages reject unsupported design settings before overriding the public renderer", () => {
  for (const update of [
    { pageTemplate: "UNSUPPORTED" },
    { pageFont: "UNKNOWN" },
    { themeColor: "invalid" },
    { pageLayout: "other" },
    { backgroundType: "other" },
  ])
    assert.equal(publicDesignSchema.safeParse({ ...settings, ...update }).success, false);
});
