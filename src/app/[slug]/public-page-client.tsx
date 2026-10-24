"use client";

import { useEffect, useState, type CSSProperties } from "react";
import {
  Instagram,
  Share2,
  Check,
  CalendarX2,
  Loader2,
  Send,
  Video,
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
import { Reveal } from "@/components/landing/primitives";
import { cn } from "@/lib/utils";
import { money, type CurrencyCode } from "@/lib/demo";
import { useIsBrightImage } from "@/lib/use-image-brightness";
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
import {
  bookVideoCall,
  joinWaitlist,
  subscribeToNewsletter,
  verifyVideoCallPayment,
} from "./actions";

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
        <Button variant="quiet" size="sm" className="flex items-center gap-2 rounded-md">
          <Send className="size-4" /> Join my newsletter
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

type VideoCallVerifyState =
  | { status: "idle" }
  | { status: "confirming" }
  | { status: "done"; meetingLink: string }
  | { status: "error"; message: string };

function BookCallDialog({
  open,
  onOpenChange,
  slug,
  offerTitle,
  price,
  currency,
  verifyState,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slug: string;
  offerTitle: string;
  price: number;
  currency: CurrencyCode;
  verifyState: VideoCallVerifyState;
}) {
  const isPaid = price > 0;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState(""); // honeypot, kept off-screen
  const [pending, setPending] = useState(false);
  // From a fresh (same-session, free) booking — separate from verifyState's
  // "done" meetingLink, which comes from the parent confirming a payment
  // the student returned from Paystack for.
  const [bookedMeetingLink, setBookedMeetingLink] = useState<string | null>(null);

  const confirming = verifyState.status === "confirming";
  const meetingLink = verifyState.status === "done" ? verifyState.meetingLink : bookedMeetingLink;
  const confirmError = verifyState.status === "error" ? verifyState.message : null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    try {
      const result = await bookVideoCall({ slug, name, email, website });
      if (result.ok) {
        if ("authorizationUrl" in result) {
          window.location.href = result.authorizationUrl;
          return; // leaving the page — keep the pending spinner showing
        }
        if ("meetingLink" in result) {
          setBookedMeetingLink(result.meetingLink);
          toast.success("You're booked!");
        }
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
          setBookedMeetingLink(null);
        }
      }}
    >
      <DialogContent className="sm:max-w-md">
        {confirming ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Confirming your payment…</p>
          </div>
        ) : meetingLink ? (
          <>
            <DialogHeader>
              <DialogTitle>You&apos;re booked</DialogTitle>
              <DialogDescription>
                We&apos;ve emailed you the details for &quot;{offerTitle}&quot;.
              </DialogDescription>
            </DialogHeader>
            <Button asChild variant="clay" className="w-full">
              <a href={meetingLink} target="_blank" rel="noopener noreferrer">
                Pick a time
              </a>
            </Button>
          </>
        ) : confirmError ? (
          <>
            <DialogHeader>
              <DialogTitle>Payment not confirmed</DialogTitle>
              <DialogDescription>{confirmError}</DialogDescription>
            </DialogHeader>
            <Button variant="quiet" className="w-full" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Find a time</DialogTitle>
              <DialogDescription>
                {isPaid
                  ? `We'll email you a link to pick a time for "${offerTitle}" as soon as your payment of ${money(price, currency)} goes through.`
                  : `We'll email you a link to pick a time for "${offerTitle}" right away.`}
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
                    <Loader2 className="size-4 animate-spin" />
                    {isPaid ? "Redirecting…" : "Booking…"}
                  </>
                ) : isPaid ? (
                  `Continue to payment — ${money(price, currency)}`
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
  const [verifyState, setVerifyState] = useState<VideoCallVerifyState>({ status: "idle" });

  // Paystack appends ?reference= to the callback URL on a completed
  // checkout — auto-reopen the dialog and verify the payment, rather than
  // leaving the student back on the page with no feedback. Owned entirely
  // here (read URL + call verifyVideoCallPayment + hold the result) so
  // there's a single effect doing it, not split across this component and
  // the dialog — that split previously raced: the dialog's own mount-effect
  // ran before this effect had set the reference, so the verify call never
  // actually fired.
  useEffect(() => {
    const reference = new URLSearchParams(window.location.search).get("reference");
    if (!reference) return;
    setOpen(true);
    setVerifyState({ status: "confirming" });
    void verifyVideoCallPayment(reference).then((result) => {
      setVerifyState(
        result.ok
          ? { status: "done", meetingLink: result.meetingLink }
          : { status: "error", message: result.error },
      );
    });
    // Only ever check once, on mount.
  }, []);

  if (!instructor.videoCallEnabled || !instructor.consultationLink) return null;

  const title = instructor.videoCallTitle || "Book a Video Call with Me";
  const price = instructor.videoCallPrice ?? 0;
  const isPaid = price > 0;
  const canBook = !isPaid || instructor.payoutConnected;

  return (
    <Reveal>
      <article className="surface mb-6 items-center gap-4 p-4 sm:p-5">
        {instructor.videoCallImageUrl ? (
          <div className="w-full flex gap-x-4 mb-2">
            <img
              src={instructor.videoCallImageUrl}
              alt=""
              className="size-18 shrink-0 rounded-lg object-cover sm:size-20"
            />
            <div>
              <h2 className="text-sm font-medium sm:text-lg uppercase">{title}</h2>
              {instructor.videoCallDescription && (
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {instructor.videoCallDescription}
                </p>
              )}
              <p className="mt-1 text-lg font-semibold" style={{ color: "var(--theme)" }}>
                {isPaid ? money(price, instructor.currency) : "FREE"}
              </p>
            </div>
          </div>
        ) : (
          <div className="min-w-0 flex gap-x-4 mb-2">
            <div className="grid size-16 shrink-0 place-items-center rounded-xl bg-(--theme)/12 text-(--theme) sm:size-20">
              <Video className="size-6" />
            </div>
            <div>
              <h2 className="text-base font-medium sm:text-lg uppercase">{title}</h2>
              {instructor.videoCallDescription && (
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {instructor.videoCallDescription}
                </p>
              )}
              <p className="mt-1 text-base font-semibold" style={{ color: "var(--theme)" }}>
                {isPaid ? money(price, instructor.currency) : "FREE"}
              </p>
            </div>
          </div>
        )}

        <div className="mt-4">
          <div className="w-full flex items-end justify-end space-y-2">
            {canBook ? (
              <Button
                // size="sm"
                className="relative flex items-center gap-2 py-5 rounded-sm shrink-0 bg-(--theme) text-white hover:bg-(--theme) w-full sm:px-20 px-10"
                onClick={() => {
                  // A fresh manual click shouldn't inherit a stale
                  // confirming/error/done state left over from an earlier
                  // ?reference= check.
                  setVerifyState({ status: "idle" });
                  setOpen(true);
                }}
              >
                <span className="font-extrabold absolute left-4">FIND A TIME</span>{" "}
                <ArrowRight className="size-4 absolute right-4" />
              </Button>
            ) : (
              <Button variant="quiet" size="sm" disabled className="shrink-0">
                Coming soon
              </Button>
            )}
          </div>
        </div>
      </article>
      <BookCallDialog
        open={open}
        onOpenChange={setOpen}
        slug={instructor.slug}
        offerTitle={title}
        price={price}
        currency={instructor.currency}
        verifyState={verifyState}
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
  // captions over a photo anywhere else — unless the photo itself is light,
  // in which case white text disappears, so it falls back to dark text.
  const hasBg = Boolean(instructor.backgroundImageUrl);
  const bgIsBright = useIsBrightImage(instructor.backgroundImageUrl);
  // Over a background image, pick white or black outright based on measured
  // brightness (no soft "muted" shades) and bump the weight to font-medium —
  // the extra contrast and heft are what keep the header legible over an
  // arbitrary photo.
  const heroTextClass = hasBg
    ? bgIsBright
      ? "text-black font-medium"
      : "text-white font-medium drop-shadow-sm"
    : undefined;
  const heroSecondaryTextClass = hasBg
    ? bgIsBright
      ? "text-black/80 font-medium"
      : "text-white/85 font-medium drop-shadow-sm"
    : "text-muted-foreground";

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
          instructor.backgroundImageUrl ? "min-h-screen bg-black/20 backdrop-blur-[4px]" : undefined
        }
      >
        <div className="mx-auto max-w-3xl px-4 pt-14 pb-6 lg:px-0">
          <Reveal>
            <header className="flex flex-col gap-4 px-2 sm:flex-row items-center">
              {instructor.photoUrl ? (
                <img
                  src={instructor.photoUrl}
                  alt={instructor.name}
                  width={600}
                  height={600}
                  className={cn(
                    "sm:size-48 size-38 rounded-full object-cover shadow-2xl",
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
                  <h1 className={cn("sm:text-3xl text-2xl", heroTextClass)}>{instructor.name}</h1>
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
                      "mt-2 max-w-md sm:text-left text-center smtext-base text-sm leading-relaxed",
                      heroSecondaryTextClass,
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
                    heroSecondaryTextClass,
                  )}
                >
                  <div className="flex items-center gap-2">
                    <NewsletterSignupDialog slug={instructor.slug} />
                    {/* <ShareButton instructorName={instructor.name} /> */}
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

          <div className="mt-2">
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

          <p className="mt-4 text-center text-xs text-muted-foreground">
            Booking powered by <span className="display text-foreground">Flowboc</span>
          </p>
        </div>
      </div>
    </div>
  );
}
