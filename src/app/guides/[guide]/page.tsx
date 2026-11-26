import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/JsonLd";
import { Navbar } from "@/components/landing/Navbar";
import { LaunchFooter } from "@/components/landing/launch/LaunchFooter";
import { Section } from "@/components/landing/primitives";
import { Button } from "@/components/ui/button";
import { getGuide, guides } from "@/lib/guides";
import { siteName, siteUrl } from "@/lib/site";

export const dynamicParams = false;

export function generateStaticParams() {
  return guides.map((g) => ({ guide: g.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ guide: string }>;
}): Promise<Metadata> {
  const guide = getGuide((await params).guide);
  if (!guide) return {};
  return {
    title: guide.title,
    description: guide.description,
    alternates: { canonical: `/guides/${guide.slug}` },
    openGraph: {
      title: guide.title,
      description: guide.description,
      type: "article",
      publishedTime: guide.published,
      modifiedTime: guide.updated,
    },
    twitter: { card: "summary_large_image", title: guide.title, description: guide.description },
  };
}

const dateFormat = new Intl.DateTimeFormat("en-GB", { dateStyle: "long", timeZone: "UTC" });

export default async function GuidePage({ params }: { params: Promise<{ guide: string }> }) {
  const guide = getGuide((await params).guide);
  if (!guide) notFound();

  const url = `${siteUrl}/guides/${guide.slug}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: guide.title,
        description: guide.description,
        url,
        datePublished: guide.published,
        dateModified: guide.updated,
        author: { "@type": "Organization", name: siteName, url: siteUrl },
        publisher: { "@id": `${siteUrl}/#organization` },
        mainEntityOfPage: url,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Guides", item: `${siteUrl}/guides` },
          { "@type": "ListItem", position: 2, name: guide.title, item: url },
        ],
      },
    ],
  };

  const others = guides.filter((g) => g.slug !== guide.slug);

  return (
    <div className="min-h-screen overflow-x-clip bg-background">
      <JsonLd data={jsonLd} />
      <Navbar />
      <main>
        <Section className="pb-0 pt-16 lg:pt-24">
          <article className="mx-auto max-w-2xl">
            <Link href="/guides" className="text-sm text-muted-foreground hover:text-primary">
              ← All guides
            </Link>
            <h1 className="mt-6 text-4xl leading-[1.05] tracking-tight sm:text-5xl">
              {guide.title}
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Updated {dateFormat.format(new Date(guide.updated))} · {guide.readMinutes} min read
            </p>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
              {guide.description}
            </p>

            {guide.sections.map((s) => (
              <section key={s.heading} className="mt-10">
                <h2 className="text-2xl font-medium tracking-tight">{s.heading}</h2>
                <div className="mt-4 space-y-4 text-base leading-relaxed text-muted-foreground">
                  {s.paragraphs.map((p) => (
                    <p key={p}>{p}</p>
                  ))}
                  {s.list ? (
                    <ul className="list-disc space-y-2 pl-5">
                      {s.list.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </section>
            ))}

            <div className="mt-14 rounded-2xl border border-border bg-secondary/40 p-6 sm:p-8">
              <h2 className="text-xl font-medium">Take bookings and payments in one link</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Flowboc gives you a booking page for your classes, with online payment in your local
                currency. Try it free for 14 days — no card required.
              </p>
              <Button asChild className="mt-5">
                <Link href="/auth">Create my Flowboc page</Link>
              </Button>
            </div>
          </article>
        </Section>

        {others.length > 0 ? (
          <Section>
            <div className="mx-auto max-w-2xl">
              <h2 className="text-lg font-medium">More guides</h2>
              <ul className="mt-4 space-y-3">
                {others.map((g) => (
                  <li key={g.slug}>
                    <Link href={`/guides/${g.slug}`} className="text-primary hover:underline">
                      {g.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </Section>
        ) : null}
      </main>
      <LaunchFooter />
    </div>
  );
}
