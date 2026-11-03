import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import ts from "typescript";

const source = readFileSync(new URL("../src/lib/email-layout.ts", import.meta.url), "utf8");
const exports = {};
new Function(
  "require",
  "exports",
  ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText,
)((id) => {
  assert.equal(id, "@/lib/site");
  return { contactEmail: "mail@flowboc.com" };
}, exports);
const { emailLayout, emailButton, emailCode, newsletterLayout } = exports;

test("email layout escapes metadata while retaining the email body and support destination", () => {
  const html = emailLayout({
    heading: "<Teacher & team>",
    preheader: "<preview>",
    eyebrow: "<Welcome>",
    bodyHtml: "<p>A confirmed place.</p>",
  });
  assert.match(html, /&lt;Teacher &amp; team&gt;/);
  assert.match(html, /&lt;preview&gt;/);
  assert.match(html, /&lt;Welcome&gt;/);
  assert.match(html, /<p>A confirmed place.<\/p>/);
  assert.match(html, /mailto:mail@flowboc.com/);
  assert.match(html, /max-width:600px/);
});
test("buttons preserve signed URLs without allowing attribute or label injection", () => {
  const html = emailButton("<Reset>", 'https://example.com/reset?token=a&next="demo"');
  assert.match(html, /token=a&amp;next=&quot;demo&quot;/);
  assert.match(html, /&lt;Reset&gt;/);
  assert.match(html, /<table role="presentation"/);
  assert.match(emailCode("<123456>"), /&lt;123456&gt;/);
});
test("newsletter layout preserves authored content and unsubscribe footer", () => {
  const body = "<h2>Our next practice</h2><p>Hello students.</p>";
  const footer = '<a href="https://example.com/unsubscribe?token=demo">Unsubscribe</a>';
  const html = newsletterLayout({ bodyHtml: body, footerHtml: footer });
  assert.ok(html.includes(body));
  assert.ok(html.includes(footer));
  assert.doesNotMatch(html, /The Flowboc team/);
});
