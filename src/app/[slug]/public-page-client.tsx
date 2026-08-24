"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Instagram,
  Music2,
  Youtube,
  Facebook,
  Twitter,
  MessageCircle,
  Linkedin,
  MapPin,
  Phone,
  Mail,
  Share2,
  Check,
  CalendarClock,
  CalendarX2,
  Loader2,
  Send,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/EmptyState";
import { PriceTag } from "@/components/PriceTag";
import { Reveal } from "@/components/landing/primitives";
import { toast } from "sonner";
import { timezoneLabel, type SocialPlatform } from "@/lib/demo";
import { formatClassDate, formatClassTime } from "@/lib/format-class-time";
import { joinWaitlist, subscribeToNewsletter } from "./actions";

export type PublicInstructor = {
  name: string;
  slug: string;
  photoUrl: string | null;
  bio: string | null;
  location: string | null;
  email: string;
  phone: string | null;
  consultationLink: string | null;
  specialties: string[];
  socials: { platform: string; handle: string }[];
  links: { id: string; label: string; url: string }[];
};

function trackLinkClick(linkId: string) {
  navigator.sendBeacon?.("/api/links/click", JSON.stringify({ linkId }));
}

export type PublicClass = {
  id: string;
  seriesId: string | null;
  recurringLabel: string | null;
  name: string;
  coverUrl: string | null;
  description: string | null;
  startAt: Date;
  timezone: string;
  durationMinutes: number;
  mode: "IN_PERSON" | "ONLINE";
  location: string | null;
  price: number;
  originalPrice: number | null;
  capacity: number;
  spots: number;
};

const socialIcons: Record<string, typeof Instagram> = {
  instagram: Instagram,
  tiktok: Music2,
  youtube: Youtube,
  facebook: Facebook,
  twitter: Twitter,
  whatsapp: MessageCircle,
  linkedin: Linkedin,
};

function socialHref(platform: string, handle: string) {
  if (/^https?:\/\//.test(handle)) return handle;
  switch (platform as SocialPlatform) {
    case "instagram":
      return `https://instagram.com/${handle.replace(/^@/, "")}`;
    case "tiktok":
      return `https://tiktok.com/@${handle.replace(/^@/, "")}`;
    case "youtube":
      return `https://youtube.com/${handle.replace(/^@/, "@")}`;
    case "facebook":
      return `https://${handle.replace(/^https?:\/\//, "")}`;
    case "twitter":
      return `https://x.com/${handle.replace(/^@/, "")}`;
    case "whatsapp":
      return `https://wa.me/${handle.replace(/[^\d]/g, "")}`;
    case "linkedin":
      return `https://${handle.replace(/^https?:\/\//, "")}`;
    default:
      return handle;
  }
}

function ShareButton({ instructorName }: { instructorName: string }) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: `${instructorName} — Book a yoga class`, url });
      } catch {
        // user dismissed the native share sheet
      }
      return;
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <Button variant="quiet" size="sm" onClick={handleShare}>
      {copied ? (
        <>
          <Check className="size-4" /> Copied
        </>
      ) : (
        <>
          <Share2 className="size-4" /> Share
        </>
      )}
    </Button>
  );
}

