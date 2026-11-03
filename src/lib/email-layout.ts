// Shared email presentation uses inline styles and tables so the content stays
// readable when a mail client ignores media queries, rounded corners, or images.
import { contactEmail } from "@/lib/site";

const ASSET_BASE = "https://flowboc.com";
const LOGO_URL = `${ASSET_BASE}/flowboc-launch/assets/flowboc-logo.png`;
const COLOR = {
  page: "#f7f5ef",
  paper: "#ffffff",
  line: "#e8e2ef",
  ink: "#30293e",
  muted: "#70677c",
  purple: "#6355ff",
  lavender: "#f0ecff",
};

function escapeText(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );
}
function escapeAttr(value: string): string {
  return escapeText(value);
}

export function emailButton(label: string, url: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0 12px;"><tr><td bgcolor="${COLOR.purple}" style="border-radius:12px;text-align:center;mso-padding-alt:16px 28px;"><a href="${escapeAttr(url)}" style="display:inline-block;border:1px solid ${COLOR.purple};border-radius:12px;padding:15px 26px;color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:22px;font-weight:600;text-align:center;text-decoration:none;">${escapeText(label)}&nbsp; &rarr;</a></td></tr></table>`;
}

export function emailCode(code: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;"><tr><td align="center" bgcolor="${COLOR.lavender}" style="padding:24px 12px;border:1px solid ${COLOR.line};border-radius:14px;"><p style="margin:0 0 12px;font-size:11px;line-height:16px;font-weight:600;letter-spacing:2px;color:${COLOR.muted};">YOUR VERIFICATION CODE</p><p style="margin:0;font-family:Consolas,'Courier New',monospace;font-size:34px;line-height:44px;font-weight:700;letter-spacing:7px;color:${COLOR.purple};">${escapeText(code)}</p></td></tr></table>`;
}

function documentHead(): string {
  return `<head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /><meta name="color-scheme" content="light" /><meta name="supported-color-schemes" content="light" /><style>body{margin:0!important;padding:0!important}table{border-collapse:separate}img{border:0;outline:none;text-decoration:none}a{color:${COLOR.purple}}p{margin:0 0 16px}@media only screen and (max-width:600px){.outer{padding:20px 12px!important}.content{padding:28px 22px!important}.email-heading{font-size:29px!important;line-height:35px!important}.brand{padding:8px 4px 22px!important}}</style></head>`;
}

export function emailLayout(input: {
  heading: string;
  bodyHtml: string;
  footerHtml?: string;
  preheader?: string;
  eyebrow?: string;
}): string {
  return `<!doctype html><html lang="en">${documentHead()}
<body style="margin:0;padding:0;background-color:${COLOR.page};color:${COLOR.ink};font-family:Arial,Helvetica,sans-serif;">
<div style="display:none;font-size:1px;line-height:1px;color:${COLOR.page};max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">${escapeText(input.preheader ?? input.heading)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${COLOR.page}"><tr><td class="outer" align="center" style="padding:40px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:580px;">
<tr><td class="brand" align="center" style="padding:0 8px 28px;"><a href="${ASSET_BASE}" style="text-decoration:none;"><img src="${LOGO_URL}" alt="Flowboc" width="126" style="display:block;width:126px;max-width:100%;height:auto;color:${COLOR.purple};font-size:24px;font-weight:700;" /></a></td></tr>
<tr><td bgcolor="${COLOR.paper}" style="border:1px solid ${COLOR.line};border-top:4px solid ${COLOR.purple};border-radius:20px;overflow:hidden;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
<tr><td style="padding:18px 24px;background:${COLOR.lavender};border-radius:16px 16px 0 0;text-align:center;font-size:10px;line-height:16px;font-weight:600;letter-spacing:2px;color:${COLOR.purple};">${escapeText(input.eyebrow ?? "A LITTLE SPACE FOR YOUR PRACTICE")}</td></tr>
<tr><td class="content" style="padding:36px;">
<h1 class="email-heading" style="margin:0 0 24px;font-family:Georgia,'Times New Roman',serif;font-weight:400;font-size:34px;line-height:41px;letter-spacing:-0.6px;color:${COLOR.ink};">${escapeText(input.heading)}</h1>
<div style="font-size:16px;line-height:27px;color:${COLOR.ink};">${input.bodyHtml}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:28px;"><tr><td style="border-top:1px solid ${COLOR.line};padding-top:20px;font-size:12px;line-height:20px;color:${COLOR.muted};">With care,<br /><strong style="font-weight:600;color:${COLOR.ink};">The Flowboc team</strong></td></tr></table>
</td></tr></table></td></tr>
<tr><td align="center" style="padding:26px 20px 0;font-size:12px;line-height:21px;color:${COLOR.muted};">${input.footerHtml ?? `Need a hand? <a href="mailto:${contactEmail}" style="color:${COLOR.purple};text-decoration:underline;">${contactEmail}</a><br /><span>Your teaching. A little more room to grow.</span>`}</td></tr>
</table></td></tr></table></body></html>`;
}

// Instructor-authored campaigns keep their own voice and content first.
// Legal/unsubscribe footer HTML is passed through intact.
export function newsletterLayout(input: { bodyHtml: string; footerHtml: string }): string {
  return `<!doctype html><html lang="en">${documentHead()}
<body style="margin:0;padding:0;background:${COLOR.page};font-family:Arial,Helvetica,sans-serif;color:${COLOR.ink};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${COLOR.page}"><tr><td class="outer" align="center" style="padding:32px 16px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:580px;"><tr><td class="content" bgcolor="${COLOR.paper}" style="border:1px solid ${COLOR.line};border-top:3px solid ${COLOR.purple};border-radius:16px;padding:36px;"><div style="font-size:16px;line-height:27px;color:${COLOR.ink};">${input.bodyHtml}</div></td></tr>
<tr><td align="center" style="padding:24px 16px 0;font-size:12px;line-height:21px;color:${COLOR.muted};">${input.footerHtml}<p style="margin:18px 0 0;font-size:11px;">A little connection, sent with <a href="${ASSET_BASE}" style="color:${COLOR.purple};text-decoration:none;font-weight:600;">Flowboc</a></p></td></tr></table>
</td></tr></table></body></html>`;
}
