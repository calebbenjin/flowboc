"use client";

import Image from "next/image";
import { useLaunchDialog } from "./LaunchDialogContext";

const calendarDates = [
  { day: "2", circled: true },
  { day: "3" },
  { day: "4", circled: true },
  { day: "5" },
  { day: "6", circled: true },
  { day: "7" },
  { day: "8" },
  { day: "9", circled: true },
  { day: "10" },
  { day: "11", circled: true },
  { day: "12" },
  { day: "13", circled: true },
  { day: "14" },
  { day: "15" },
];

export function Offers() {
  const { openBooking, openOffer } = useLaunchDialog();

  return (
    <section id="offers" className="bg-[#f5f0e7] px-5 py-16 sm:px-8 lg:py-24">
      <div className="mx-auto w-full max-w-[1230px]">
        <div className="max-w-[600px]">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.17em] text-primary">
            Group classes, 1:1 sessions &amp; ebooks
          </p>
          <h2 className="display mt-4 text-4xl leading-[1.08] tracking-tight text-[#272334] sm:text-5xl">
            Build your offers around
            <br />
            the way <em className="font-normal italic text-primary">you teach.</em>
          </h2>
        </div>

        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <article>
            <div className="relative mb-7 h-[260px] overflow-hidden rounded-[20px] bg-[#e7e0f4] sm:h-[286px]">
              <Image
                src="/flowboc-launch/assets/studio.jpg"
                alt="Sunlight falling across a yoga studio"
                fill
                className="object-cover object-[40%_50%] saturate-[0.7]"
              />
              <div className="absolute bottom-4 right-4 w-[200px] -rotate-3 rounded-xl border border-white/65 bg-[#fffdf6f5] p-4 shadow-[0_10px_20px_rgba(48,35,52,0.15)] backdrop-blur">
                <div className="flex justify-between text-xs font-semibold">
                  <span>November</span> <span>↗</span>
                </div>
                <div className="mt-3 grid grid-cols-7 text-center text-[0.55rem] text-[#aaa0b5]">
                  {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                    <span key={i}>{d}</span>
                  ))}
                </div>
                <div className="mt-2 grid grid-cols-7 gap-0.5 text-center text-[0.6rem]">
                  {calendarDates.map((d, i) => (
                    <span
                      key={i}
                      className={d.circled ? "rounded-full bg-[#eae5ff] py-1 text-primary" : "py-1"}
                    >
                      {d.day}
                    </span>
                  ))}
                </div>
                <div className="mt-2 flex items-center gap-1.5 border-t border-[#eee9f4] pt-3 text-[0.6rem]">
                  <span className="size-1.5 rounded-full bg-primary" /> Your weekly flow
                  <small className="ml-auto text-[#9a90a4]">60 min</small>
                </div>
              </div>
            </div>
            <p className="text-[0.65rem] font-semibold tracking-[0.05em] text-[#6355ff]">
              01 / CLASSES
            </p>
            <h3 className="display mt-3 text-2xl text-[#272334]">Classes on your terms.</h3>
            <p className="mt-3 text-sm leading-[1.9] text-[#716277]">
              Online or in person. A workshop, a small group, or a private session. Set your prices
              and capacity; recurring schedules are included in both plans.
            </p>
            <button
              type="button"
              onClick={() => openBooking(0)}
              className="mt-5 inline-flex items-center gap-3 text-sm font-semibold text-[#272334] hover:text-[#6355ff]"
            >
              Explore a class <span>↗</span>
            </button>
          </article>

          <article>
            <div className="relative mb-7 h-[260px] overflow-hidden rounded-[20px] bg-[#e0e9db] sm:h-[286px]">
              <div className="absolute inset-0">
                <Image
                  src="/flowboc-launch/assets/instructor.jpg"
                  alt="Example instructor for a consultation offer"
                  fill
                  className="object-cover object-[center_46%] saturate-[0.75]"
                />
                <span className="absolute inset-x-4 bottom-4 rounded-full border border-white/50 bg-[#fffdf3e8] px-3 py-2.5 text-center text-xs text-[#7e677f] backdrop-blur">
                  1 : 1 · A little individual attention.
                </span>
              </div>
            </div>
            <p className="text-[0.65rem] font-semibold tracking-[0.05em] text-[#6355ff]">
              02 / CONSULTATIONS
            </p>
            <h3 className="display mt-3 text-2xl text-[#272334]">A more personal connection.</h3>
            <p className="mt-3 text-sm leading-[1.9] text-[#716277]">
              Add a free or paid video-call offer to your page. Connect students to your
              consultation link after their booking is confirmed.
            </p>
            <button
              type="button"
              onClick={() => openOffer("consultation")}
              className="mt-5 inline-flex items-center gap-3 text-sm font-semibold text-[#272334] hover:text-[#6355ff]"
            >
              Preview the offer <span>↗</span>
            </button>
          </article>

          <article>
            <div className="relative mb-7 flex h-[260px] items-center justify-center overflow-hidden rounded-[20px] bg-[#e1e8d5] sm:h-[286px]">
              <div className="w-[130px] -rotate-[9deg] scale-110 rounded-l-sm rounded-r-lg bg-[#65548b] p-4 text-[#f7f0df] shadow-[6px_6px_0_#d6ddc9,15px_22px_25px_rgba(75,92,61,0.13)]">
                <small className="text-[0.4rem] tracking-[0.1em]">MAYA YOGA</small>
                <strong className="display mt-3 block text-lg leading-tight">
                  The everyday
                  <br />
                  <em className="font-normal italic">practice.</em>
                </strong>
                <span className="mt-3 block text-[0.4rem] tracking-[0.05em]">
                  A GUIDE TO FINDING YOUR FLOW
                </span>
              </div>
              <span className="absolute bottom-7 right-5 grid size-[70px] rotate-[10deg] place-items-center rounded-full bg-[#fffcee] text-center text-sm text-[#8c8e6b]">
                ↓
                <small className="mt-1 block text-[0.45rem] leading-tight">
                  Your guide,
                  <br />
                  ready to share.
                </small>
              </span>
            </div>
            <p className="text-[0.65rem] font-semibold tracking-[0.05em] text-[#6355ff]">
              03 / YOUR KNOWLEDGE
            </p>
            <h3 className="display mt-3 text-2xl text-[#272334]">Beyond the class.</h3>
            <p className="mt-3 text-sm leading-[1.9] text-[#716277]">
              Sell an ebook or practice guide alongside your classes. Buyers receive a download link
              after a successful purchase.
            </p>
            <button
              type="button"
              onClick={() => openOffer("ebook")}
              className="mt-5 inline-flex items-center gap-3 text-sm font-semibold text-[#272334] hover:text-[#6355ff]"
            >
              Preview the offer <span>↗</span>
            </button>
          </article>
        </div>

        <p className="mt-10 text-[11px] text-[#7c6b84]">
          Paid offers require a supported country and currency and a connected payout account.
        </p>
      </div>
    </section>
  );
}
