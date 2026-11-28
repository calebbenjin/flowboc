"use client";

import Link from "next/link";
import { ArrowRight, Calendar, Share2, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TestimonialQuoteCard } from "./TestimonialQuoteCard";
import type { Testimonial } from "./testimonial-data";
import { useAuthCta } from "./useAuthCta";

const steps = [
  {
    number: "01",
    icon: Calendar,
    title: "Add your timetable & pricing",
    body: "Create your classes, and set your prices. No tech skills needed.",
  },
  {
    number: "02",
    icon: Wallet,
    title: "Connect your bank for payments",
    body: "Link your bank or mobile money account through Paystack, so students pay the moment they book.",
  },
  {
    number: "03",
    icon: Share2,
    title: "Share your link & go live",
    body: "Put your booking page in your Instagram bio, WhatsApp status and group chats, and start taking bookings today.",
  },
];

// The quote comes in as a prop from the server page rather than being read
// from testimonial-data here: whether samples show depends on VERCEL_ENV,
// which the client bundle can't see, so reading it here would mismatch.
export function Setup({ quote }: { quote?: Testimonial | undefined }) {
  const { authed, rememberedDevice } = useAuthCta();
  const ctaHref = authed ? "/dashboard" : rememberedDevice ? "/auth?mode=login" : "/auth";
  const ctaLabel = authed
    ? "Go to my account"
    : rememberedDevice
      ? "Log in"
      : "Start your free trial";

  return (
    <section id="setup" className="px-5 py-16 sm:px-8 lg:py-24">
      <div className="mx-auto w-full max-w-[1230px]">
        <div className="mx-auto max-w-[730px] text-center">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.17em] text-primary">
            How it works
          </p>
          <h2 className="display mt-4 text-4xl leading-[1.08] tracking-tight text-[#272334] sm:text-5xl">
            Five minutes to
            <br />
            <em className="font-normal italic text-primary">your first booking.</em>
          </h2>
          <p className="mt-5 text-sm leading-[1.85] text-[#716277]">
            No tech skills, no waiting. Add your classes, connect payments, share your link —
            that&apos;s it.
          </p>
        </div>

        <div
          className={
            quote ? "mt-14 grid gap-10 lg:grid-cols-[1fr_380px] lg:items-stretch" : "mt-14"
          }
        >
          <div className="flex flex-col justify-between">
            {/* Stacked rather than a 3-column grid, so the steps read top to
                bottom beside the quote. Without a quote they're kept to a
                readable width instead of stretching across the page. */}
            <ol className={quote ? "" : "mx-auto w-full max-w-[680px]"}>
              {steps.map((step) => (
                <li
                  key={step.number}
                  className="flex gap-6 border-t border-[#e2dfd7] py-8 first:border-t-0 first:pt-0"
                >
                  <div className="flex shrink-0 flex-col items-center gap-3">
                    <span className="grid size-14 place-items-center rounded-full bg-[#eeebff]">
                      <step.icon className="size-6 text-primary" strokeWidth={1.5} />
                    </span>
                    <span className="text-xs text-[#ada3b3]">{step.number}</span>
                  </div>
                  <div className="pt-2">
                    <h3 className="display text-2xl text-[#272334]">{step.title}</h3>
                    <p className="mt-2 text-sm leading-[1.8] text-[#716277]">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>

            <div className={`mt-4 ${quote ? "text-center lg:text-left" : "text-center"}`}>
              <Button asChild size="xl" className="bg-[#6355ff] text-white hover:bg-[#5042e5]">
                <Link href={ctaHref}>
                  {ctaLabel} <ArrowRight className="size-4" />
                </Link>
              </Button>
              <p className="mt-4 text-[11px] text-[#7c6b84]">
                Takes about five minutes to set up your page.
              </p>
            </div>
          </div>

          {quote ? <TestimonialQuoteCard quote={quote} /> : null}
        </div>
      </div>
    </section>
  );
}
