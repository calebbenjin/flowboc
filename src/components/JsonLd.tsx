// `<` is escaped so a bio/class name containing "</script>" can't break out
// of the tag — JSON.stringify alone doesn't escape it.
export function JsonLd({ data }: { data: object }) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
