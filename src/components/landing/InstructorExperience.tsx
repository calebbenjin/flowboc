import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal, Section } from "./primitives";
import teaching from "@/assets/instructor-teaching.jpg";

const lines = [
  "Not chase payment screenshots.",
  "Not count spots in a spreadsheet.",
  "Not answer “Can I still join?” messages all day.",
  "Not manually remind everyone about tomorrow's class.",
];

export function InstructorExperience() {
  return (
    <Section>
      <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <Reveal>
          <img
            src={teaching.src}
            alt="Yoga instructor guiding a class in a sunlit studio"
            loading="lazy"
            width={1200}
            height={1400}
            className="aspect-[4/5] w-full rounded-2xl object-cover shadow-[var(--shadow-lift)]"
          />
        </Reveal>
        <Reveal delay={0.1}>
          <h2 className="text-3xl leading-[1.1] tracking-tight sm:text-4xl">
            Spend less time managing.{" "}
            <span className="display italic text-clay">More time teaching.</span>
          </h2>
          <p className="mt-6 text-base text-foreground">Your job is to teach yoga.</p>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            {lines.map((l) => (
              <li key={l} className="border-l-2 border-border pl-4">
                {l}
              </li>
            ))}
          </ul>
          <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
            We handle the busywork so you can focus on your students.
          </p>
          <Button asChild size="xl" variant="clay" className="mt-8">
            <Link href="/auth">
              Start Teaching, Not Managing <ArrowRight className="size-4" />
            </Link>
          </Button>
        </Reveal>
      </div>
    </Section>
  );
}
