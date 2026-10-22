import Image from "next/image";
import { CalendarDays, Link2, Mail, Video, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Reveal, Section, SectionHeader } from "./primitives";

const modules: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: Link2,
    title: "Links",
    body: "Socials, your website, anything with a URL.",
  },
  {
    icon: CalendarDays,
    title: "Classes",
    body: "Drop-in and recurring sessions, bookable in one tap.",
  },
  {
    icon: Video,
    title: "1-on-1 sessions",
    body: "Private video calls, booked and confirmed instantly.",
  },
  {
    icon: Mail,
    title: "Newsletter",
    body: "Keep every student who's booked with you in the loop.",
  },
];

function ModuleCard({ m, align }: { m: (typeof modules)[number]; align: "left" | "right" }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card p-7 lg:max-w-sm",
        align === "left" ? "lg:ml-auto" : "lg:mr-auto",
      )}
    >
      <span className="grid size-12 place-items-center rounded-full bg-clay/12 text-clay">
        <m.icon className="size-5" />
      </span>
      <h3 className="mt-5 text-xl font-semibold sm:text-2xl">{m.title}</h3>
      <p className="mt-2 text-base leading-relaxed text-muted-foreground">{m.body}</p>
    </div>
  );
}

export function OneLink() {
  const [links, classes, sessions, newsletter] = modules;

  return (
    <Section className="overflow-hidden bg-primary/10" id="one-link">
      <SectionHeader
        eyebrow="One link"
        title="Everything you teach,"
        serif="on one page."
        body="Your links, your classes, your private sessions and your newsletter — all living under one URL."
      />

      <div className="mt-14 grid items-center gap-12 lg:grid-cols-[1fr_auto_1fr] lg:gap-8">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
          <Reveal>
            <ModuleCard m={links!} align="left" />
          </Reveal>
          <Reveal delay={0.08}>
            <ModuleCard m={classes!} align="left" />
          </Reveal>
        </div>

        <Reveal delay={0.16} className="flex justify-center">
          <Image
            src="/phone-img.png"
            alt="Flowboc booking page showing an instructor's links, classes and sessions"
            width={693}
            height={1451}
            className="h-auto w-64 drop-shadow-xl sm:w-80 lg:w-72 xl:w-80"
          />
        </Reveal>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
          <Reveal delay={0.1}>
            <ModuleCard m={sessions!} align="right" />
          </Reveal>
          <Reveal delay={0.18}>
            <ModuleCard m={newsletter!} align="right" />
          </Reveal>
        </div>
      </div>
    </Section>
  );
}
