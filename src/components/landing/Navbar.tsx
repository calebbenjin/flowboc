"use client";

import * as React from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { ArrowRight, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const links = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  // { label: "FAQ", href: "#faq" },
];

export function Navbar() {
  const { status } = useSession();
  const authed = status === "authenticated";
  const [open, setOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const hero = document.getElementById("top");
    if (!hero) return;
    const observer = new IntersectionObserver(
      ([entry]) => entry && setScrolled(!entry.isIntersecting),
      {
        rootMargin: "-80px 0px 0px 0px",
        threshold: 0,
      },
    );
    observer.observe(hero);
    return () => observer.disconnect();
  }, []);

  return (
    <header
      className={cn(
        "sticky  top-0 z-50 transition-colors pt-4 px-5 sm:px-4 lg:px-0 border-transparent",
        scrolled ? "bg-transparent backdrop-blur-md" : "border-transparent bg-primary",
      )}
    >
      <div className="w-full max-w-6xl mx-auto">
        <nav
          className={cn(
            "mr-auto flex h-16 w-full max-w-2xl rounded-xl bg-white items-center justify-between px-5 sm:px-4",
            scrolled ? "bg-primary text-white" : "bg-white/90",
          )}
        >
          <a
            href="#top"
            className="flex items-center font-extrabold text-primay xl:text-xl text-lg"
          >
            flowbuk
          </a>

          <div className="hidden items-center gap-4 md:flex">
            {links.map((l) => (
              <a
                key={l.label}
                href={l.href}
                className={cn(
                  "text-sm transition-colors hover:text-foreground",
                  scrolled ? "text-white" : "text-black",
                )}
              >
                {l.label}
              </a>
            ))}
          </div>

          <div className="hidden items-center md:flex">
            {authed ? (
              <Button asChild size="lg" className="w-full">
                <Link href="/dashboard">Dashboard</Link>
              </Button>
            ) : (
              <>
                {/* <Button
                asChild
                variant="ghost"
                size="lg"
                className={cn(scrolled ? "text-white" : "text-black")}
              >
                <Link href="/auth">Log in</Link>
              </Button> */}
                <Button
                  asChild
                  variant="secondary"
                  size="lg"
                  className="w-full bg-mint hover:bg-mint/90 text-mint-foreground"
                >
                  <Link href="/auth">
                    Get free trial <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </>
            )}
          </div>

          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className={cn(
              "ml-2 flex h-10 w-10 items-center justify-center rounded-lg transition-colors md:hidden",
              scrolled ? "text-white" : "text-primary",
            )}
          >
            {open ? <X className="size-5 rotate-90" /> : <Menu className="size-5" />}
          </button>
        </nav>

        {open ? (
          <div className="border border-white bg-primary px-5 pb-5 pt-2 md:hidden w-full max-w-2xl mx-auto rounded-2xl">
            <div className="flex flex-col">
              {links.map((l) => (
                <a
                  key={l.label}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="flex min-h-11 items-center text-sm text-white transition-colors hover:text-foreground"
                >
                  {l.label}
                </a>
              ))}
            </div>
            <div className="mt-3 flex flex-col gap-2">
              {authed ? (
                <Button asChild variant="mint" size="lg">
                  <Link href="/dashboard">Dashboard</Link>
                </Button>
              ) : (
                <>
                  <Button
                    asChild
                    variant="quiet"
                    size="lg"
                    className="w-full text-black sm:text-white"
                  >
                    <Link href="/auth">Log in</Link>
                  </Button>
                  <Button asChild variant="secondary" size="lg">
                    <Link href="/auth">Start Your 14-Day Trial</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        ) : null}
        <span className="hidden">
          <X className="size-0 " />
        </span>
      </div>
    </header>
  );
}
