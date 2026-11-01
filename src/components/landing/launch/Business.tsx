"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";

export function Business() {
  const reduce = useReducedMotion();
  const tiltRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: tiltRef,
    offset: ["start 95%", "start 45%"],
  });
  const rotateX = useTransform(scrollYProgress, [0, 1], [18, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [0.94, 1]);

  return (
    <section id="business" className="bg-[#2d263b] px-5 py-16 sm:px-8 lg:py-24">
      <div className="mx-auto w-full max-w-[1230px]">
        <div className="grid gap-10 pb-12 lg:grid-cols-[1fr_0.9fr] lg:gap-28">
          <div>
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.17em] text-[#c1accf]">
              The business behind your teaching
            </p>
            <h2 className="display mt-4 text-4xl leading-[1.08] text-[#fff8ed] sm:text-5xl">
              Run the details
              <br />
              with <em className="font-normal italic text-[#d4edb0]">a clearer head.</em>
            </h2>
          </div>
          <div className="text-sm leading-[1.9] text-[#bca8c6]">
            <p>
              See upcoming classes, bookings, and payment status. Keep student details together,
              mark attendance, and add students who book outside Flowboc.
            </p>
            <p className="mt-4">
              Booking confirmations and reminder emails help keep students informed.
            </p>
          </div>
        </div>

        <div ref={tiltRef} className="relative">
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 30 }}
            {...(reduce
              ? {}
              : { whileInView: { opacity: 1, y: 0 }, viewport: { once: true, amount: 0.3 } })}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            style={{
              rotateX: reduce ? 0 : rotateX,
              scale: reduce ? 1 : scale,
              transformPerspective: 4800,
              transformOrigin: "bottom center",
            }}
            className="relative rounded-[2rem] border border-white/15 bg-white/10 p-2.5 shadow-[0_30px_60px_rgba(19,14,29,0.3)] backdrop-blur-sm sm:p-3.5"
          >
            <div className="overflow-hidden rounded-[1.5rem]">
              <Image
                src="/main-dashboard-img.png"
                alt="The Flowboc dashboard showing revenue, upcoming classes, bookings, and students"
                width={2560}
                height={1600}
                className="h-auto w-full"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
