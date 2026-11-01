"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { Check, Copy, ArrowRight, ExternalLink, Flower2, Palette } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ClassReviewCard } from "@/components/ClassReviewCard";
import { useInstructor } from "@/components/InstructorProvider";
import { siteUrl } from "@/lib/site";
import styles from "./FirstClassCelebration.module.css";

export type ClassMilestone = { values: Record<string, string>; classCount: number };

export function FirstClassCelebration({ milestone }: { milestone: ClassMilestone }) {
  const instructor = useInstructor();
  const reducedMotion = useReducedMotion();
  const [copied, setCopied] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const fired = useRef(false);
  const resetCopy = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "instant" });
    return () => {
      if (resetCopy.current) clearTimeout(resetCopy.current);
    };
  }, []);

  useEffect(() => {
    if (reducedMotion !== false || fired.current) return;
    let cancelled = false;
    let dispose: (() => void) | undefined;
    void import("canvas-confetti")
      .then(({ default: confetti }) => {
        if (cancelled) return;
        fired.current = true;
        const canvas = document.createElement("canvas");
        canvas.className = styles["confetti"] ?? "";
        canvas.setAttribute("aria-hidden", "true");
        document.body.append(canvas);
        const celebrate = confetti.create(canvas, { resize: true, useWorker: true });
        dispose = () => {
          celebrate.reset();
          canvas.remove();
        };
        const base = {
          colors: ["#6355ff", "#a596ff", "#d7caff", "#f0ddbe"],
          ticks: 170,
          gravity: 1,
          scalar: 0.8,
          disableForReducedMotion: true,
        };
        void Promise.all([
          celebrate({
            ...base,
            particleCount: 55,
            angle: 65,
            spread: 65,
            origin: { x: 0.05, y: 0.55 },
          }),
          celebrate({
            ...base,
            particleCount: 55,
            angle: 115,
            spread: 65,
            origin: { x: 0.95, y: 0.55 },
          }),
        ]).finally(() => dispose?.());
      })
      .catch(() => {
        /* The milestone remains usable if the optional effect can't load. */
      });
    return () => {
      cancelled = true;
      dispose?.();
    };
  }, [reducedMotion]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(`${siteUrl}/${instructor.slug}`);
      setCopied(true);
      if (resetCopy.current) clearTimeout(resetCopy.current);
      resetCopy.current = setTimeout(() => setCopied(false), 2500);
      toast.success("Your invitation is ready to share.");
    } catch {
      toast.error("Couldn’t copy the link. Open your public page and copy its address.");
    }
  }

  return (
    <motion.section
      className={styles["celebration"]}
      initial={{ opacity: reducedMotion ? 1 : 0, y: reducedMotion ? 0 : 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reducedMotion ? 0 : 0.45 }}
      aria-labelledby="first-class-title"
    >
      <div className={styles["intro"]}>
        <motion.div
          className={styles["flower"]}
          initial={{ scale: reducedMotion ? 1 : 0.8 }}
          animate={{ scale: 1 }}
          transition={{ duration: reducedMotion ? 0 : 0.5 }}
        >
          <Flower2 size={38} aria-hidden="true" />
          <span>
            <Check size={13} />
          </span>
        </motion.div>
        <p className={styles["eyebrow"]}>Your first invitation is out in the world</p>
        <h1 id="first-class-title" ref={heading} tabIndex={-1}>
          Your first class is live, {instructor.name.split(" ")[0]}!
        </h1>
        <p className={styles["body"]}>
          You’ve made space for someone’s next practice. Take a moment. This is a lovely beginning.
        </p>
        {milestone.classCount > 1 && (
          <p className={styles["series"]}>
            Your first series is ready, with {milestone.classCount} class dates published.
          </p>
        )}
      </div>
      <div className={styles["layout"]}>
        <div className={styles["classCard"]}>
          <ClassReviewCard
            values={milestone.values}
            currency={instructor.currency}
            scope={
              milestone.classCount > 1
                ? `The first of ${milestone.classCount} published class dates. Your full schedule is on your public page.`
                : "Published and ready to welcome your students."
            }
          />
        </div>
        <div className={styles["nextSteps"]}>
          <p className={styles["eyebrow"]}>Let’s welcome your people</p>
          <h2>See your teaching space come to life.</h2>
          <p>Preview your public page, add a personal touch, then share your invitation.</p>
          <Button asChild className={styles["primary"]}>
            <Link href={`/${instructor.slug}`} target="_blank" rel="noopener noreferrer">
              View my public page <ExternalLink size={16} />
            </Link>
          </Button>
          <Button asChild variant="quiet" className={styles["secondary"]}>
            <Link href="/dashboard/booking-page">
              <Palette size={16} /> Make my page feel like me
            </Link>
          </Button>
          <div className={styles["share"]}>
            <h3>Ready to invite your first students?</h3>
            <p>Your link brings them straight to your classes.</p>
            <Button variant="quiet" onClick={() => void copyLink()} className={styles["copy"]}>
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? "Link copied" : "Copy my booking link"}
            </Button>
          </div>
          <Link href="/dashboard/classes" className={styles["allClasses"]}>
            Back to my classes <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </motion.section>
  );
}
