"use client";

import { BarChart3, BellRing, Link2, Mail, Sparkles, Wallet } from "lucide-react";
import { HeroBookingDemo } from "./HeroBookingDemo";
import { PhoneArch } from "./PhoneArch";

// Outcome-first summary of the product, ordered along a student's journey
// from booking to coming back. Titles name what the instructor gets, not the
// feature; each body only claims what Flowboc does today (no packs,
// memberships or staff yet).
const outcomes = [
  {
    icon: Link2,
    title: "Students book without messaging you",
    body: "One link shows every class, time, price and spaces left, and students can book without creating an account.",
    color: "bg-[#6355ff]",
  },
  {
    icon: Wallet,
    title: "Paid before they arrive",
    body: "Students pay as they book, straight to your payout account in your local currency.",
    color: "bg-[#6e8060]",
  },
  {
    icon: BellRing,
    title: "Fewer empty mats",
    body: "A spot is only held once it's paid, reminders go out automatically, and a waitlist fills the gaps.",
    color: "bg-[#d0794a]",
  },
  {
    icon: Sparkles,
    title: "More than group classes",
    body: "Sell private sessions, workshops, free intro calls and digital guides from the same page.",
    color: "bg-[#b38a2e]",
  },
  {
    icon: Mail,
    title: "Stay in touch between classes",
    body: "Collect subscribers and send updates about new classes and workshops.",
    color: "bg-[#9a4f8c]",
  },
  {
    icon: BarChart3,
    title: "Know what's working",
    body: "See page views, bookings, fill rates and which classes earn the most.",
    color: "bg-[#3d7a82]",
  },
];

export function HowYouTeach() {
  return (
    <section id="how-you-teach" className="px-5 py-16 sm:px-8 lg:py-24">
      <div className="mx-auto w-full max-w-[1230px]">
        <div className="mx-auto max-w-[760px] text-center">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.17em] text-primary">
            What Flowboc does
          </p>
          <h2 className="display mt-4 text-4xl leading-[1.08] tracking-tight text-[#272334] sm:text-5xl">
            From your first booking
            <br />
            <em className="font-normal italic text-primary">to a full weekly class.</em>
          </h2>
          <p className="mt-5 text-lg leading-[1.85] text-[#716277]">
            Flowboc handles the booking, the payment and the follow-up, so your phone stops being
            the front desk.
          </p>
        </div>

        {/* List on the left, the booking demo on the right: the demo walks
            through the same booking -> payment -> confirmation the first
            steps describe. */}
        <div className="mt-12 grid items-center gap-12 lg:mt-16 lg:grid-cols-[1fr_minmax(0,460px)] lg:gap-16">
          <ol>
            {outcomes.map((o, i) => (
              <li key={o.title} className="relative flex gap-5 pb-8 last:pb-0">
                {/* Connector down to the next step. */}
                {i < outcomes.length - 1 ? (
                  <span
                    aria-hidden
                    className="absolute bottom-1.5 left-6 top-[3.375rem] w-0.5 -translate-x-1/2 rounded-full bg-[#ddd5e3]"
                  />
                ) : null}
                <span
                  className={`relative grid size-12 shrink-0 place-items-center rounded-full text-white ${o.color}`}
                >
                  <o.icon className="size-5" strokeWidth={1.8} />
                </span>
                <div className="pt-1">
                  <h3 className="text-lg font-medium text-[#272334]">{o.title}</h3>
                  <p className="mt-1 text-sm leading-[1.8] text-[#716277]">{o.body}</p>
                </div>
              </li>
            ))}
          </ol>

          <PhoneArch
            tones={{
              arch: "from-[#e3f0ee] to-[#bfdcd8]",
              outline: "border-[#cfe5e2]",
              blob: "text-[#f1e1ee]",
              dots: "#8fc1bb",
              accent: "bg-[#f4d8a8]",
            }}
          >
            <HeroBookingDemo />
          </PhoneArch>
        </div>
      </div>
    </section>
  );
}
