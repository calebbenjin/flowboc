import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import ts from "typescript";
import { escapeEmailText } from "../src/lib/newsletter/content.ts";
import { z } from "zod";

function load(relative, modules, logger = console) {
  const source = readFileSync(new URL(relative, import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const exports = {};
  new Function("require", "exports", "console", compiled)(
    (name) => {
      assert.ok(name in modules, `Unexpected dependency: ${name}`);
      return modules[name];
    },
    exports,
    logger,
  );
  return exports;
}

// Exercise the actual email composer with a mocked transport: no email is sent.
test("contact notifications use the contact inbox, reply-to, and escaped visitor content", async () => {
  const sent = [];
  const site = load("../src/lib/site.ts", {});
  const email = load(
    "../src/lib/email.ts",
    {
      resend: {
        Resend: class {
          emails = {
            send: async (params) => {
              sent.push(params);
              return { error: null };
            },
          };
        },
      },
      "@/lib/newsletter/content": { escapeEmailText },
      "@/lib/format-class-time": {},
      "@/lib/site": site,
      "@/lib/email-layout": {},
    },
    { log() {} },
  );
  await email.sendContactNotificationEmail({
    name: "A <Teacher>",
    email: "teacher@example.com",
    subject: "A question",
    message: "<script>test</script>\nThanks & hello",
  });
  assert.equal(sent[0].to, "mail@flowboc.com");
  assert.equal(sent[0].replyTo, "teacher@example.com");
  assert.equal(sent[0].subject, "Contact form: A question");
  assert.match(sent[0].html, /A &lt;Teacher&gt;/);
  assert.match(sent[0].html, /&lt;script&gt;test&lt;\/script&gt;<br>Thanks &amp; hello/);
  assert.doesNotMatch(sent[0].html, /<script>/);
  assert.match(sent[0].text, /<script>test<\/script>/);
});

const input = {
  name: "Demo Teacher",
  email: "teacher@example.com",
  subject: "Hello",
  message: "A question about my page",
};
function actions({ recent = 0, failLog = false, failEmail = false } = {}) {
  const saved = [],
    notifications = [],
    logs = [];
  const action = load(
    "../src/app/contact/actions.ts",
    {
      zod: { z },
      "next/headers": { headers: async () => new Headers({ "x-forwarded-for": "192.0.2.1" }) },
      "@/lib/db": {
        prisma: {
          contactMessage: {
            count: async () => recent,
            create: async ({ data }) => saved.push(data),
          },
        },
      },
      "@/lib/admin-activity": {
        logAdminActivity: async () => {
          if (failLog) throw new Error("audit unavailable");
        },
      },
      "@/lib/email": {
        sendContactNotificationEmail: async (data) => {
          notifications.push(data);
          if (failEmail) throw new Error("email unavailable");
        },
      },
    },
    { error: (...args) => logs.push(args) },
  );
  return { ...action, saved, notifications, logs };
}
test("saved messages succeed even when audit or email follow-ups fail", async () => {
  for (const options of [
    { failLog: true },
    { failEmail: true },
    { failLog: true, failEmail: true },
  ]) {
    const a = actions(options);
    assert.deepEqual(await a.submitContactForm(input), { ok: true });
    assert.equal(a.saved.length, 1);
    assert.equal(a.notifications.length, 1);
    assert.equal(a.logs.length, Number(!!options.failLog) + Number(!!options.failEmail));
  }
});
test("invalid and rate-limited contacts are neither stored nor emailed", async () => {
  const invalid = actions();
  assert.equal((await invalid.submitContactForm({ ...input, email: "invalid" })).ok, false);
  assert.equal(invalid.saved.length, 0);
  assert.equal(invalid.notifications.length, 0);
  const limited = actions({ recent: 3 });
  assert.equal((await limited.submitContactForm(input)).ok, false);
  assert.equal(limited.saved.length, 0);
  assert.equal(limited.notifications.length, 0);
});
