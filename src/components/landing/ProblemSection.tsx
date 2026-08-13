import { Reveal, Section, SectionHeader } from "./primitives";

const cards = [
  {
    step: "01",
    title: "Too much admin",
    body: "Stop manually confirming bookings, checking payments and updating spreadsheets.",
  },
  {
    step: "02",
    title: "Booking friction",
    body: "Give students one simple link where they can see availability and book instantly.",
  },
  {
    step: "03",
    title: "Scattered information",
    body: "Keep classes, students, bookings, payments and attendance in one place.",
  },
];

export function ProblemSection() {
  return (
    <Section>
      <SectionHeader
        title={
          <>
            Your students shouldn&apos;t have to{" "}
            <span className="display italic text-clay">DM you</span> to book a class.
          </>
        }
        body="Your business shouldn't depend on a collection of WhatsApp messages, spreadsheets, payment screenshots and calendar reminders. Create one simple booking experience for your students — and one simple dashboard for you."
      />

      <div className="mt-14 grid gap-4 md:grid-cols-3">
        {cards.map((c, i) => (
          <Reveal key={c.step} delay={i * 0.08}>
            <div className="h-full rounded-2xl border border-border bg-card p-7 transition-shadow hover:shadow-[var(--shadow-soft)]">
              <span className="display text-sm text-clay">{c.step}</span>
              <h3 className="mt-4 text-xl">{c.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{c.body}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
