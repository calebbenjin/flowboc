import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal, Section, SectionHeader } from "./primitives";
import { ClassCreateMock, ConfirmationCard, ShareMock } from "./product-ui";

const steps = [
  {
    n: "01",
    title: "Create your class",
    body: "Add your schedule, location, price and capacity.",
    visual: <ClassCreateMock />,
  },
  {
    n: "02",
    title: "Share your link",
    body: "Share your personal booking page anywhere — Instagram, WhatsApp, website or email.",
    visual: <ShareMock />,
  },
  {
    n: "03",
    title: "Students book & pay",
    body: "Students choose a class, pay online and receive instant confirmation.",
    visual: <ConfirmationCard />,
  },
];

export function HowItWorks() {
  return (
    <Section id="how-it-works">
      <SectionHeader
        eyebrow="How it works"
        title={
          <>
            From “Are there still spots?” to{" "}
            <span className="display italic text-clay">booked in three steps.</span>
          </>
        }
      />

      <div className="mt-14 grid gap-8 md:grid-cols-3">
        {steps.map((s, i) => (
          <Reveal key={s.n} delay={i * 0.1}>
            <div className="flex h-full flex-col gap-5">
              <div className="flex items-center gap-3">
                <span className="display grid size-9 place-items-center rounded-full border border-border text-sm text-clay">
                  {s.n}
                </span>
                <h3 className="text-lg">{s.title}</h3>
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">{s.body}</p>
              <div className="mt-auto">{s.visual}</div>
            </div>
          </Reveal>
        ))}
      </div>

      <div className="mt-14 text-center">
        <Button asChild size="xl" variant="clay">
          <Link href="/auth">
            Create Your First Class <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>
    </Section>
  );
}