function NewsletterSignupDialog({ slug }: { slug: string }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState(""); // honeypot, kept off-screen
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    try {
      const result = await subscribeToNewsletter({ slug, name, email, website });
      if (result.ok) {
        toast.success("You're subscribed!");
        setOpen(false);
        setName("");
        setEmail("");
      } else {
        toast.error(result.error);
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="quiet" size="sm">
          <Send className="size-4" /> Subscribe
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Stay in the loop</DialogTitle>
          <DialogDescription>Get updates on new classes and openings by email.</DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={(e) => void handleSubmit(e)}>
          <div className="space-y-2">
            <Label htmlFor="nname">Name (optional)</Label>
            <Input id="nname" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nemail">Email</Label>
            <Input
              id="nemail"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="sarah@mail.com"
            />
          </div>
          <div className="sr-only" aria-hidden="true">
            <Label htmlFor="nwebsite">Website</Label>
            <Input
              id="nwebsite"
              tabIndex={-1}
              autoComplete="off"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />
          </div>
          <Button type="submit" variant="clay" className="w-full" disabled={pending}>
            {pending ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Subscribing…
              </>
            ) : (
              "Subscribe"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function WaitlistDialog({
  slug,
  classId,
  classLabel,
  onOpenChange,
  onJoined,
}: {
  slug: string;
  classId: string | null;
  classLabel?: string | undefined;
  onOpenChange: (open: boolean) => void;
  onJoined: (classId: string) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!classId) return;

    setPending(true);
    try {
      const result = await joinWaitlist({ slug, classId, name, email });
      if (result.ok) {
        toast.success("You're on the waitlist");
        onJoined(classId);
        setName("");
        setEmail("");
      } else {
        toast.error(result.error);
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={classId !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Join the waitlist</DialogTitle>
          <DialogDescription>
            We&apos;ll email you if a spot opens up{classLabel ? ` for ${classLabel}` : ""}.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={(e) => void handleSubmit(e)}>
          <div className="space-y-2">
            <Label htmlFor="wname">Full name</Label>
            <Input
              id="wname"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Sarah Johnson"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="wemail">Email</Label>
            <Input
              id="wemail"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="sarah@mail.com"
            />
          </div>
          <Button type="submit" variant="clay" className="w-full" disabled={pending}>
            {pending ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Joining…
              </>
            ) : (
              "Join waitlist"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

type PublicClassGroup =
  | { type: "single"; cls: PublicClass }
  | { type: "series"; seriesId: string; occurrences: PublicClass[] };

function groupPublicClasses(classes: PublicClass[]): PublicClassGroup[] {
  const seriesOccurrences = new Map<string, PublicClass[]>();
  const order: Array<{ type: "single"; cls: PublicClass } | { type: "series"; seriesId: string }> =
    [];

  for (const c of classes) {
    if (!c.seriesId) {
      order.push({ type: "single", cls: c });
      continue;
    }
    const existing = seriesOccurrences.get(c.seriesId);
    if (existing) {
      existing.push(c);
    } else {
      seriesOccurrences.set(c.seriesId, [c]);
      order.push({ type: "series", seriesId: c.seriesId });
    }
  }

  return order.map((entry) =>
    entry.type === "single"
      ? entry
      : {
          type: "series" as const,
          seriesId: entry.seriesId,
          // Set right before pushing to `order`, so this is always present.
          occurrences: seriesOccurrences.get(entry.seriesId)!,
        },
  );
}

export function PublicPageClient({
  instructor,
  classes,
}: {
  instructor: PublicInstructor;
  classes: PublicClass[];
}) {
  const [waitlistOpenFor, setWaitlistOpenFor] = useState<string | null>(null);
  const [joinedWaitlist, setJoinedWaitlist] = useState<Set<string>>(new Set());
  const [selectedOccurrence, setSelectedOccurrence] = useState<Record<string, string>>({});

  const groups = groupPublicClasses(classes);

  return (
    <div className="min-h-screen bg-sand/10">
      <div className="mx-auto max-w-3xl px-4 py-12 lg:px-0">
        <Reveal>
          <header className="flex flex-col gap-6 p-8 sm:flex-row items-center">
            {instructor.photoUrl ? (
              <img
                src={instructor.photoUrl}
                alt={instructor.name}
                width={600}
                height={600}
                className="size-48 rounded-full object-cover shadow-2xl"
              />
            ) : (
              <div className="grid size-40 shrink-0 place-items-center rounded-full bg-clay/12 text-2xl font-medium text-clay">
                {instructor.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </div>
            )}
            <div className="flex-1">
              <div className="flex flex-wrap items-center text-center sm:justify-start justify-center gap-3">
                <h1 className="text-3xl">{instructor.name}</h1>
              </div>
              {instructor.socials.length > 0 && (
                <div className="mt-4 flex flex-wrap items-center sm:justify-start justify-center gap-2">
                  {instructor.socials.map((s) => {
                    const Icon = socialIcons[s.platform] ?? Instagram;
                    return (
                      <a
                        key={s.platform}
                        href={socialHref(s.platform, s.handle)}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={s.platform}
                        className="grid size-9 place-items-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:text-clay"
                      >
                        <Icon className="size-4" />
                      </a>
                    );
                  })}
                </div>
              )}
              {instructor.bio && (
                <p className="mt-2 max-w-md text-muted-foreground sm:text-left text-center">
                  {instructor.bio}
                </p>
              )}
              {instructor.specialties.length > 0 && (
                <div className="mt-4 flex flex-wrap items-center sm:justify-start justify-center gap-2">
                  {instructor.specialties.map((s) => (
                    <span
                      key={s}
                      className="rounded-full bg-accent px-3 py-1 text-xs text-accent-foreground"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              )}
              <div className="mt-4 flex flex-wrap sm:justify-start justify-center gap-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <NewsletterSignupDialog slug={instructor.slug} />
                  <ShareButton instructorName={instructor.name} />
                </div>
                {/* {instructor.location && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="size-4" /> {instructor.location}
                </span>
              )} */}
                {/* <span className="inline-flex items-center gap-1.5">
                <Mail className="size-4" /> {instructor.email}
              </span> */}
                {/* {instructor.phone && (
                <span className="inline-flex items-center gap-1.5">
                  <Phone className="size-4" /> {instructor.phone}
                </span>
              )} */}
              </div>
            </div>
          </header>
        </Reveal>

        {/* {instructor.consultationLink && (
          <div className="mt-4">
            <Button
              asChild
              variant="outline"
              size="lg"
              className="surface py-6 font-bold w-full sm:w-auto"
            >
              <a href={instructor.consultationLink} target="_blank" rel="noopener noreferrer">
                <CalendarClock className="size-8" /> Book a consultation
              </a>
            </Button>
          </div>
        )} */}

        {/* {instructor.links.length > 0 && (
          <div className="mt-6 flex flex-col gap-3">
            {instructor.links.map((l) => (
              <a
                key={l.id}
                href={l.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackLinkClick(l.id)}
                className="surface block px-6 py-4 text-center font-medium transition-colors hover:bg-accent"
              >
                {l.label}
              </a>
            ))}
          </div>
        )} */}

        {/* <h2 className="mt-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
          Upcoming classes
        </h2> */}

        {classes.length === 0 ? (
          <EmptyState
            className="mt-4"
            icon={CalendarX2}
            title="No upcoming classes right now"
            body="Check back soon, or follow along on social for the next drop."
          />
        ) : (
          <div className="sm:mt-12 mt-2 space-y-4">
            {groups.map((group, i) => {
              const delay = Math.min(i, 6) * 0.08;

              if (group.type === "single") {
                return (
                  <Reveal key={group.cls.id} delay={delay}>
                    <ClassCard
                      c={group.cls}
                      slug={instructor.slug}
                      onWaitlist={joinedWaitlist.has(group.cls.id)}
                      onJoinWaitlist={() => setWaitlistOpenFor(group.cls.id)}
                    />
                  </Reveal>
                );
              }

              const selectedId = selectedOccurrence[group.seriesId] ?? group.occurrences[0]!.id;
              const selected =
                group.occurrences.find((o) => o.id === selectedId) ?? group.occurrences[0]!;

              return (
                <Reveal key={group.seriesId} delay={delay}>
                  <ClassCard
                    c={selected}
                    slug={instructor.slug}
                    onWaitlist={joinedWaitlist.has(selected.id)}
                    onJoinWaitlist={() => setWaitlistOpenFor(selected.id)}
                    dateChips={{
                      occurrences: group.occurrences,
                      selectedId: selected.id,
                      onSelect: (id) =>
                        setSelectedOccurrence((prev) => ({ ...prev, [group.seriesId]: id })),
                    }}
                  />
                </Reveal>
              );
            })}
          </div>
        )}

        <WaitlistDialog
          slug={instructor.slug}
          classId={waitlistOpenFor}
          classLabel={classes.find((c) => c.id === waitlistOpenFor)?.name}
          onOpenChange={(open) => !open && setWaitlistOpenFor(null)}
          onJoined={(id) => {
            setJoinedWaitlist((prev) => new Set(prev).add(id));
            setWaitlistOpenFor(null);
          }}
        />

        <p className="mt-12 text-center text-xs text-muted-foreground">
          Booking powered by <span className="display text-foreground">Flowboc</span>
        </p>
      </div>
    </div>
  );
}

function DateChips({
  occurrences,
  selectedId,
  onSelect,
}: {
  occurrences: PublicClass[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {occurrences.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onSelect(o.id)}
          className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
            o.id === selectedId
              ? "border-[#6355ff] bg-[#6355ff] text-white"
              : "border-border bg-card text-muted-foreground hover:border-[#6355ff]/50"
          }`}
        >
          {formatClassDate(o)}
        </button>
      ))}
    </div>
  );
}

function ClassCard({
  c,
  slug,
  onWaitlist,
  onJoinWaitlist,
  dateChips,
}: {
  c: PublicClass;
  slug: string;
  onWaitlist: boolean;
  onJoinWaitlist: () => void;
  dateChips?: { occurrences: PublicClass[]; selectedId: string; onSelect: (id: string) => void };
}) {
  const bookAction =
    c.spots > 0 ? (
      <Button
        asChild
        className="w-full sm:mt-3 sm:w-6/12 font-bold bg-[#6355ff] hover:bg-[#6355ff] text-white transition-shadow duration-300 hover:shadow-[0_0_28px_-4px_var(--clay)]"
      >
        <Link href={`/${slug}/book/${c.id}`} className="relative flex items-center gap-2 py-5">
          <span className="font-extrabold absolute left-4">Book Class</span>{" "}
          <ArrowRight className="size-4 absolute right-4" />
        </Link>
      </Button>
    ) : onWaitlist ? (
      <Button variant="quiet" className="w-full sm:mt-3 sm:w-auto" disabled>
        <Check className="size-4" /> On waitlist
      </Button>
    ) : (
      <Button variant="quiet" className="w-full sm:mt-3 sm:w-6/12" onClick={onJoinWaitlist}>
        Join waitlist
      </Button>
    );

  return (
    <article className="surface overflow-hidden p-4 sm:flex sm:p-0">
      {/* Mobile: compact card — square cover beside title, price row, full-width CTA. */}
      <div className="sm:hidden">
        <div className="flex gap-3">
          {c.coverUrl ? (
            <img
              src={c.coverUrl}
              alt={c.name}
              loading="lazy"
              width={200}
              height={200}
              className="size-20 shrink-0 rounded-sm object-cover"
            />
          ) : (
            <div className="size-20 shrink-0 rounded-sm bg-sand" />
          )}
          <div className="min-w-0">
            <h3 className="text-lg leading-tight">{c.name}</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {c.recurringLabel ? `${c.recurringLabel} · ` : ""}
              {formatClassDate(c)} · {formatClassTime(c)} {timezoneLabel(c.timezone)}
            </p>
            {c.description && (
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{c.description}</p>
            )}
          </div>
        </div>
        {dateChips && (
          <DateChips
            occurrences={dateChips.occurrences}
            selectedId={dateChips.selectedId}
            onSelect={dateChips.onSelect}
          />
        )}
        <div className="mt-3 flex items-center justify-between gap-3">
          <PriceTag price={c.price} originalPrice={c.originalPrice ?? undefined} />
          <span className="shrink-0 text-xs">
            {c.spots > 0 ? (
              <span className="text-[#6355ff]">{c.spots} spots left</span>
            ) : (
              <span className="text-clay">Full</span>
            )}
          </span>
        </div>
        <div className="mt-3">{bookAction}</div>
      </div>

      {/* Desktop: original side-by-side layout. */}
      <div className="hidden sm:contents">
        {c.coverUrl ? (
          <img
            src={c.coverUrl}
            alt={c.name}
            loading="lazy"
            width={1200}
            height={800}
            className="h-auto w-48 object-cover"
          />
        ) : (
          <div className="h-auto w-48 bg-sand" />
        )}
        <div className="flex flex-1 flex-col justify-between gap-4 p-6">
          <div>
            <h3 className="text-xl">{c.name}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {c.recurringLabel ? `${c.recurringLabel} · ` : ""}
              {formatClassDate(c)} · {formatClassTime(c)} {timezoneLabel(c.timezone)} ·{" "}
              {c.durationMinutes} min · {c.mode === "ONLINE" ? "Online" : "In-person"}
            </p>
            {dateChips && (
              <DateChips
                occurrences={dateChips.occurrences}
                selectedId={dateChips.selectedId}
                onSelect={dateChips.onSelect}
              />
            )}
            {c.description && (
              <p className="mt-2 max-w-sm text-sm text-muted-foreground">{c.description}</p>
            )}
            <p className="mt-3 text-sm">
              {c.spots > 0 ? (
                <span className="text-success">{c.spots} spots available</span>
              ) : (
                <span className="text-clay">Class full</span>
              )}
            </p>
          </div>
          <div className="flex items-center justify-between pt-4">
            <PriceTag price={c.price} originalPrice={c.originalPrice ?? undefined} />
            {bookAction}
          </div>
        </div>
      </div>
    </article>
  );
}
