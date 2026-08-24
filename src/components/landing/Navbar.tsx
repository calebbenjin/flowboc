"use client";

import * as React from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const links = [
  { label: "Product", href: "#product" },
  { label: "How it works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
];

export function Navbar() {
  const { status } = useSession();
  const authed = status === "authenticated";
  const [open, setOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b transition-colors",
        scrolled
          ? "border-border bg-[#6355ff]/85 backdrop-blur-md"
          : "border-transparent bg-[#6355ff]",
      )}
    >
      <nav className="mx-auto flex h-16 w-full max-w-[1200px] items-center justify-between px-5 sm:px-8">
        <a href="#top" className="flex items-center font-extrabold text-white text-2xl ">
          flowbuk
        </a>

        <div className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <a
              key={l.label}
              href={l.href}
              className="text-sm text-white transition-colors hover:text-foreground"
            >
              {l.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-2 md:flex">
          {authed ? (
            <Button asChild size="sm" className="w-full bg-white hover:bg-[#30ffb4] text-black">
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/auth">Log in</Link>
              </Button>
              <Button asChild variant="clay" size="sm">
                <Link href="/auth">Start Trial</Link>
              </Button>
            </>
          )}
        </div>

        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="grid size-11 place-items-center rounded-md text-foreground md:hidden"
        >
          {open ? <Menu className="size-5 rotate-90" /> : <Menu className="size-5" />}
        </button>
      </nav>

      {open ? (
        <div className="border-t border-border bg-background px-5 pb-5 pt-2 md:hidden">
          <div className="flex flex-col">
            {links.map((l) => (
              <a
                key={l.label}
                href={l.href}
                onClick={() => setOpen(false)}
                className="flex min-h-11 items-center text-sm text-muted-foreground"
              >
                {l.label}
              </a>
            ))}
          </div>
          <div className="mt-3 flex flex-col gap-2">
            {authed ? (
              <Button asChild variant="clay" size="lg">
                <Link href="/dashboard">Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="quiet" size="lg">
                  <Link href="/auth">Log in</Link>
                </Button>
                <Button asChild variant="clay" size="lg">
                  <Link href="/auth">Start Trial</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      ) : null}
      <span className="hidden">
        <X className="size-0" />
      </span>
    </header>
  );
}
