import { ImageResponse } from "next/og";
import { prisma } from "@/lib/db";
import { siteHost } from "@/lib/site";
import { loadFrauncesFont } from "@/lib/og-font";

export const alt = "Book a class";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const SAND = "#f7f3eb";
const ACCENT = "#ebe0cf";
const FOREST = "#1d3d2f";
const MUTED = "#6b655d";
const CLAY = "#be7447";

function initialsOf(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

// Best-effort — a broken/unreachable photo URL shouldn't fail the whole
// image, it should just fall back to the initials avatar.
async function loadPhoto(photoUrl: string | null): Promise<string | null> {
  if (!photoUrl) return null;
  try {
    const res = await fetch(photoUrl);
    if (!res.ok) return null;
    const buffer = await res.arrayBuffer();
    const contentType = res.headers.get("content-type") ?? "image/jpeg";
    return `data:${contentType};base64,${Buffer.from(buffer).toString("base64")}`;
  } catch {
    return null;
  }
}

export default async function OpengraphImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const instructor = await prisma.instructor.findUnique({ where: { slug } });

  const name = instructor?.name ?? "Flowboc instructor";
  const themeColor = instructor?.themeColor || CLAY;
  const subhead =
    [instructor?.location, instructor?.specialties?.[0]].filter(Boolean).join(" · ") ||
    "Book a class";

  const FONT_TEXT = Array.from(
    new Set(`${name}${subhead}${siteHost}/${slug}BOOK A CLASS WITH`),
  ).join("");

  const [photoSrc, frauncesRegular, frauncesSemibold] = await Promise.all([
    loadPhoto(instructor?.photoUrl ?? null),
    loadFrauncesFont(500, FONT_TEXT),
    loadFrauncesFont(600, FONT_TEXT),
  ]);

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        gap: 28,
        padding: "72px 80px",
        backgroundColor: SAND,
        backgroundImage: `radial-gradient(circle at 82% 18%, ${ACCENT} 0%, ${SAND} 55%)`,
        fontFamily: "Fraunces",
      }}
    >
      {photoSrc ? (
        <img
          src={photoSrc}
          width={160}
          height={160}
          alt=""
          style={{ borderRadius: "50%", objectFit: "cover", border: `6px solid ${themeColor}` }}
        />
      ) : (
        <div
          style={{
            display: "flex",
            width: 160,
            height: 160,
            borderRadius: "50%",
            backgroundColor: `${themeColor}26`,
            color: themeColor,
            alignItems: "center",
            justifyContent: "center",
            fontSize: 56,
            fontWeight: 600,
            border: `6px solid ${themeColor}`,
          }}
        >
          {initialsOf(name)}
        </div>
      )}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          color: themeColor,
          fontSize: 22,
          fontWeight: 600,
          letterSpacing: 2,
          textTransform: "uppercase",
        }}
      >
        Book a class with
      </div>

      <div
        style={{ display: "flex", fontSize: 64, lineHeight: 1.1, color: FOREST, fontWeight: 600 }}
      >
        {name}
      </div>

      <div style={{ display: "flex", fontSize: 28, color: MUTED, fontWeight: 500 }}>{subhead}</div>

      <div style={{ display: "flex", fontSize: 22, color: MUTED, fontWeight: 500 }}>
        {siteHost}/{slug}
      </div>
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
