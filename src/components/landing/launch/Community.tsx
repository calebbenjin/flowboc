"use client";

import { Mail } from "lucide-react";
import { useLaunchDialog } from "./LaunchDialogContext";

export function Community() {
  const { openEmailPreview } = useLaunchDialog();

  return (
    <section id="community" className="px-5 py-16 sm:px-8 lg:py-24">
      <div className="mx-auto grid w-full max-w-[1230px] items-center gap-16 lg:grid-cols-2">
        <div>
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.17em] text-[#6355ff]">
            Your people, closer
          </p>
          <h2 className="display mt-4 text-4xl leading-[1.08] tracking-tight text-[#272334] sm:text-5xl">
            Build a connection
            <br />
            that lasts beyond
            <br />
            <em className="font-normal italic text-[#6355ff]">one class.</em>
          </h2>
          <p className="mt-5 text-sm leading-[1.9] text-[#716277]">
            Give visitors a way to subscribe to your updates. Send newsletters about new classes,
            workshops, or the work you want to share.
          </p>
          <p className="mt-4 text-sm leading-[1.9] text-[#716277]">
            Keep booking history and attendance visible, so you have useful context when students
            return. Export your subscriber list when you need it.
          </p>
          <button
            type="button"
            onClick={openEmailPreview}
            className="mt-6 inline-flex items-center gap-3 text-sm font-semibold text-[#272334] hover:text-[#6355ff]"
          >
            Preview a student update <span>↗</span>
          </button>
        </div>

        <div className="relative mx-auto grid h-[420px] w-full max-w-[460px] place-items-center">
          <div className="absolute h-[345px] w-[410px] max-w-full -rotate-[8deg] rounded-full bg-[#eef0df]" />
          <div className="absolute right-[67px] top-4 grid size-[51px] place-items-center rounded-full border-[5px] border-[#fcfbf7] bg-[#d9e6c6] font-display text-xl text-[#748761]">
            J
          </div>
          <div className="absolute right-0 top-[180px] grid size-[51px] place-items-center rounded-full border-[5px] border-[#fcfbf7] bg-[#f1ddc0] font-display text-xl text-[#a6855b]">
            A
          </div>
          <div className="absolute bottom-6 left-0 grid size-[51px] place-items-center rounded-full border-[5px] border-[#fcfbf7] bg-[#e5d2ed] font-display text-xl text-[#9470a5]">
            L
          </div>

          <div className="relative w-[285px] -rotate-3 rounded-xl border border-[#eadfce] bg-[#fffaf0] p-6 shadow-[0_15px_30px_rgba(48,38,51,0.04)]">
            <div className="flex items-center gap-2 text-[0.55rem] tracking-[0.05em] text-[#ae8b9c]">
              <Mail className="size-3.5" />
              <span>FROM MAYA YOGA</span>
              <span className="ml-auto">♡</span>
            </div>
            <h3 className="display mt-5 text-3xl leading-[1.1] text-[#272334]">
              A little room
              <br />
              for <em className="font-normal italic text-[#9c7faa]">yourself.</em>
            </h3>
            <p className="mt-4 text-xs leading-[1.8] text-[#a58b9e]">
              This week&rsquo;s classes are ready.
              <br />
              Come as you are.
            </p>
            <p className="mt-2 text-[0.65rem] leading-[1.9] text-[#a58b9e]">
              Join me for Morning Flow this Monday, or slow down with our evening reset. There is a
              place for you here.
            </p>
            <button
              onClick={openEmailPreview}
              className="mt-5 w-full rounded-full bg-[#80619a] py-2.5 text-[0.65rem] text-white"
            >
              Explore this week&rsquo;s classes ↗
            </button>
            <small className="mt-3 block text-center text-[0.55rem] text-[#ba9fb4]">
              Illustrative newsletter preview
            </small>
          </div>
          <span className="display absolute bottom-1 right-4 rotate-[5deg] text-sm italic text-[#a08aaa]">
            A direct connection to your teaching.
          </span>
        </div>
      </div>
    </section>
  );
}
