import { Reveal, Section, SectionHeader } from "./primitives";
import { MobileBookingMock } from "./product-ui";

const flow = [
  { label: "Choose class", state: "class" as const },
  { label: "Enter details", state: "details" as const },
  { label: "Pay", state: "pay" as const },
  { label: "You're booked 🎉", state: "done" as const },
];

export function StudentExperience() {
  return (
    <Section className="bg-sand/30">
      <SectionHeader
        eyebrow="Student experience"
        title="Make booking"
        serif="effortless for your students."
        body="Your students don't need another app. They open your link, choose a class, pay, and they're booked."
      />

      <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {flow.map((f, i) => (
          <Reveal key={f.label} delay={i * 0.1} className="flex flex-col items-center gap-4">
            <MobileBookingMock state={f.state} />
            <p className="text-sm font-medium">{f.label}</p>
          </Reveal>
        ))}
      </div>

      <p className="mt-12 text-center text-sm text-muted-foreground">
        No downloads. No complicated signup.
      </p>
    </Section>
  );
}
