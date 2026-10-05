"use client";

import { useState, type CSSProperties } from "react";
import { Instagram, Share2, Check, CalendarX2, Loader2, Send, Video } from "lucide-react";
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
import { Reveal } from "@/components/landing/primitives";
import { cn } from "@/lib/utils";
import { money } from "@/lib/demo";
import { toast } from "sonner";
import {
  socialIcons,
  socialHref,
  groupPublicClasses,
  classCardByLayout,
  layoutListClassName,
  type PublicInstructor,
  type PublicClass,
} from "@/lib/public-page-layout";
import { bookVideoCall, joinWaitlist, subscribeToNewsletter } from "./actions";

export type { PublicInstructor, PublicClass };

function trackLinkClick(linkId: string) {
  navigator.sendBeacon?.("/api/links/click", JSON.stringify({ linkId }));
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

function BookCallDialog({
  open,
  onOpenChange,
  slug,
  offerTitle,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slug: string;
  offerTitle: string;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState(""); // honeypot, kept off-screen
  const [pending, setPending] = useState(false);
  const [meetingLink, setMeetingLink] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    try {
      const result = await bookVideoCall({ slug, name, email, website });
      if (result.ok) {
        if ("meetingLink" in result) setMeetingLink(result.meetingLink);
        toast.success("You're booked!");
      } else {
        toast.error(result.error);
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) {
          setName("");
          setEmail("");
          setMeetingLink(null);
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        {meetingLink ? (
          <>
            <DialogHeader>
              <DialogTitle>You&apos;re booked</DialogTitle>
              <DialogDescription>
                We&apos;ve also sent this to your email — {offerTitle}.
              </DialogDescription>
            </DialogHeader>
            <Button asChild variant="clay" className="w-full">
              <a href={meetingLink} target="_blank" rel="noopener noreferrer">
                Join the call
              </a>
            </Button>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Find a time</DialogTitle>
              <DialogDescription>
                We&apos;ll email you the meeting link for &quot;{offerTitle}&quot; right away.
              </DialogDescription>
            </DialogHeader>
            <form className="space-y-4" onSubmit={(e) => void handleSubmit(e)}>
              <div className="space-y-2">
                <Label htmlFor="vcname">Full name</Label>
                <Input
                  id="vcname"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Sarah Johnson"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vcemail">Email</Label>
                <Input
                  id="vcemail"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="sarah@mail.com"
                />
              </div>
              <div className="sr-only" aria-hidden="true">
                <Label htmlFor="vcwebsite">Website</Label>
                <Input
                  id="vcwebsite"
                  tabIndex={-1}
                  autoComplete="off"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                />
              </div>
              <Button type="submit" variant="clay" className="w-full" disabled={pending}>
                {pending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Booking…
                  </>
                ) : (
                  "Confirm"
                )}
              </Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function VideoCallCard({ instructor }: { instructor: PublicInstructor }) {
  const [open, setOpen] = useState(false);

  if (!instructor.videoCallEnabled || !instructor.consultationLink) return null;

  const title = instructor.videoCallTitle || "Book a Video Call with Me";
  const isPaid = (instructor.videoCallPrice ?? 0) > 0;

  return (
    <Reveal>
      <article className="surface mb-6 flex items-center gap-4 p-4 sm:p-5">
        {instructor.videoCallImageUrl ? (
          <img
            src={instructor.videoCallImageUrl}
            alt=""
            className="size-16 shrink-0 rounded-xl object-cover sm:size-20"
          />
        ) : (
          <div className="grid size-16 shrink-0 place-items-center rounded-xl bg-(--theme)/12 text-(--theme) sm:size-20">
            <Video className="size-6" />
          </div>
        )}
        <div className="min-w-0 flex-1 space-y-2">
          <h2 className="text-base font-medium sm:text-lg">{title}</h2>
          {instructor.videoCallDescription && (
            <p className="mt-0.5 text-sm text-muted-foreground">
              {instructor.videoCallDescription}
            </p>
          )}
          <p className="mt-1 text-sm font-semibold" style={{ color: "var(--theme)" }}>
            {isPaid ? money(instructor.videoCallPrice!, instructor.currency) : "FREE"}
          </p>
          {isPaid ? (
            <Button variant="quiet" size="sm" disabled className="shrink-0">
              Coming soon
            </Button>
          ) : (
            <Button
              size="sm"
              className="rounded-sm shrink-0 bg-(--theme) text-white hover:bg-(--theme) w-full sm:w-auto sm:px-6"
              onClick={() => setOpen(true)}
            >
              FIND A TIME
            </Button>
          )}
        </div>
      </article>
      <BookCallDialog
        open={open}
        onOpenChange={setOpen}
        slug={instructor.slug}
        offerTitle={title}
      />
    </Reveal>
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
  const ClassCard = classCardByLayout[instructor.pageLayout];
  // A photo background can be any brightness, so the header (sitting
  // directly over it, outside the cards' own bg-card surfaces) switches to
  // white text + a shadow for guaranteed contrast, same treatment as
  // captions over a photo anywhere else.
  const hasBg = Boolean(instructor.backgroundImageUrl);

  return (
    <div
      className="min-h-screen bg-sand/10 bg-cover bg-center bg-fixed"
      style={
        {
          "--theme": instructor.themeColor,
          ...(instructor.backgroundImageUrl
            ? { backgroundImage: `url(${instructor.backgroundImageUrl})` }
            : {}),
        } as CSSProperties
      }
    >
      <div
        className={
          instructor.backgroundImageUrl
            ? "min-h-screen bg-background/40 backdrop-blur-[1px]"
            : undefined
        }
      >
        <div className="mx-auto max-w-3xl px-4 py-12 lg:px-0">
          <Reveal>
            <header className="flex flex-col gap-6 p-8 sm:flex-row items-center">
              {instructor.photoUrl ? (
                <img
                  src={instructor.photoUrl}
                  alt={instructor.name}
                  width={600}
                  height={600}
                  className={cn(
                    "size-48 rounded-full object-cover shadow-2xl",
                    hasBg && "ring-4 ring-white/80",
                  )}
                />
              ) : (
                <div
                  className={cn(
                    "grid size-40 shrink-0 place-items-center rounded-full bg-clay/12 text-2xl font-medium text-clay",
                    hasBg && "ring-4 ring-white/80",
                  )}
                >
                  {instructor.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </div>
              )}
              <div className="flex-1">
                <div className="flex flex-wrap items-center text-center sm:justify-start justify-center gap-3">
                  <h1 className={cn("text-3xl", hasBg && "text-white drop-shadow-sm")}>
                    {instructor.name}
                  </h1>
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
                          className={cn(
                            "grid size-9 place-items-center rounded-full bg-white text-muted-foreground transition-colors hover:text-clay",
                            hasBg ? "shadow-sm" : "border border-border",
                          )}
                        >
                          <Icon className="size-4" />
                        </a>
                      );
                    })}
                  </div>
                )}
                {instructor.bio && (
                  <p
                    className={cn(
                      "mt-2 max-w-md sm:text-left text-center",
                      hasBg ? "text-white/85 drop-shadow-sm" : "text-muted-foreground",
                    )}
                  >
                    {instructor.bio}
                  </p>
                )}
                {instructor.specialties.length > 0 && (
                  <div className="mt-4 flex flex-wrap items-center sm:justify-start justify-center gap-2">
                    {instructor.specialties.map((s) => (
                      <span
                        key={s}
                        className={cn(
                          "rounded-full px-3 py-1 text-xs",
                          hasBg
                            ? "bg-white/90 text-foreground shadow-sm"
                            : "bg-accent text-accent-foreground",
                        )}
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                )}
                <div
                  className={cn(
                    "mt-4 flex flex-wrap sm:justify-start justify-center gap-2 text-sm",
                    hasBg ? "text-white/85 drop-shadow-sm" : "text-muted-foreground",
                  )}
                >
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

          <div className="mt-6">
            <VideoCallCard instructor={instructor} />
          </div>

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
            <div className={`sm:mt-12 mt-2 ${layoutListClassName[instructor.pageLayout]}`}>
              {groups.map((group, i) => {
                const delay = Math.min(i, 6) * 0.08;

                if (group.type === "single") {
                  return (
                    <Reveal key={group.cls.id} delay={delay}>
                      <ClassCard
                        c={group.cls}
                        slug={instructor.slug}
                        currency={instructor.currency}
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
                      currency={instructor.currency}
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
    </div>
  );
}
