import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal, Section, SectionHeader } from "./primitives";
import { cn } from "@/lib/utils";

const plans = [
  {
    name: "Free",
    price: "$0",
    note: "For instructors getting started.",
    cta: "Start Free",
    features: ["Booking page", "Basic class management", "Student bookings", "Basic dashboard"],
    popular: false,
  },
  {
    name: "Pro",
    price: "$19",
    note: "For instructors running regular classes.",
    cta: "Get Started",
    features: [
      "Unlimited classes",
      "Online payments",
      "Recurring classes",
      "Automated reminders",
      "Student management",
      "Attendance",
      "Revenue tracking",
      "Class passes",
    ],
    popular: true,
  },
];

export function Pricing() {
  return (
    <Section id="pricing" className="bg-sand/30">
      <SectionHeader
        eyebrow="Pricing"
        title="Simple pricing."
        serif="No complicated studio software."
        body="Start free. Upgrade when your classes grow."
      />

      <div className="mx-auto mt-14 grid max-w-2xl gap-5 sm:grid-cols-2">
        {plans.map((p, i) => (
          <Reveal key={p.name} delay={i * 0.08}>
            <div
              className={cn(
                "flex h-full flex-col rounded-2xl border bg-background p-7",
                p.popular
                  ? "border-clay/40 bg-card shadow-[var(--shadow-lift)] sm:-mt-4 sm:pb-10"
                  : "border-border",
              )}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg">{p.name}</h3>
                {p.popular ? (
                  <span className="rounded-full bg-clay px-3 py-1 text-[0.62rem] font-medium uppercase tracking-wider text-clay-foreground">
                    Most popular
                  </span>
                ) : null}
              </div>
              <p className="mt-5 flex items-end gap-1">
                <span className="display text-4xl">{p.price}</span>
                <span className="pb-1 text-sm text-muted-foreground">/ month</span>
              </p>
              <p className="mt-2 text-sm text-muted-foreground">{p.note}</p>
              <ul className="mt-6 space-y-2.5 text-sm">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="mt-0.5 size-4 shrink-0 text-success" /> {f}
                  </li>
                ))}
              </ul>
              <Button
                asChild
                size="lg"
                variant={p.popular ? "clay" : "quiet"}
                className="mt-8 w-full"
              >
                <Link href="/auth">{p.cta}</Link>
              </Button>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
