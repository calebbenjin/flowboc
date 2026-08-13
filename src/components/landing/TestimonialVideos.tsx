"use client";

import * as React from "react";
import { Play } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Reveal, Section, SectionHeader } from "./primitives";
import instructorTeaching from "@/assets/instructor-teaching.jpg";
import instructor from "@/assets/instructor.jpg";
import classMorningFlow from "@/assets/class-morning-flow.jpg";
import classEveningYin from "@/assets/class-evening-yin.jpg";

// Placeholder testimonials — swap poster images and add real hosted video
// URLs (videoSrc) before shipping. Names and quotes are placeholders.
const testimonials = [
  {
    name: "Instructor Name",
    studio: "Studio / City",
    quote: "Placeholder quote pulled from the video testimonial.",
    poster: instructorTeaching.src,
    videoSrc: "",
  },
  {
    name: "Instructor Name",
    studio: "Studio / City",
    quote: "Placeholder quote pulled from the video testimonial.",
    poster: instructor.src,
    videoSrc: "",
  },
  {
    name: "Instructor Name",
    studio: "Studio / City",
    quote: "Placeholder quote pulled from the video testimonial.",
    poster: classMorningFlow.src,
    videoSrc: "",
  },
  {
    name: "Instructor Name",
    studio: "Studio / City",
    quote: "Placeholder quote pulled from the video testimonial.",
    poster: classEveningYin.src,
    videoSrc: "",
  },
];

export function TestimonialVideos() {
  const [openIndex, setOpenIndex] = React.useState<number | null>(null);
  const active = openIndex !== null ? testimonials[openIndex] : null;

  return (
    <Section className="bg-sand/30">
      <SectionHeader
        eyebrow="Testimonials"
        title="Yoga teachers"
        serif="love Flowbuk."
        body="Hear directly from instructors who moved their classes off spreadsheets and onto Flowbuk."
      />
      <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {testimonials.map((t, i) => (
          <Reveal key={`${t.name}-${i}`} delay={(i % 4) * 0.08}>
            <button
              type="button"
              onClick={() => setOpenIndex(i)}
              className="group block w-full text-left"
            >
              <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl border border-border">
                <img
                  src={t.poster}
                  alt={`${t.name} video testimonial`}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="flex size-12 items-center justify-center rounded-full bg-background/90 shadow-[var(--shadow-lift)] transition-transform duration-300 group-hover:scale-110">
                    <Play className="size-5 fill-clay text-clay" />
                  </span>
                </div>
                <div className="absolute inset-x-0 bottom-0 p-4">
                  <p className="text-sm font-medium text-white">{t.name}</p>
                  <p className="text-xs text-white/80">{t.studio}</p>
                </div>
              </div>
            </button>
          </Reveal>
        ))}
      </div>

      <Dialog open={openIndex !== null} onOpenChange={(open) => !open && setOpenIndex(null)}>
        <DialogContent className="max-w-2xl p-0 sm:rounded-2xl">
          <DialogTitle className="sr-only">
            {active ? `${active.name} video testimonial` : "Video testimonial"}
          </DialogTitle>
          {active ? (
            <div>
              <video
                controls
                autoPlay
                poster={active.poster}
                src={active.videoSrc || undefined}
                className="aspect-video w-full rounded-t-2xl bg-black"
              />
              <div className="p-6">
                <p className="text-base leading-relaxed text-foreground">
                  &ldquo;{active.quote}&rdquo;
                </p>
                <p className="mt-3 text-sm font-medium">{active.name}</p>
                <p className="text-sm text-muted-foreground">{active.studio}</p>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </Section>
  );
}
