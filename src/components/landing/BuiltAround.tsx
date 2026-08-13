import { Instagram, MessageCircle, Globe, MapPin, Repeat } from "lucide-react";
import { Reveal, Section, SectionHeader } from "./primitives";

const contexts = [
  { icon: MessageCircle, label: "WhatsApp" },
  { icon: Instagram, label: "Instagram" },
  { icon: Globe, label: "Personal websites" },
  { icon: MapPin, label: "In-person classes" },
  { icon: Repeat, label: "Recurring sessions" },
];

export function BuiltAround() {
  return (
    <Section>
      <SectionHeader title="Designed around how" serif="independent instructors actually work." />
      <div className="mt-12 flex flex-wrap justify-center gap-3">
        {contexts.map((c, i) => (
          <Reveal key={c.label} delay={i * 0.06}>
            <span className="flex items-center gap-2 rounded-full border border-border bg-card px-5 py-3 text-sm">
              <c.icon className="size-4 text-clay" /> {c.label}
            </span>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
