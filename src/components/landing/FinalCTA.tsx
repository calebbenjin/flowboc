import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal, Section } from "./primitives";

export function FinalCTA() {
  return (
    <Section>
      <Reveal>
        <div className="relative overflow-hidden rounded-3xl border border-border bg-primary px-6 py-20 text-center text-primary-foreground sm:px-12">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_60%_at_50%_0%,var(--clay),transparent_70%)] opacity-25"
          />
          <div className="relative mx-auto max-w-2xl">
            <h2 className="text-3xl leading-[1.1] tracking-tight sm:text-4xl lg:text-5xl">
              Your next class is waiting <span className="display italic">to be booked.</span>
            </h2>
            <p className="mx-auto mt-5 max-w-lg text-base opacity-80">
              Create your booking page, share it with your students, and let the platform handle the
              rest.
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="xl" variant="clay" className="w-full sm:w-auto">
                <Link href="/auth">Start Your 14-Day Trial — No Card Required</Link>
              </Button>
              <Button
                asChild
                size="xl"
                variant="ghost"
                className="w-full border border-primary-foreground/25 hover:bg-primary-foreground/10 hover:text-primary-foreground sm:w-auto"
              >
                <a href="#how-it-works">
                  See How It Works <ArrowRight className="size-4" />
                </a>
              </Button>
            </div>
            <p className="mt-5 text-sm opacity-70">Set up in minutes. Cancel anytime.</p>
          </div>
        </div>
      </Reveal>
    </Section>
  );
}
