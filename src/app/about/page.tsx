import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Flower2, HeartHandshake, Wind } from "lucide-react";
import { Navbar } from "@/components/landing/Navbar";
import { LaunchFooter } from "@/components/landing/launch/LaunchFooter";
import { Reveal, Section, Eyebrow } from "@/components/landing/primitives";
import { Button } from "@/components/ui/button";

const title = "About Flowboc — More room for your practice";
const description =
  "Our purpose is to give independent yoga instructors more space to teach, connect, and grow. Discover the why, mission, and vision behind Flowboc.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/about" },
  openGraph: {
    title,
    description,
    type: "website",
    images: [{ url: "/flowboc-launch/assets/studio.jpg", alt: "Yoga practice in a sunlit studio" }],
  },
  twitter: { card: "summary_large_image", title, description },
};

const beliefs = [
  {
    icon: Wind,
    title: "Space to be present",
    body: "A clear schedule. A simple booking. Fewer loose ends to carry into the room. We make space for the attention your students come for.",
  },
  {
    icon: Flower2,
    title: "Care in every detail",
    body: "The welcome begins before the first breath on the mat. Your page, your invitations, and your booking experience should feel as considered as your teaching.",
  },
  {
    icon: HeartHandshake,
    title: "Growth on your terms",
    body: "A small circle, a full class, a new offering. Success has its own rhythm. Your tools should support the practice you want to build.",
  },
];

