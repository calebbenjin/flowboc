import assert from "node:assert/strict";
import test from "node:test";
import {
  hasNewsletterConsent,
  newsletterAudienceStatus,
  NEWSLETTER_CONSENT_SOURCES,
} from "../src/lib/newsletter/consent.ts";
import { recordCheckoutNewsletterConsent } from "../src/lib/newsletter/subscribe.ts";

test("legacy and unknown sources cannot receive newsletters", () => {
  for (const source of ["booking", null, "import", ""]) {
    assert.equal(hasNewsletterConsent({ status: "SUBSCRIBED", source }), false);
    assert.equal(newsletterAudienceStatus({ status: "SUBSCRIBED", source }), "consent needed");
  }
  for (const source of NEWSLETTER_CONSENT_SOURCES) {
    assert.equal(hasNewsletterConsent({ status: "SUBSCRIBED", source }), true);
    assert.equal(hasNewsletterConsent({ status: "UNSUBSCRIBED", source }), false);
    assert.equal(newsletterAudienceStatus({ status: "UNSUBSCRIBED", source }), "unsubscribed");
  }
});

test("unchecked and omitted checkout consent do not modify existing subscription state", async () => {
  const tx = {
    newsletterSubscriber: {
      upsert: () => {
        throw new Error("Must not write without consent");
      },
    },
  };
  for (const newsletterOptIn of [undefined, false, "true", "false", 1]) {
    await recordCheckoutNewsletterConsent(tx, {
      instructorId: "teacher",
      email: "student@example.com",
      name: "Student",
      source: "class_checkout",
      newsletterOptIn,
    });
  }
});

test("each checkout records explicit consent with a normalized, instructor-scoped email", async () => {
  for (const source of ["class_checkout", "ebook_checkout", "video_call_checkout"]) {
    const calls = [];
    const tx = {
      newsletterSubscriber: {
        upsert: async (query) => {
          calls.push(query);
        },
      },
    };
    await recordCheckoutNewsletterConsent(tx, {
      instructorId: "teacher",
      email: " Student@Example.COM ",
      name: " Student ",
      source,
      newsletterOptIn: true,
    });
    assert.equal(calls.length, 1);
    const query = calls[0];
    assert.deepEqual(query.where.instructorId_email, {
      instructorId: "teacher",
      email: "student@example.com",
    });
    assert.equal(query.create.source, source);
    assert.equal(query.create.status, "SUBSCRIBED");
    assert.equal(query.create.name, "Student");
    assert.match(query.create.unsubscribeToken, /^[a-f0-9]{48}$/);
    // Fresh affirmative consent can re-subscribe an opted-out person; keep their token valid.
    assert.equal(query.update.status, "SUBSCRIBED");
    assert.equal(query.update.source, source);
    assert.equal(query.update.unsubscribedAt, null);
    assert.ok(query.update.subscribedAt instanceof Date);
    assert.equal("unsubscribeToken" in query.update, false);
  }
});
