// Loads only the Fraunces glyphs actually used in an OG image, via Google
// Fonts' `text=` subsetting param — keeps the ImageResponse font payload
// small instead of shipping the whole typeface.
export async function loadFrauncesFont(weight: 500 | 600, text: string) {
  const css = await (
    await fetch(
      `https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,${weight}&text=${encodeURIComponent(
        text,
      )}`,
    )
  ).text();
  const match = css.match(/src: url\(([^)]+)\) format\('(opentype|truetype)'\)/);
  const fontUrl = match?.[1];
  if (!fontUrl) throw new Error("Could not find Fraunces font source");
  const res = await fetch(fontUrl);
  return res.arrayBuffer();
}
