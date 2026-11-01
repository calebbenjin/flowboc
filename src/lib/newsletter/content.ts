import sanitizeHtml from "sanitize-html";

import { MAX_CAMPAIGN_CLASSES } from "./templates.ts";
export { MAX_CAMPAIGN_CLASSES };
const marker = /<!--flowboc-class:([a-zA-Z0-9_-]+)-->/g;

export function cleanNewsletterHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [
      "p",
      "br",
      "strong",
      "b",
      "em",
      "i",
      "u",
      "s",
      "ul",
      "ol",
      "li",
      "blockquote",
      "a",
    ],
    allowedAttributes: { a: ["href", "title", "rel"] },
    allowedSchemes: ["https", "http", "mailto"],
    allowProtocolRelative: false,
    transformTags: { a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer" }) },
  });
}

export function readNewsletterContent(stored: string): { bodyHtml: string; classIds: string[] } {
  const classIds = [...stored.matchAll(marker)].map((match) => match[1]!);
  return {
    bodyHtml: cleanNewsletterHtml(stored.replace(marker, "")),
    classIds: [...new Set(classIds)].slice(0, MAX_CAMPAIGN_CLASSES),
  };
}

export function storeNewsletterContent(bodyHtml: string, classIds: string[]): string {
  return (
    cleanNewsletterHtml(bodyHtml) +
    [...new Set(classIds)]
      .map((id) => {
        if (!/^[a-zA-Z0-9_-]+$/.test(id)) throw new Error("Invalid class identifier");
        return `<!--flowboc-class:${id}-->`;
      })
      .join("")
  );
}

export function escapeEmailText(text: string): string {
  return text.replace(
    /[&<>"']/g,
    (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!,
  );
}
