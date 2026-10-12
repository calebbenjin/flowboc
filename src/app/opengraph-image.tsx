import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { siteHost } from "@/lib/site";

export const alt = "Flowboc — Simple booking for yoga instructors";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const SAND = "#f7f3eb";
const ACCENT = "#ebe0cf";
const FOREST = "#1d3d2f";
const CLAY = "#be7447";
const MUTED = "#6b655d";

const EYEBROW = "Booking software for yoga instructors";
const HEADLINE = "Create your class. Share your link. Get paid.";
const SUBHEAD = "Classes, payments, students and reminders — all in one booking page.";
const DOMAIN = siteHost;

const FONT_TEXT = Array.from(
  new Set(`${EYEBROW.toUpperCase()}${HEADLINE}${SUBHEAD}${DOMAIN}`),
).join("");

async function loadFrauncesFont(weight: 500 | 600) {
  const css = await (
    await fetch(
      `https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,${weight}&text=${encodeURIComponent(
        FONT_TEXT,
      )}`,
    )
  ).text();
  const match = css.match(/src: url\(([^)]+)\) format\('(opentype|truetype)'\)/);
  const fontUrl = match?.[1];
  if (!fontUrl) throw new Error("Could not find Fraunces font source");
  const res = await fetch(fontUrl);
  return res.arrayBuffer();
}

export default async function OpengraphImage() {
  const [logoBuffer, frauncesRegular, frauncesSemibold] = await Promise.all([
    readFile(join(process.cwd(), "src/assets/flowboc-logo.png")),
    loadFrauncesFont(500),
    loadFrauncesFont(600),
  ]);
  const logoSrc = `data:image/png;base64,${logoBuffer.toString("base64")}`;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "72px 80px",
        backgroundColor: SAND,
        backgroundImage: `radial-gradient(circle at 82% 18%, ${ACCENT} 0%, ${SAND} 55%)`,
        fontFamily: "Fraunces",
      }}
    >
      <img src={logoSrc} width={230} height={40} alt="" style={{ objectFit: "contain" }} />

      <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 920 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            color: CLAY,
            fontSize: 22,
            fontWeight: 600,
            letterSpacing: 2,
            textTransform: "uppercase",
          }}
        >
          <div style={{ width: 28, height: 3, backgroundColor: CLAY, borderRadius: 2 }} />
          {EYEBROW}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 64,
            lineHeight: 1.12,
            color: FOREST,
            fontWeight: 600,
          }}
        >
          {HEADLINE}
        </div>
        <div
          style={{ display: "flex", fontSize: 26, lineHeight: 1.4, color: MUTED, fontWeight: 500 }}
        >
          {SUBHEAD}
        </div>
      </div>

      <div style={{ display: "flex", fontSize: 24, color: MUTED, fontWeight: 500 }}>{DOMAIN}</div>
    </div>,
    {
      ...size,
      fonts: [
        { name: "Fraunces", data: frauncesRegular, weight: 500, style: "normal" },
        { name: "Fraunces", data: frauncesSemibold, weight: 600, style: "normal" },
      ],
    },
  );
}
