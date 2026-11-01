import assert from "node:assert/strict";
import test from "node:test";
import {
  cleanNewsletterHtml,
  readNewsletterContent,
  storeNewsletterContent,
  escapeEmailText,
} from "../src/lib/newsletter/content.ts";
import { newsletterSendError } from "../src/lib/newsletter/access.ts";
import { newsletterTemplates } from "../src/lib/newsletter/templates.ts";

test("newsletter HTML preserves editor formatting but removes scripts and unsafe links", () => {
  const html = cleanNewsletterHtml(
    '<p>Hello <strong>students</strong></p><script>alert(1)</script><img src=x onerror=alert(1)><a href="javascript:alert(1)">Book</a><a href="https://flowboc.com/class" onclick="alert(1)">Safe</a>',
  );
  assert.match(html, /<strong>students<\/strong>/);
  assert.match(html, /href="https:\/\/flowboc.com\/class"/);
  assert.doesNotMatch(html, /script|onerror|onclick|javascript|<img/);
});

test("drafts retain ordered class cards without allowing message content to forge a card", () => {
  const stored = storeNewsletterContent("<p>Join us</p><!--flowboc-class:foreign-class-->", [
    "class-b",
    "class-a",
    "class-b",
  ]);
  assert.deepEqual(readNewsletterContent(stored), {
    bodyHtml: "<p>Join us</p>",
    classIds: ["class-b", "class-a"],
  });
  assert.throws(
    () => storeNewsletterContent("<p>Hi</p>", ["bad-->id"]),
    /Invalid class identifier/,
  );
  assert.equal(escapeEmailText('<class name="A&B">'), "&lt;class name=&quot;A&amp;B&quot;&gt;");
});

test("Pro newsletter access respects tier, expired trials and subscription state", () => {
  const active = { planTier: "PRO", planStatus: "ACTIVE", trialEndsAt: null, compedUntil: null };
  assert.equal(newsletterSendError(active), null);
  assert.equal(newsletterSendError({ ...active, planTier: "PREMIUM" }), null);
  assert.ok(newsletterSendError({ ...active, planTier: "STARTER" }));
  assert.ok(newsletterSendError({ ...active, planStatus: "CANCELED" }));
  assert.ok(
    newsletterSendError({
      ...active,
      planStatus: "TRIALING",
      trialEndsAt: new Date(Date.now() - 60000),
    }),
  );
  assert.equal(
    newsletterSendError({
      ...active,
      planStatus: "TRIALING",
      trialEndsAt: new Date(Date.now() + 60000),
    }),
    null,
  );
  assert.ok(
    newsletterSendError({
      ...active,
      planStatus: "COMPED",
      compedUntil: new Date(Date.now() - 60000),
    }),
  );
  assert.equal(newsletterSendError({ ...active, planStatus: "PAST_DUE" }), null);
});

test("three distinct templates provide nonempty editable subjects and messages", () => {
  assert.equal(newsletterTemplates.length, 3);
  assert.equal(new Set(newsletterTemplates.map((template) => template.id)).size, 3);
  for (const template of newsletterTemplates) {
    assert.ok(template.subject.length > 0 && template.subject.length <= 200);
    assert.match(cleanNewsletterHtml(template.bodyHtml), /<p>.+<\/p>/);
  }
});
