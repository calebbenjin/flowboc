// Shared visual layer for every outgoing email — mirrors the app's sand/clay
// theme (see globals.css) in hex, since email clients can't resolve CSS
// variables or oklch(). Table-based layout for Outlook/old-client support.

// Always the production domain, never siteUrl — email images are fetched by
// the recipient's mail client, which can never reach a local dev server.
const ASSET_BASE = "https://flowboc.com";
const LOGO_URL = `${ASSET_BASE}/flowboc-brand-logo.png`;
const FAVICON_URL = `${ASSET_BASE}/flowboc-favicon.png`;

const COLOR = {
  pageBg: "#f7f3ea",
  cardBg: "#fffdf8",
  border: "#e4dcc9",
  foreground: "#2e2a24",
  muted: "#8a8171",
  primary: "#6355ff",
  primaryText: "#fdfcff",
};

function escapeAttr(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

export function emailButton(label: string, url: string): string {
  return `<a href="${escapeAttr(url)}" style="display:inline-block;margin-top:8px;padding:12px 24px;border-radius:10px;background:${COLOR.primary};color:${COLOR.primaryText};font-weight:600;font-size:15px;text-decoration:none;">${label}</a>`;
}

export function emailLayout(input: {
  heading: string;
  bodyHtml: string;
  footerHtml?: string;
}): string {
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <link rel="icon" href="${FAVICON_URL}" />
  </head>
  <body style="margin:0;padding:32px 16px;background:${COLOR.pageBg};font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center">
          <table role="presentation" width="560" style="max-width:560px;width:100%;" cellpadding="0" cellspacing="0">
            <tr>
              <td align="center" style="padding:0 0 24px;">
                <img src="${LOGO_URL}" alt="Flowboc" height="28" style="height:28px;width:auto;display:inline-block;" />
              </td>
            </tr>
            <tr>
              <td style="background:${COLOR.cardBg};border:1px solid ${COLOR.border};border-radius:16px;padding:32px;">
                <h1 style="margin:0 0 16px;font-family:Georgia,'Times New Roman',serif;font-weight:700;font-size:21px;color:${COLOR.foreground};">${input.heading}</h1>
                <div style="font-size:15px;line-height:1.65;color:${COLOR.foreground};">${input.bodyHtml}</div>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:24px 8px 0;font-size:12px;line-height:1.6;color:${COLOR.muted};">
                ${input.footerHtml ?? `Flowboc &middot; <a href="mailto:support@flowboc.com" style="color:${COLOR.muted};">support@flowboc.com</a>`}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

// Lighter-touch wrapper for instructor-authored newsletter campaigns — the
// instructor's own content leads, Flowboc is a small footer mention rather
// than the page header.
export function newsletterLayout(input: { bodyHtml: string; footerHtml: string }): string {
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <link rel="icon" href="${FAVICON_URL}" />
  </head>
  <body style="margin:0;padding:32px 16px;background:${COLOR.pageBg};font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center">
          <table role="presentation" width="560" style="max-width:560px;width:100%;" cellpadding="0" cellspacing="0">
            <tr>
              <td style="background:${COLOR.cardBg};border:1px solid ${COLOR.border};border-radius:16px;padding:32px;">
                <div style="font-size:15px;line-height:1.65;color:${COLOR.foreground};">${input.bodyHtml}</div>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:24px 8px 0;font-size:12px;line-height:1.6;color:${COLOR.muted};">
                ${input.footerHtml}<br />Sent via <a href="https://flowboc.com" style="color:${COLOR.muted};"><img src="${LOGO_URL}" alt="Flowboc" height="14" style="height:14px;width:auto;vertical-align:middle;" /></a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
