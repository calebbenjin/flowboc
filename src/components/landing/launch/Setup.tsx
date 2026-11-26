"use client";

import Link from "next/link";
import { ArrowRight, Flower2, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthCta } from "./useAuthCta";

const steps = [
  {
    number: "01",
    icon: Flower2,
    title: "Introduce your teaching.",
    body: "Create your account, add your profile, and choose your personal Flowboc link.",
  },
  {
    number: "02",
    icon: Calendar,
    title: "Publish your offer.",
    body: "Add a class with its time, location or online details, price, and available spaces.",
  },
  {
    number: "03",
    icon: ArrowRight,
    title: "Get ready for bookings.",
    body: "Complete payment setup for paid classes, then share your page wherever students find you.",
  },
];

export function Setup() {
  const { authed, rememberedDevice } = useAuthCta();
  const ctaHref = authed ? "/dashboard" : rememberedDevice ? "/auth?mode=login" : "/auth";
  const ctaLabel = authed
    ? "Go to my account"
    : rememberedDevice
      ? "Log in"
      : "Create my Flowboc page";

  return (
    <section id="setup" className="px-5 py-16 sm:px-8 lg:py-24">
      <div className="mx-auto w-full max-w-[1230px]">
        <div className="mx-auto max-w-[730px] text-center">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.17em] text-primary">
            Set up your yoga booking page in 3 steps
          </p>
          <h2 className="display mt-4 text-4xl leading-[1.08] tracking-tight text-[#272334] sm:text-5xl">
            Build your home.
            <br />
            Share <em className="font-normal italic text-primary">your next class.</em>
          </h2>
        </div>

        <div className="mt-14 grid gap-10 sm:grid-cols-3">
          {steps.map((step) => (
            <div key={step.number} className="border-t border-[#e2dfd7] pt-8">
              <span className="float-right text-xs text-[#ada3b3]">{step.number}</span>
              <step.icon className="size-9 text-primary" strokeWidth={1.3} />
              <h3 className="display mt-6 text-2xl text-[#272334]">{step.title}</h3>
              <p className="mt-3 text-sm leading-[1.8] text-[#716277]">{step.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
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
    </section>
  );
}
