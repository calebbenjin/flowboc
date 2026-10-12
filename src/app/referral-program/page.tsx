import type { Metadata } from "next";
import Link from "next/link";
import { Check, Link2, Share2, Wallet } from "lucide-react";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Reveal, Section, SectionHeader, Eyebrow, Pill } from "@/components/landing/primitives";
import { Button } from "@/components/ui/button";
import { referralProgram } from "@/lib/demo";

const title = "Referral Program — Earn 20% commission | Flowboc";
const description =
  "Refer instructors to Flowboc and earn 20% commission on every subscription you bring in, for as long as they stay subscribed.";

export const metadata: Metadata = {
  title,
  description,
  openGraph: { title, description, type: "website" },
  twitter: { card: "summary_large_image" },
};

const steps = [
  {
    icon: Link2,
    title: "Get your link",
    body: "Grab your unique referral link from your dashboard — no application or approval needed.",
  },
  {
    icon: Share2,
    title: "Share it",
    body: "Send it to instructors you know. When they sign up and subscribe to a paid plan, they're linked to you.",
  },
  {
    icon: Wallet,
    title: "Earn 20%, recurring",
    body: "You earn 20% commission on their subscription every billing cycle, for as long as they stay subscribed.",
  },
];

const faqs = [
  {
    q: "How much do I earn?",
    a: "20% of every subscription payment made by an instructor you referred — recurring for as long as they remain a paying customer.",
  },
  {
    q: "When do I get paid?",
    a: "Commissions accrue as your referrals are billed, and are paid out monthly once you cross the minimum payout threshold.",
  },
  {
    q: "Is there a limit to how much I can earn?",
    a: "No. There's no cap on the number of instructors you can refer or the commission you can earn.",
  },
  {
    q: "Who can join?",
    a: "Any Flowboc instructor. Sign in to your dashboard to find your referral link under Referrals.",
  },
];

export default function ReferralProgramPage() {
  return (
    <div className="min-h-screen overflow-x-clip bg-background">
      <Navbar />
      <main>
        <Section className="pb-14 pt-16 lg:pb-20 lg:pt-24">
          <Reveal>
            <div className="mx-auto max-w-2xl text-center">
              <Eyebrow className="justify-center">Referral Program</Eyebrow>
              <h1 className="mt-4 text-4xl leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
                Earn{" "}
                <span className="display italic text-clay">{referralProgram.commissionRate}%</span>{" "}
                commission on every subscription you refer.
              </h1>
              <p className="mt-5 text-base leading-relaxed text-muted-foreground sm:text-lg">
                Know an instructor who&apos;d love Flowboc? Share your link. Every time they
                subscribe, you get paid — for as long as they stay a customer.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Button asChild size="lg" variant="clay">
                  <Link href="/dashboard/referrals">Get your referral link</Link>
                </Button>
                <Button asChild size="lg" variant="quiet">
                  <Link href="/auth">Create a free account</Link>
                </Button>
              </div>
            </div>
          </Reveal>
        </Section>

        <Section id="how-it-works" className="bg-sand/30">
          <SectionHeader
            eyebrow="How it works"
            title="Three steps."
            serif="No catches."
            body="Set up in minutes, earn for as long as your referrals stay subscribed."
          />
          <div className="mx-auto mt-14 grid max-w-4xl gap-5 sm:grid-cols-3">
            {steps.map((s, i) => (
              <Reveal key={s.title} delay={i * 0.08}>
                <div className="surface h-full p-6">
                  <span className="grid size-11 place-items-center rounded-full bg-clay/12 text-clay">
                    <s.icon className="size-5" />
                  </span>
                  <h3 className="mt-5 text-lg">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </Section>

        <Section>
          <div className="mx-auto grid max-w-4xl items-center gap-10 lg:grid-cols-2">
            <Reveal>
              <div>
                <Pill tone="clay">Recurring commission</Pill>
                <h2 className="mt-4 text-3xl leading-[1.1] tracking-tight sm:text-4xl">
                  Get paid every cycle, not just once.
                </h2>
                <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                  Most referral programs pay a one-time bounty. Ours doesn&apos;t stop — you earn{" "}
                  {referralProgram.commissionRate}% of your referral&apos;s subscription every time
                  they&apos;re billed, for as long as they remain subscribed.
                </p>
                <ul className="mt-6 space-y-2.5 text-sm">
                  {[
                    "No cap on how many instructors you refer",
                    "No cap on how much you can earn",
                    "Track referrals and earnings from your dashboard",
                    "Monthly payouts once you hit the threshold",
                  ].map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="mt-0.5 size-4 shrink-0 text-success" /> {f}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
            <Reveal delay={0.08}>
              <div className="surface p-7">
                <p className="text-sm text-muted-foreground">Example</p>
                <p className="mt-2 text-sm leading-relaxed">
                  Refer 5 instructors on the Pro plan ($19/mo). You&apos;d earn{" "}
                  <span className="font-medium text-foreground">${(19 * 0.2 * 5).toFixed(2)}</span>{" "}
                  every month, automatically, for as long as they stay subscribed.
                </p>
              </div>
            </Reveal>
          </div>
        </Section>

        <Section className="bg-sand/30">
          <SectionHeader eyebrow="FAQ" title="Common questions." align="center" />
          <div className="mx-auto mt-12 max-w-2xl divide-y divide-border">
            {faqs.map((f) => (
              <div key={f.q} className="py-5">
                <h3 className="text-sm font-medium">{f.q}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section className="text-center">
          <Reveal>
            <h2 className="text-3xl leading-[1.1] tracking-tight sm:text-4xl">
              Ready to start earning?
            </h2>
            <p className="mx-auto mt-3 max-w-md text-base text-muted-foreground">
              Grab your referral link from your dashboard and start sharing today.
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg" variant="clay">
                <Link href="/dashboard/referrals">Get your referral link</Link>
              </Button>
            </div>
          </Reveal>
        </Section>
      </main>
      <Footer />
    </div>
  );
}
