import type { ReactNode } from "react";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Section } from "@/components/landing/primitives";

export function LegalLayout({
  title,
  updated,
  intro,
  sections,
}: {
  title: string;
  updated: string;
  intro?: string;
  sections: { heading: string; body: ReactNode }[];
}) {
  return (
    <div className="min-h-screen overflow-x-clip bg-background">
      <Navbar />
      <main>
        <Section className="pb-0 pt-16 lg:pt-24">
          <div className="mx-auto max-w-2xl">
            <h1 className="text-4xl leading-[1.05] tracking-tight sm:text-5xl">{title}</h1>
            <p className="mt-3 text-sm text-muted-foreground">Last updated: {updated}</p>
            {intro ? (
              <p className="mt-6 text-base leading-relaxed text-muted-foreground">{intro}</p>
            ) : null}
          </div>
        </Section>

        <Section>
          <div className="mx-auto max-w-2xl divide-y divide-border">
            {sections.map((s) => (
              <div key={s.heading} className="py-6 first:pt-0">
                <h2 className="text-lg font-medium">{s.heading}</h2>
                <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
                  {s.body}
                </div>
              </div>
            ))}
          </div>
        </Section>
      </main>
      <Footer />
    </div>
  );
}
