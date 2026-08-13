import { Check } from "lucide-react";
import { Reveal, Section } from "./primitives";

const points = [
  "Easy setup",
  "No student app required",
  "Secure online payments",
  "Automated reminders",
];

export function SocialProof() {
  return (
    <Section className="border-y border-border bg-sand/40 !py-12">
      <Reveal className="flex flex-col items-center gap-6 text-center">
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
      </Reveal>
    </Section>
  );
}
