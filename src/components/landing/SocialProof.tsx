import { Check, Instagram, MessageCircle, Globe, MapPin, Repeat } from "lucide-react";
import { Reveal, Section } from "./primitives";

const points = [
  "Easy setup",
  "No student app required",
  "Secure online payments",
  "Automated reminders",
];

const contexts = [
  { icon: MessageCircle, label: "WhatsApp" },
  { icon: Instagram, label: "Instagram" },
  { icon: Globe, label: "Personal websites" },
  { icon: MapPin, label: "In-person classes" },
  { icon: Repeat, label: "Recurring sessions" },
];

export function SocialProof() {
  return (
    <Section className="border-y border-border bg-sand/40 !py-12">
      <Reveal className="flex flex-col items-center gap-8 text-center">
        <div className="flex flex-col items-center gap-6">
          <p className="max-w-xl text-sm text-muted-foreground">
            Built for instructors who&apos;d rather teach than manage spreadsheets.
          </p>
          <ul className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
            {points.map((p) => (
              <li key={p} className="flex items-center gap-2 text-sm font-medium">
                <Check className="size-4 text-success" /> {p}
              </li>
            ))}
          </ul>
        </div>
        <div className="h-px w-16 bg-border" aria-hidden />
        <div className="flex flex-wrap items-center justify-center gap-2">
          {contexts.map((c) => (
            <span
              key={c.label}
              className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-xs text-muted-foreground"
            >
              <c.icon className="size-3.5 text-clay" /> {c.label}
            </span>
          ))}
        </div>
      </Reveal>
    </Section>
  );
}
