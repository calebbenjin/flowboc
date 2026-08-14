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
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/EmptyState";
import { PriceTag } from "@/components/PriceTag";
import { toast } from "sonner";
import { timezoneLabel, type SocialPlatform } from "@/lib/demo";
import { formatClassDate, formatClassTime } from "@/lib/format-class-time";
import { joinWaitlist } from "./actions";

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
};

export type PublicClass = {
  id: string;
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

export function PublicPageClient({
  instructor,
  classes,
}: {
  instructor: PublicInstructor;
  classes: PublicClass[];
}) {
  const [waitlistOpenFor, setWaitlistOpenFor] = useState<string | null>(null);
  const [joinedWaitlist, setJoinedWaitlist] = useState<Set<string>>(new Set());

  return (
    <div className="min-h-screen bg-sand/50">
      <div className="mx-auto max-w-3xl px-4 py-12 lg:px-0">
        <header className="surface flex flex-col items-start gap-6 p-8 sm:flex-row sm:items-center">
          {instructor.photoUrl ? (
            <img
              src={instructor.photoUrl}
              alt={instructor.name}
              width={800}
              height={800}
              className="size-24 rounded-full object-cover"
            />
          ) : (
            <div className="grid size-24 shrink-0 place-items-center rounded-full bg-clay/12 text-2xl font-medium text-clay">
              {instructor.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </div>
          )}
          <div className="flex-1">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <h1 className="text-3xl">{instructor.name}</h1>
              <ShareButton instructorName={instructor.name} />
            </div>
            {instructor.bio && (
              <p className="mt-2 max-w-md text-muted-foreground">{instructor.bio}</p>
            )}
            <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
              {instructor.location && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="size-4" /> {instructor.location}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5">
                <Mail className="size-4" /> {instructor.email}
              </span>
              {instructor.phone && (
                <span className="inline-flex items-center gap-1.5">
                  <Phone className="size-4" /> {instructor.phone}
                </span>
              )}
            </div>
            {instructor.socials.length > 0 && (
              <div className="mt-4 flex flex-wrap items-center gap-2">
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
            {instructor.specialties.length > 0 && (
              <div className="mt-4 flex flex-wrap items-center gap-2">
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
            {instructor.consultationLink && (
              <div className="mt-4">
                <Button asChild variant="quiet" size="sm">
                  <a href={instructor.consultationLink} target="_blank" rel="noopener noreferrer">
                    <CalendarClock className="size-4" /> Book a consultation
                  </a>
                </Button>
              </div>
            )}
          </div>
        </header>

        <h2 className="mt-12 text-xs uppercase tracking-[0.18em] text-muted-foreground">
          Upcoming classes
        </h2>

        {classes.length === 0 ? (
          <EmptyState
            className="mt-4"
            icon={CalendarX2}
            title="No upcoming classes right now"
            body="Check back soon, or follow along on social for the next drop."
          />
        ) : (
          <div className="mt-4 space-y-4">
            {classes.map((c) => {
              const onWaitlist = joinedWaitlist.has(c.id);
              return (
                <article key={c.id} className="surface overflow-hidden sm:flex">
                  {c.coverUrl ? (
                    <img
                      src={c.coverUrl}
                      alt={c.name}
                      loading="lazy"
                      width={1200}
                      height={800}
                      className="h-40 w-full object-cover sm:h-auto sm:w-48"
                    />
                  ) : (
                    <div className="h-40 w-full bg-sand sm:h-auto sm:w-48" />
                  )}
                  <div className="flex flex-1 flex-col justify-between gap-4 p-6 sm:flex-row sm:items-center">
                    <div>
                      <h3 className="text-xl">{c.name}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {formatClassDate(c)} · {formatClassTime(c)} {timezoneLabel(c.timezone)} ·{" "}
                        {c.durationMinutes} min · {c.mode === "ONLINE" ? "Online" : "In-person"}
                      </p>
                      {c.description && (
                        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                          {c.description}
                        </p>
                      )}
                      <p className="mt-3 text-sm">
                        {c.spots > 0 ? (
                          <span className="text-success">{c.spots} spots available</span>
                        ) : (
                          <span className="text-clay">Class full</span>
                        )}
                      </p>
                    </div>
                    <div className="text-right">
                      <PriceTag
                        price={c.price}
                        originalPrice={c.originalPrice ?? undefined}
                        stacked
                      />
                      {c.spots > 0 ? (
                        <Button asChild variant="clay" className="mt-3">
                          <Link href={`/${instructor.slug}/book/${c.id}`}>Book class</Link>
                        </Button>
                      ) : onWaitlist ? (
                        <Button variant="quiet" className="mt-3" disabled>
                          <Check className="size-4" /> On waitlist
                        </Button>
                      ) : (
                        <Button
                          variant="quiet"
                          className="mt-3"
                          onClick={() => setWaitlistOpenFor(c.id)}
                        >
                          Join waitlist
                        </Button>
                      )}
                    </div>
                  </div>
                </article>
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
          Booking powered by <span className="display text-foreground">Flowbuk</span>
        </p>
      </div>
    </div>
  );
}
