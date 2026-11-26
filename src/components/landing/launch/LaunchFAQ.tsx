import Link from "next/link";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// Exported so the landing page can publish the same Q&A as FAQPage
// structured data — one list, so the markup can't drift from what's shown.
export const faqs: [string, string][] = [
  [
    "Do my students need an account?",
    "No. Students can view your page, choose a class, enter their details, and pay without creating a Flowboc account.",
  ],
  [
    "Do I need a website or an app?",
    "Flowboc gives you a shareable page for your teaching business. It works in a web browser, so neither you nor your students need to download an app.",
  ],
  [
    "Can I teach online and in person?",
    "Yes. Create either type of class and include the relevant joining or location details. You can also offer private sessions by setting the class capacity to one.",
  ],
  [
    "Can I run recurring classes?",
    "Yes. Recurring schedules are included in Starter and Pro, so you can publish regular sessions without recreating each one from scratch.",
  ],
  [
    "What currency are subscriptions charged in?",
    "Your local currency. Subscriptions are currently available in Nigerian naira, Ghanaian cedi, Kenyan shilling, South African rand and West African CFA franc — see the pricing section above for prices in yours. Annual plans are billed upfront. Your student class prices use your supported payment currency.",
  ],
  [
    "Where can I accept payments?",
    "Online payments are live in Nigeria, Ghana, Kenya, South Africa and Côte d'Ivoire, through Paystack. Students pay by card or bank, and by mobile money (such as M-Pesa) where available. You connect a bank account or mobile money wallet for payouts. Other countries are coming — check payment availability for your location before subscribing.",
  ],
  [
    "Will Flowboc bring me new students?",
    "Flowboc gives you a professional page to share and a direct booking experience for people who find your teaching. You continue to lead the promotion of your business.",
  ],
  [
    "What happens after my trial?",
    "Choose a paid subscription to continue accepting new bookings. If your trial expires without an active subscription, new bookings are paused.",
  ],
];

export function LaunchFAQ() {
  return (
    <section id="faq" className="px-5 py-16 sm:px-8 lg:py-24">
      <div className="mx-auto grid w-full max-w-[1230px] gap-16 lg:grid-cols-[1fr_1.25fr]">
        <div>
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.17em] text-primary">
            A little more clarity
          </p>
          <h2 className="display mt-4 text-4xl leading-[1.08] tracking-tight text-[#272334] sm:text-5xl">
            For the questions.
            <br />
            <em className="font-normal italic text-primary">Clear answers.</em>
          </h2>
          <p className="mt-5 text-sm text-[#716277]">Get to know your new business home.</p>
          <Link
            href="/contact"
            className="mt-6 inline-flex items-center gap-3 text-sm font-semibold text-[#272334] hover:text-[#6355ff]"
          >
            Talk to Flowboc <span>↗</span>
          </Link>
        </div>
        <Accordion type="single" collapsible className="w-full">
          {faqs.map(([q, a], i) => (
            <AccordionItem key={q} value={String(i)}>
              <AccordionTrigger className="min-h-11 text-left text-base text-[#63466d]">
                {q}
              </AccordionTrigger>
              <AccordionContent className="text-sm leading-relaxed text-[#82688b]">
                {a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
