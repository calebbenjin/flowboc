import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/landing/Navbar";
import { LaunchFooter } from "@/components/landing/launch/LaunchFooter";
import { Eyebrow, Section } from "@/components/landing/primitives";
import { guides } from "@/lib/guides";

const title = "Guides for independent yoga instructors";
const description =
  "Practical guides on pricing, payments and growing an independent yoga teaching business in Nigeria, Ghana, Kenya, South Africa and across Africa.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/guides" },
  openGraph: { title, description, type: "website" },
  twitter: { card: "summary_large_image", title, description },
};

export default function GuidesPage() {
  return (
    <div className="min-h-screen overflow-x-clip bg-background">
      <Navbar />
      <main>
        <Section className="pb-0 pt-16 lg:pt-24">
          <div className="mx-auto max-w-2xl">
            <Eyebrow className="text-primary">Guides</Eyebrow>
            <h1 className="mt-4 text-4xl leading-[1.05] tracking-tight sm:text-5xl">{title}</h1>
            <p className="mt-6 text-base leading-relaxed text-muted-foreground">{description}</p>
          </div>
        </Section>

        <Section>
          <ul className="mx-auto max-w-2xl divide-y divide-border">
            {guides.map((g) => (
              <li key={g.slug} className="py-6 first:pt-0">
                <Link href={`/guides/${g.slug}`} className="group block">
                  <h2 className="text-xl font-medium group-hover:text-primary">{g.title}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {g.description}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">{g.readMinutes} min read</p>
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      </main>
      <LaunchFooter />
    </div>
  );
}
