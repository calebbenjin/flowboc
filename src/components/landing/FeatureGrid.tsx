import { Reveal, Section, SectionHeader } from "./primitives";
import {
  ClassCreateMock,
  MobileBookingMock,
  ReminderMock,
  RevenueMock,
  StudentListMock,
} from "./product-ui";

const features = [
  {
    title: "Create classes in minutes",
    body: "Set your schedule, capacity, location, price and recurring sessions.",
    visual: <ClassCreateMock />,
    span: "lg:col-span-2",
  },
  {
    title: "Your own booking page",
    body: "Give every class a beautiful, shareable booking page.",
    visual: (
      <div className="flex justify-center overflow-hidden">
        <div className="origin-top scale-[0.8]">
          <MobileBookingMock />
        </div>
      </div>
    ),
    span: "",
  },
  {
    title: "Get paid automatically",
    body: "Students pay during booking and you can track your revenue from your dashboard.",
    visual: <RevenueMock />,
    span: "",
  },
  {
    title: "Know who's coming",
    body: "See every booking, student, payment and attendance record in one place.",
    visual: <StudentListMock />,
    span: "",
  },
  {
    title: "Keep students on schedule",
    body: "Automatically send booking confirmations and class reminders.",
    visual: <ReminderMock />,
    span: "",
  },
  {
    title: "Let students book without an app",
    body: "No downloads. No complicated accounts. Just link → book → pay → show up.",
    visual: (
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-4 text-[0.72rem]">
        {["Link", "Book", "Pay", "Show up"].map((s, i) => (
          <span key={s} className="flex items-center gap-2">
            <span className="rounded-full bg-secondary px-3 py-1.5">{s}</span>
            {i < 3 ? <span className="text-muted-foreground">→</span> : null}
          </span>
        ))}
      </div>
    ),
    span: "lg:col-span-2",
  },
];

export function FeatureGrid() {
  return (
    <Section id="product" className="bg-sand/30">
      <SectionHeader
        eyebrow="The platform"
        title="Everything you need to"
        serif="run your classes."
      />
      <div className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {features.map((f, i) => (
          <Reveal key={f.title} delay={(i % 3) * 0.08} className={f.span}>
            <div className="flex h-full flex-col justify-between gap-6 rounded-2xl border border-border bg-background p-6">
              <div>
                <h3 className="text-lg">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
              </div>
              <div>{f.visual}</div>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
