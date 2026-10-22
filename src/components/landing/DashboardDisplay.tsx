"use client";

import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import Image from "next/image";

export function DashboardDisplay() {
  const reduce = useReducedMotion();
  const tiltRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: tiltRef,
    offset: ["start 95%", "start 45%"],
  });
  const rotateX = useTransform(scrollYProgress, [0, 1], [24, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [0.92, 1]);

  return (
    <section
      id="top"
      className="relative overflow-hidden px-5 pb-6 pt-14 sm:px-8 lg:pb-30 lg:pt-6 bg-transparent"
    >
      <div className="mx-auto w-full">
        <div ref={tiltRef} className="relative mx-auto mt-14 max-w-7xl lg:mt-4">
          {/* <div
            aria-hidden
            className="absolute inset-x-10 top-16 bottom-0 rounded-[2.5rem] sm:inset-x-16"
            style={{
              backgroundColor: "color-mix(in oklch, var(--primary-foreground) 10%, transparent)",
              backgroundImage: "radial-gradient(rgba(255,255,255,0.4) 1px, transparent 1px)",
              backgroundSize: "18px 18px",
            }}
          /> */}

          <motion.div
            initial={reduce ? false : { opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            style={{
              rotateX: reduce ? 0 : rotateX,
              scale: reduce ? 1 : scale,
              transformPerspective: 4800,
              transformOrigin: "bottom center",
            }}
            className="relative rounded-[2rem] border border-white/15 bg-white/10 p-2.5 shadow-2xl backdrop-blur-sm sm:p-3.5"
          >
            <div className="overflow-hidden rounded-[1.5rem]">
              <Image
                src="/main-dashboard-img.png"
                alt="Flowboc dashboard showing revenue, upcoming classes and bookings"
                width={2560}
                height={1600}
                priority
                className="h-auto w-full"
              />
            </div>
          </motion.div>

          {/* <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-28 rounded-b-[2.5rem] bg-linear-to-b from-transparent to-primary sm:h-40"
          /> */}
        </div>
      </div>
    </section>
  );
}
