import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Section, SectionHeader } from "./primitives";

const faqs = [
  [
    "Do my students need an account?",
    "No. Students can book without downloading an app or creating an account.",
  ],
  [
    "Can I create recurring classes?",
    "Yes. Create weekly recurring classes and manage individual sessions when needed.",
  ],
  ["Can students pay online?", "Yes. Students can pay during booking."],
  [
    "Can I share my booking page on Instagram and WhatsApp?",
    "Yes. Every instructor gets a shareable booking link.",
  ],
  [
    "Can I manually add students?",
    "Yes. You can add students yourself when someone books outside the platform.",
  ],
  [
    "Can I use it for private sessions?",
    "Yes. You can create one-on-one or limited-capacity sessions.",
  ],
  ["Can I cancel a class?", "Yes. Instructors can cancel classes and notify affected students."],
  [
    "Do I need to download an app?",
    "No. The platform works on the web and is designed to work beautifully on mobile.",
  ],
];

export function FAQ() {
  return (
    <Section id="faq">
      <SectionHeader title="Questions," serif="answered." />
      <div className="mx-auto mt-12 max-w-2xl">
        <Accordion type="single" collapsible className="w-full">
          {faqs.map(([q, a]) => (
            <AccordionItem key={q} value={String(q)}>
              <AccordionTrigger className="min-h-11 text-left text-base">{q}</AccordionTrigger>
              <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                {a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </Section>
  );
}
