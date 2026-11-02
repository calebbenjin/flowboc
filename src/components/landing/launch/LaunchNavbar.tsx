"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthCta } from "./useAuthCta";

const links = [
  { label: "Your page", href: "#your-page" },
  { label: "How it works", href: "#experience" },
  { label: "Business tools", href: "#business" },
  { label: "Pricing", href: "#pricing" },
];

export function LaunchNavbar() {
  const [open, setOpen] = React.useState(false);
  const { authed, rememberedDevice } = useAuthCta();

  return (
    <>
      <div className="bg-[#30293e] px-5 py-2.5 text-center text-xs text-[#ddd3ed] sm:px-8">
        A new chapter for your teaching.{" "}
        <strong className="font-semibold text-white">Launching 1 November.</strong>{" "}
        <a href="#setup" className="ml-2 text-[#baffdc] underline-offset-2 hover:underline">
          Meet your business home ↗
        </a>
      </div>
      <header className="sticky top-0 z-40 border-b border-[#eee9e3] bg-[#fcfbf7]/95 backdrop-blur-md">
        <div className="mx-auto flex h-[88px] w-full max-w-[1320px] items-center justify-between gap-6 px-5 sm:px-8">
          <a href="#home" aria-label="Flowboc home" className="flex items-center">
            <Image
              src="/flowboc-launch/assets/flowboc-logo.png"
              alt="Flowboc"
              width={132}
              height={35}
              className="h-auto w-[132px] lg:flex hidden"
            />
            <Image
              src="/flowboc-launch/assets/flowboc-logo.png"
              alt="Flowboc"
              width={132}
              height={35}
              className="h-auto w-[82px] flex lg:hidden"
            />
          </a>
          <nav className="hidden items-center gap-8 text-sm font-medium md:flex">
            {links.map((l) => (
              <a key={l.label} href={l.href} className="text-[#4a4152] hover:text-[#6355ff]">
                {l.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-3 sm:gap-6">
            {authed ? (
              <>
                <Button
                  asChild
                  size="sm"
                  className="bg-[#6355ff] text-white hover:bg-[#5042e5] md:h-10 md:px-6 md:text-base"
                >
                  <Link href="/dashboard">
                    Go to my account <ArrowRight className="size-3.5" />
                  </Link>
                </Button>
                <button
                  type="button"
                  aria-label={open ? "Close navigation" : "Open navigation"}
                  aria-expanded={open}
                  onClick={() => setOpen((v) => !v)}
                  className="grid size-9 place-items-center text-[#272334] md:hidden"
                >
                  {open ? <X className="size-5" /> : <Menu className="size-5" />}
                </button>
              </>
            ) : rememberedDevice ? (
              <>
                <Button
                  asChild
                  size="sm"
                  className="bg-[#6355ff] text-white hover:bg-[#5042e5] md:h-10 md:px-6 md:text-base"
                >
                  <Link href="/auth?mode=login">
                    Log in <ArrowRight className="size-3.5" />
                  </Link>
                </Button>
                <button
                  type="button"
                  aria-label={open ? "Close navigation" : "Open navigation"}
                  aria-expanded={open}
                  onClick={() => setOpen((v) => !v)}
                  className="grid size-9 place-items-center text-[#272334] md:hidden"
                >
                  {open ? <X className="size-5" /> : <Menu className="size-5" />}
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth?mode=login"
                  className="hidden text-sm font-medium text-[#272334] sm:inline-flex"
                >
                  Log in
                </Link>
                <Button
                  asChild
                  size="sm"
                  className="bg-[#6355ff] text-white hover:bg-[#5042e5] md:h-10 md:px-6 md:text-base"
                >
                  <Link href="/auth">
                    Start my page <ArrowRight className="size-3.5" />
                  </Link>
                </Button>
                <button
                  type="button"
                  aria-label={open ? "Close navigation" : "Open navigation"}
                  aria-expanded={open}
                  onClick={() => setOpen((v) => !v)}
                  className="grid size-9 place-items-center text-[#272334] md:hidden"
                >
                  {open ? <X className="size-5" /> : <Menu className="size-5" />}
                </button>
              </>
            )}
          </div>
        </div>
        {open ? (
          <nav className="border-t border-[#e2dfd7] px-5 pb-6 pt-3 md:hidden">
            {links.concat([{ label: "FAQs", href: "#faq" }]).map((l) => (
              <a
                key={l.label}
                href={l.href}
                onClick={() => setOpen(false)}
                className="block py-2 text-sm font-medium text-[#272334]"
              >
                {l.label}
              </a>
            ))}
            {/* The account/login/signup button is already always visible in
            the top bar (see above) — this panel only needs to add back the
            "Log in" link that the top bar hides below sm for first-time
            visitors, so it isn't lost behind the menu. */}
            {!authed && !rememberedDevice ? (
              <Link
                href="/auth?mode=login"
                onClick={() => setOpen(false)}
                className="mt-3 block py-2 text-sm font-medium text-[#272334] sm:hidden"
              >
                Log in
              </Link>
            ) : null}
          </nav>
        ) : null}
      </header>
    </>
  );
}
