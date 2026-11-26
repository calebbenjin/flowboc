import { Check, X } from "lucide-react";

// Most instructors we're talking to don't come from another booking tool —
// they run classes on WhatsApp, a Google Form and bank transfers. This
// section names that setup directly so the comparison is the one they live.
const rows: [before: string, after: string][] = [
  [
    "Students message on WhatsApp to ask what's on and how to join",
    "One link shows every class, time, price and spaces left",
  ],
  [
    "A Google Form collects names — but not payment",
    "Students book and pay in the same step, no account needed",
  ],
  [
    "You send account details, then wait for transfer screenshots",
    "Payment goes straight to your payout account, in your local currency",
  ],
  [
    "You cross-check bank statements against the form",
    "Every booking shows its payment status in your dashboard",
  ],
  [
    "Someone said they'd come, never paid, and took a spot",
    "A place is only confirmed once it's paid — a waitlist catches the rest",
  ],
  [
    "You type out the same reminder in every group chat",
    "Confirmation and reminder emails go out automatically",
  ],
];

export function BeforeAfter() {
  return (
    <section id="compare" className="px-5 py-16 sm:px-8 lg:py-24">
      <div className="mx-auto w-full max-w-[1100px]">
        <div className="mx-auto max-w-[680px] text-center">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.17em] text-primary">
            WhatsApp, Google Forms and bank transfers vs Flowboc
          </p>
          <h2 className="display mt-4 text-4xl leading-[1.08] tracking-tight text-[#272334] sm:text-5xl">
            Stop running bookings
            <br />
            <em className="font-normal italic text-primary">from your chats.</em>
          </h2>
          <p className="mt-5 text-sm leading-[1.85] text-[#716277]">
            A WhatsApp group, a Google Form and your bank app work for your first few students.
            After that, the admin starts taking more time than the teaching.
          </p>
        </div>

        <div className="mt-12 overflow-hidden rounded-2xl border border-[#e9e2dc]">
          <div className="hidden grid-cols-2 bg-[#f6f3eb] text-[0.65rem] font-semibold uppercase tracking-[0.17em] sm:grid">
            <div className="px-6 py-4 text-[#9f83aa]">WhatsApp + Google Form + transfer</div>
            <div className="border-l border-[#e9e2dc] px-6 py-4 text-primary">With Flowboc</div>
          </div>
          <ul className="divide-y divide-[#e9e2dc]">
            {rows.map(([before, after]) => (
              <li key={before} className="grid sm:grid-cols-2">
                <div className="flex gap-3 px-6 py-4 text-sm leading-relaxed text-[#82688b]">
                  <X className="mt-0.5 size-4 shrink-0 text-[#c9a3a3]" aria-label="Before" />
                  {before}
                </div>
                <div className="flex gap-3 bg-white/60 px-6 py-4 text-sm leading-relaxed text-[#272334] sm:border-l sm:border-[#e9e2dc]">
                  <Check
                    className="mt-0.5 size-4 shrink-0 text-[#6e8060]"
                    aria-label="With Flowboc"
                  />
                  {after}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