export default function AboutPage() {
  return (
    <div id="home" className="min-h-screen overflow-x-clip bg-background">
      <Navbar />
      <main id="top">
        <Section className="pb-14 pt-10 sm:pt-14 lg:pb-24 lg:pt-20">
          <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.05fr] lg:gap-20">
            <Reveal>
              <Eyebrow className="text-primary">The heart of Flowboc</Eyebrow>
              <h1 className="mt-5 max-w-xl text-[2.75rem] leading-[1.04] tracking-tight sm:text-6xl lg:text-[4.5rem]">
                More room for
                <br />
                <span className="display italic text-primary">what moves you.</span>
              </h1>
              <p className="mt-6 max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg">
                The quiet before a class. A familiar face at the door. The feeling of helping
                someone come back to themselves. This is the work we want to make room for.
              </p>
              <p className="mt-4 max-w-md text-base leading-relaxed text-muted-foreground">
                Flowboc gives independent yoga instructors a thoughtful home for their teaching, so
                the care you bring to the mat can be felt from the very first booking.
              </p>
              <Button asChild size="lg" className="mt-8 gap-2">
                <Link href="/auth">
                  Create your teaching space <ArrowRight className="size-4" />
                </Link>
              </Button>
            </Reveal>
            <Reveal delay={0.12}>
              <figure>
                <div className="relative aspect-[4/5] overflow-hidden rounded-t-[7rem] rounded-b-2xl sm:rounded-t-[10rem]">
                  <Image
                    src="/flowboc-launch/assets/studio.jpg"
                    alt="A yoga practitioner reaching overhead in a warm studio filled with afternoon light"
                    fill
                    priority
                    sizes="(min-width: 1280px) 560px, (min-width: 1024px) 48vw, (min-width: 640px) 70vw, 100vw"
                    className="object-cover"
                  />
                </div>
                <figcaption className="mt-4 flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="h-px w-8 bg-primary/40" aria-hidden="true" />
                  For the practice. For the people. For you.
                </figcaption>
              </figure>
            </Reveal>
          </div>
        </Section>

        <Section className="border-y border-primary/10 bg-primary/5">
          <Reveal>
            <div className="grid gap-7 lg:grid-cols-[0.45fr_1fr] lg:gap-20">
              <Eyebrow className="text-primary">Our why</Eyebrow>
              <div className="max-w-3xl">
                <h2 className="text-3xl leading-[1.15] tracking-tight sm:text-4xl lg:text-5xl">
                  Your energy belongs
                  <br className="hidden sm:block" />
                  <span className="display italic text-primary"> in the practice.</span>
                </h2>
                <div className="mt-7 grid gap-5 text-base leading-relaxed text-muted-foreground sm:grid-cols-2 sm:gap-9">
                  <p>
                    Teaching yoga asks you to hold space for other people. Running your own teaching
                    business asks you to hold everything else: bookings, payments, schedules, and
                    the next invitation.
                  </p>
                  <p>
                    We believe the work around your teaching should feel lighter. Flowboc exists to
                    bring it together beautifully, giving you more time to prepare, more confidence
                    to share, and more presence when your students arrive.
                  </p>
                </div>
              </div>
            </div>
          </Reveal>
        </Section>

        <Section>
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-20">
            <Reveal className="order-2 lg:order-1">
              <div className="relative aspect-[4/3] overflow-hidden rounded-2xl lg:aspect-[5/4]">
                <Image
                  src="/flowboc-launch/assets/practice.jpg"
                  alt="A quiet seated meditation beside sunlit windows"
                  fill
                  sizes="(min-width: 1280px) 560px, (min-width: 1024px) 48vw, 100vw"
                  className="object-cover"
                />
              </div>
            </Reveal>
            <Reveal className="order-1 lg:order-2">
              <Eyebrow className="text-primary">Our mission</Eyebrow>
              <h2 className="mt-4 text-3xl leading-[1.12] tracking-tight sm:text-4xl lg:text-5xl">
                Help your teaching
                <br />
                <span className="display italic text-primary">feel at home.</span>
              </h2>
              <p className="mt-6 text-base leading-relaxed text-muted-foreground sm:text-lg">
                To help independent yoga instructors build a sustainable teaching practice with
                simple tools and a beautiful experience for every student.
              </p>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                From a page that feels like you to a booking that feels effortless, we bring
                classes, personal sessions, and the things you create into one welcoming space. A
                space you can be proud to share.
              </p>
            </Reveal>
          </div>
        </Section>

        <Section className="pt-0 lg:pt-0">
          <Reveal>
            <div className="grid overflow-hidden rounded-3xl bg-primary/5 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="p-7 sm:p-12 lg:p-16">
                <Eyebrow className="text-primary">Our vision</Eyebrow>
                <h2 className="mt-4 text-3xl leading-[1.12] tracking-tight sm:text-4xl lg:text-5xl">
                  A world with
                  <br />
                  <span className="display italic text-primary">more space to grow.</span>
                </h2>
                <p className="mt-6 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
                  We imagine a future where independent teaching is a fulfilling livelihood. Where
                  more instructors can build lasting communities, and more people can find a
                  practice that makes them feel they belong.
                </p>
                <p className="mt-4 max-w-lg text-base leading-relaxed text-muted-foreground">
                  A first class can become a weekly ritual. A small group can become a community. We
                  want to make those beginnings easier, wherever you teach.
                </p>
              </div>
              <div className="relative min-h-64 lg:min-h-full">
                <Image
                  src="/flowboc-launch/assets/morning.jpg"
                  alt="Yoga mats waiting in a sunlit room, ready to welcome the next class"
                  fill
                  sizes="(min-width: 1280px) 540px, (min-width: 1024px) 45vw, 100vw"
                  className="object-cover"
                />
              </div>
            </div>
          </Reveal>
        </Section>

        <Section className="pt-0 lg:pt-0">
          <Reveal>
            <Eyebrow className="text-primary">What we believe</Eyebrow>
            <h2 className="mt-4 max-w-xl text-3xl leading-[1.12] tracking-tight sm:text-4xl">
              Thoughtful tools.
              <br />A more human experience.
            </h2>
          </Reveal>
          <div className="mt-10 grid gap-8 sm:grid-cols-3 sm:gap-10">
            {beliefs.map((belief, i) => (
              <Reveal
                key={belief.title}
                delay={i * 0.08}
                className="border-t border-primary/20 pt-6"
              >
                <belief.icon className="size-7 text-primary" strokeWidth={1.5} aria-hidden="true" />
                <h3 className="mt-5 text-xl">{belief.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{belief.body}</p>
              </Reveal>
            ))}
          </div>
        </Section>

        <Section className="bg-primary text-primary-foreground">
          <Reveal className="mx-auto max-w-2xl text-center">
            <Flower2 className="mx-auto size-9 opacity-80" strokeWidth={1.25} aria-hidden="true" />
            <h2 className="mt-6 text-4xl leading-[1.08] tracking-tight sm:text-5xl">
              Make space for
              <br />
              <span className="display italic">your next chapter.</span>
            </h2>
            <p className="mx-auto mt-5 max-w-md text-base leading-relaxed opacity-85">
              Your teaching has something to give. Give it a beautiful place to begin.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="w-full gap-2 bg-white text-primary hover:bg-white/90 sm:w-auto"
              >
                <Link href="/auth">
                  Create your teaching space <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Link
                href="/contact"
                className="rounded-sm px-3 py-2 text-sm underline decoration-white/40 underline-offset-4 transition-colors hover:decoration-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
              >
                Talk to us
              </Link>
            </div>
          </Reveal>
        </Section>
      </main>
      <LaunchFooter />
    </div>
  );
}
