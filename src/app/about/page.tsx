import type { Metadata } from "next";
import Link from "next/link";
import { Heart, Sparkles, Target } from "lucide-react";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Reveal, Section, SectionHeader, Eyebrow } from "@/components/landing/primitives";
import { Button } from "@/components/ui/button";

const title = "About Flowbuk — Our story";
const description =
  "Flowbuk was built by a yoga instructor who was tired of running her business out of spreadsheets and DMs. Here's why we started, and where we're going.";

export const metadata: Metadata = {
  title,
  description,
  openGraph: { title, description, type: "website" },
  twitter: { card: "summary_large_image" },
};

const values = [
  {
    icon: Heart,
    title: "Instructor-first",
    body: "Every decision starts with one question: does this make an independent instructor's life easier? If not, we don't ship it.",
  },
  {
    icon: Sparkles,
    title: "Simple over clever",
    body: "You shouldn't need a manual to book a class or get paid. We'd rather remove a feature than add a setting.",
  },
  {
    icon: Target,
    title: "Built for the solo business",
    body: "Flowbuk isn't studio software with the extra seats stripped out — it's designed from scratch for a team of one.",
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen overflow-x-clip bg-background">
      <Navbar />
      <main>
        <Section className="pb-14 pt-16 lg:pb-20 lg:pt-24">
          <Reveal>
            <div className="mx-auto max-w-2xl text-center">
              <Eyebrow className="justify-center">Our story</Eyebrow>
              <h1 className="mt-4 text-4xl leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
                Built by an instructor.{" "}
                <span className="display italic text-clay">Not a studio chain.</span>
              </h1>
              <p className="mt-5 text-base leading-relaxed text-muted-foreground sm:text-lg">
                Flowbuk started because our founder couldn&apos;t find booking software that
                understood what it&apos;s actually like to run a one-person yoga business.
              </p>
            </div>
          </Reveal>
        </Section>

        <Section className="pt-0">
          <Reveal>
            <div className="mx-auto max-w-3xl">
              <div className="grid gap-8 sm:grid-cols-[auto_1fr] sm:items-center">
                <div className="mx-auto flex size-28 shrink-0 items-center justify-center rounded-full bg-clay/12 text-3xl font-medium text-clay sm:mx-0">
                  MO
                </div>
                <div className="text-center sm:text-left">
                  <p className="text-lg font-medium">Maya Okafor</p>
                  <p className="text-sm text-muted-foreground">Founder &amp; CEO, Flowbuk</p>
                </div>
              </div>

              <div className="mt-10 space-y-5 text-base leading-relaxed text-muted-foreground">
                <p>
                  Before Flowbuk, Maya spent six years teaching yoga — mornings at a studio she
                  didn&apos;t own, evenings with private clients, weekends filling in wherever
                  someone needed her. She loved the teaching. She did not love the rest of it.
                </p>
                <p>
                  Her booking system was a shared Google Sheet, an Instagram DM inbox, and a Venmo
                  history she&apos;d scroll through at midnight trying to remember who&apos;d
                  actually paid. One Tuesday morning, two students showed up for the same mat space
                  because a sign-up had been logged in the sheet but never made it to her phone. It
                  was a small mistake. It still felt terrible — she&apos;d built her whole practice
                  on people trusting her to have it together.
                </p>
                <p>
                  She looked for something built for someone like her: no studio, no front desk, no
                  second employee to hand the admin to. Everything she found was either a bloated
                  studio platform charging for twenty seats she&apos;d never use, or a generic
                  scheduling tool that had no idea what a class pack or a drop-in rate was. So she
                  started sketching her own version on the back of a class attendance sheet, then
                  learned enough code on weeknights to build it herself.
                </p>
                <p>
                  The first version of Flowbuk had exactly one user: Maya. The second version had
                  five — instructor friends she&apos;d talked into trying it in exchange for
                  brutally honest feedback. What she heard back was consistent: this is the first
                  tool that feels like it was made by someone who&apos;s actually taught a class,
                  not sold software to one.
                </p>
                <p>
                  That&apos;s still the standard Flowbuk is held to today. We&apos;re a small team
                  building for people doing what Maya used to do every day — and for a lot of that
                  time, still does. She keeps a weekly class on the schedule. It&apos;s the fastest
                  way we know to stay honest about what we&apos;re building.
                </p>
              </div>
            </div>
          </Reveal>
        </Section>

        <Section className="bg-sand/30">
          <SectionHeader
            eyebrow="Our mission"
            title="Give independent instructors the tools a studio would get —"
            serif="without the studio."
            body="Every instructor running their own business deserves software that handles the busywork so they can spend their time teaching, not chasing payments and sign-ups."
          />
        </Section>

        <Section>
          <SectionHeader eyebrow="What we believe" title="How we build." align="center" />
          <div className="mx-auto mt-14 grid max-w-4xl gap-5 sm:grid-cols-3">
            {values.map((v, i) => (
              <Reveal key={v.title} delay={i * 0.08}>
                <div className="surface h-full p-6">
                  <span className="grid size-11 place-items-center rounded-full bg-clay/12 text-clay">
                    <v.icon className="size-5" />
                  </span>
                  <h3 className="mt-5 text-lg">{v.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{v.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </Section>

        <Section className="text-center">
          <Reveal>
            <h2 className="text-3xl leading-[1.1] tracking-tight sm:text-4xl">
              Come teach on Flowbuk.
            </h2>
            <p className="mx-auto mt-3 max-w-md text-base text-muted-foreground">
              Set up your booking page free, in a few minutes.
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg" variant="clay">
                <Link href="/auth">Start Free</Link>
              </Button>
              <Button asChild size="lg" variant="quiet">
                <Link href="/contact">Get in touch</Link>
              </Button>
            </div>
          </Reveal>
        </Section>
      </main>
      <Footer />
    </div>
  );
}
