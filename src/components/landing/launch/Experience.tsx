"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, Check, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { HeroBookingDemo } from "./HeroBookingDemo";
import styles from "./Experience.module.css";

const journey = [
  {
    title: "Find their kind of practice",
    description:
      "Explore your classes, a personal 1:1 session, or an ebook. Everything starts on your Sage page.",
  },
  {
    title: "Make it theirs",
    description:
      "Add their details and choose a time for a private session. There’s no account to create.",
  },
  {
    title: "Pay in a few taps",
    description:
      "Review the total and continue to secure checkout. Try the simulated payment in the phone.",
  },
  {
    title: "All set. Back to their day.",
    description:
      "A confirmed place, a booked session, or a guide to keep. Their next step arrives by email.",
  },
];

export function Experience() {
  const [step, setStep] = useState(0);
  const [previewOpen, setPreviewOpen] = useState(false);
  const reducedMotion = useReducedMotion();

  return (
    <section id="experience" className="px-5 py-16 sm:px-8 lg:py-24">
      <div className="mx-auto w-full max-w-[1230px]">
        <div className="mx-auto max-w-[730px] text-center">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.17em] text-primary">
            From &ldquo;I&rsquo;d love to&rdquo; to &ldquo;I&rsquo;m booked&rdquo;
          </p>
          <h2 className="display mt-4 text-4xl leading-[1.08] tracking-tight text-[#272334] sm:text-5xl">
            Make joining your class
            <br />
            <em className="font-normal italic text-primary">the easy part.</em>
          </h2>
          <p className="mx-auto mt-5 max-w-[550px] text-sm leading-[1.85] text-[#716277]">
            A class, a little one-to-one guidance, or a practice to take home. See how your students
            go from exploring to all set.
          </p>
        </div>

        <div className={styles["stage"]}>
          <div className={styles["guide"]}>
            <p className={styles["eyebrow"]}>THE BOOKING FLOW</p>
            <h3 className="display mt-4 text-3xl leading-[1.12] text-[#fff9f1] sm:text-4xl">
              Their next practice.
              <br />
              Just a few taps away.
            </h3>
            <p className={styles["intro"]}>Watch the journey, or take the phone for a spin.</p>
            <div className={styles["journey"]} aria-label="Explore the booking journey">
              {journey.map((item, index) => (
                <button
                  key={item.title}
                  className={styles["step"]}
                  aria-current={step === index ? "step" : undefined}
                  onClick={() => setStep(index)}
                >
                  <span className={styles["number"]}>
                    {step === index && (
                      <motion.span
                        className={styles["activeRing"]}
                        layoutId="experience-active-step"
                        transition={{ duration: reducedMotion ? 0 : 0.35 }}
                      />
                    )}
                    <span>{index < step ? <Check size={16} /> : index + 1}</span>
                  </span>
                  <span>
                    <strong>{item.title}</strong>
                    <span className={styles["description"]}>{item.description}</span>
                  </span>
                  <ArrowRight size={16} className={styles["arrow"]} aria-hidden="true" />
                </button>
              ))}
            </div>
            <Button
              className="mt-7 bg-[#e3efd8] text-[#303b2d] hover:bg-[#d1e5be]"
              onClick={() => setPreviewOpen(true)}
            >
              Try the live public page <ExternalLink className="size-4" />
            </Button>
          </div>
          <motion.div
            className={styles["demo"]}
            initial={{ opacity: reducedMotion ? 1 : 0, y: reducedMotion ? 0 : 26 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: reducedMotion ? 0 : 0.6 }}
          >
            <HeroBookingDemo activeStep={step} onStepChange={setStep} />
          </motion.div>
        </div>
        <p className="mt-6 text-center text-[11px] leading-relaxed text-[#7c6b84]">
          The interactive phone uses example bookings and purchases. No payment is taken. The live
          public page opens separately below.
        </p>
      </div>
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="flex h-[90dvh] w-[calc(100%-2rem)] max-w-md flex-col gap-0 overflow-hidden rounded-2xl border-[#89907b] bg-[#faf7ee] p-0">
          <div className="border-b border-[#dfe5d8] p-4 pr-12">
            <DialogTitle className="text-sm">Live guest booking demo</DialogTitle>
            <DialogDescription className="mt-1 text-xs">
              Explore Sarah’s public page and guest booking experience.
            </DialogDescription>
          </div>
          <iframe
            src="/sarah-yoga-demo"
            title="Live guest booking demo"
            className="min-h-0 w-full flex-1 border-0 bg-white"
          />
        </DialogContent>
      </Dialog>
    </section>
  );
}
