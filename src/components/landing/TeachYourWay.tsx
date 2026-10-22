"use client";

import Image from "next/image";
import { DashboardDisplay } from "./DashboardDisplay";
import { Reveal, Section, SectionHeader } from "./primitives";
import { PhoneFrame } from "./product-ui";

const formats = [
  {
    title: "Drop-in classes",
    body: "One-off sessions students book in a single tap — no account needed on their end.",
    url: "/new-flowboc-ui.png",
  },
  {
    title: "Recurring series",
    body: "Set a weekly schedule once. Flowboc keeps generating new classes automatically.",
    url: "/recurring-ui.png",
  },
  {
    title: "1-on-1 video calls",
    body: "Offer private sessions at their own price, booked and confirmed instantly.",
    url: "/video-call-img.png",
  },
];

export function TeachYourWay() {
  return (
    <Section id="teach-your-way" className="bg-white">
      <SectionHeader
        eyebrow="Every way you teach"
        title="One dashboard."
        serif="Every class format."
      />

      <div className="mt-16 grid grid-cols-1 gap-16 lg:grid-cols-3 lg:gap-10">
        {formats.map((f, i) => (
          <Reveal key={f.title} delay={i * 0.1} className="flex flex-col items-center text-center">
            <h3 className="text-2xl font-bold tracking-tight sm:text-3xl">{f.title}</h3>
            <p className="mt-3 max-w-xs text-base leading-relaxed text-muted-foreground">
              {f.body}
            </p>
            <PhoneFrame className="mt-8 w-full max-w-[290px]">
              <div className="min-h-[550px]">
                <Image
                  src={f.url}
                  alt="Flowboc booking page showing an instructor's profile, a bookable video call and upcoming classes"
                  fill
                  sizes="(min-width: 1024px) 240px, (min-width: 640px) 200px, 170px"
                  priority
                  className="object-cover object-top "
                />
              </div>
            </PhoneFrame>
          </Reveal>
        ))}
      </div>

      <DashboardDisplay />
    </Section>
  );
}
