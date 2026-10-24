import Link from "next/link";
import {
  Instagram,
  Music2,
  Youtube,
  Facebook,
  Twitter,
  MessageCircle,
  Linkedin,
  Check,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PriceTag } from "@/components/PriceTag";
import { timezoneLabel, type CurrencyCode, type SocialPlatform } from "@/lib/demo";
import { formatClassDate, formatClassTime } from "@/lib/format-class-time";

export type PageLayout = "CLASSIC" | "COMPACT" | "COVER_GRID";

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
  currency: CurrencyCode;
  themeColor: string;
  backgroundImageUrl: string | null;
  pageLayout: PageLayout;
  videoCallEnabled: boolean;
  videoCallTitle: string | null;
  videoCallDescription: string | null;
  videoCallImageUrl: string | null;
  videoCallPrice: number | null;
  // Whether this instructor can actually receive a Paystack charge — a
  // priced video call stays "Coming soon" on the public page until this is
  // true, rather than letting a student fill out the form and hit a dead end.
  payoutConnected: boolean;
  socials: { platform: string; handle: string }[];
  links: { id: string; label: string; url: string }[];
};

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

export const socialIcons: Record<string, typeof Instagram> = {
  instagram: Instagram,
  tiktok: Music2,
  youtube: Youtube,
  facebook: Facebook,
  twitter: Twitter,
  whatsapp: MessageCircle,
  linkedin: Linkedin,
};

export function socialHref(platform: string, handle: string) {
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

export type PublicClassGroup =
  | { type: "single"; cls: PublicClass }
  | { type: "series"; seriesId: string; occurrences: PublicClass[] };

export function groupPublicClasses(classes: PublicClass[]): PublicClassGroup[] {
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

export function DateChips({
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
              ? "border-(--theme) bg-(--theme) text-white"
              : "border-border bg-card text-muted-foreground hover:border-(--theme)/50"
          }`}
        >
          {formatClassDate(o)}
        </button>
      ))}
    </div>
  );
}

function BookAction({
  c,
  slug,
  onWaitlist,
  onJoinWaitlist,
}: {
  c: PublicClass;
  slug: string;
  onWaitlist: boolean;
  onJoinWaitlist: () => void;
}) {
  if (c.spots > 0) {
    return (
      <Button
        asChild
        className="w-full sm:mt-3 sm:w-6/12 font-bold bg-(--theme) hover:bg-(--theme) text-white transition-shadow duration-300 hover:shadow-[0_0_28px_-4px_var(--theme)]"
      >
        <Link href={`/${slug}/book/${c.id}`} className="relative flex items-center gap-2 py-5">
          <span className="font-extrabold absolute left-4">SAVE MY SEAT</span>{" "}
          <ArrowRight className="size-4 absolute right-4" />
        </Link>
      </Button>
    );
  }
  if (onWaitlist) {
    return (
      <Button variant="quiet" className="w-full sm:mt-3 sm:w-auto" disabled>
        <Check className="size-4" /> On waitlist
      </Button>
    );
  }
  return (
    <Button variant="quiet" className="w-full sm:mt-3 sm:w-6/12" onClick={onJoinWaitlist}>
      Join waitlist
    </Button>
  );
}

export type ClassCardProps = {
  c: PublicClass;
  slug: string;
  currency: CurrencyCode;
  onWaitlist: boolean;
  onJoinWaitlist: () => void;
  dateChips?: { occurrences: PublicClass[]; selectedId: string; onSelect: (id: string) => void };
};

/** CLASSIC layout — photo beside details on desktop, compact stacked card on mobile. */
export function ClassCardClassic({
  c,
  slug,
  currency,
  onWaitlist,
  onJoinWaitlist,
  dateChips,
}: ClassCardProps) {
  return (
    <article className="surface overflow-hidden p-4 sm:flex sm:p-0">
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
          <PriceTag
            price={c.price}
            originalPrice={c.originalPrice ?? undefined}
            currency={currency}
          />
          <span className="shrink-0 text-xs">
            {c.spots > 0 ? (
              <span className="text-(--theme)">{c.spots} spots left</span>
            ) : (
              <span className="text-clay">Full</span>
            )}
          </span>
        </div>
        <div className="mt-3">
          <BookAction c={c} slug={slug} onWaitlist={onWaitlist} onJoinWaitlist={onJoinWaitlist} />
        </div>
      </div>

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
            <PriceTag
              price={c.price}
              originalPrice={c.originalPrice ?? undefined}
              currency={currency}
            />
            <BookAction c={c} slug={slug} onWaitlist={onWaitlist} onJoinWaitlist={onJoinWaitlist} />
          </div>
        </div>
      </div>
    </article>
  );
}

/** COMPACT layout — dense single-line rows, no images. */
export function ClassCardCompact({
  c,
  slug,
  currency,
  onWaitlist,
  onJoinWaitlist,
  dateChips,
}: ClassCardProps) {
  return (
    <article className="surface flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="truncate text-base font-medium">{c.name}</h3>
          <span className="shrink-0 text-xs">
            {c.spots > 0 ? (
              <span className="text-(--theme)">{c.spots} left</span>
            ) : (
              <span className="text-clay">Full</span>
            )}
          </span>
        </div>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {c.recurringLabel ? `${c.recurringLabel} · ` : ""}
          {formatClassDate(c)} · {formatClassTime(c)} {timezoneLabel(c.timezone)}
        </p>
        {dateChips && (
          <DateChips
            occurrences={dateChips.occurrences}
            selectedId={dateChips.selectedId}
            onSelect={dateChips.onSelect}
          />
        )}
      </div>
      <div className="flex shrink-0 items-center gap-4">
        <PriceTag
          price={c.price}
          originalPrice={c.originalPrice ?? undefined}
          currency={currency}
          priceClassName="display text-lg"
        />
        <BookAction c={c} slug={slug} onWaitlist={onWaitlist} onJoinWaitlist={onJoinWaitlist} />
      </div>
    </article>
  );
}

/** COVER_GRID layout — large top-aligned cover image, grid of photo-forward cards. */
export function ClassCardCoverGrid({
  c,
  slug,
  currency,
  onWaitlist,
  onJoinWaitlist,
  dateChips,
}: ClassCardProps) {
  return (
    <article className="surface flex h-full flex-col overflow-hidden">
      {c.coverUrl ? (
        <img
          src={c.coverUrl}
          alt={c.name}
          loading="lazy"
          width={800}
          height={600}
          className="aspect-4/3 w-full object-cover"
        />
      ) : (
        <div className="aspect-4/3 w-full bg-sand" />
      )}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="text-lg leading-tight">{c.name}</h3>
        <p className="text-xs text-muted-foreground">
          {c.recurringLabel ? `${c.recurringLabel} · ` : ""}
          {formatClassDate(c)} · {formatClassTime(c)} {timezoneLabel(c.timezone)}
        </p>
        {dateChips && (
          <DateChips
            occurrences={dateChips.occurrences}
            selectedId={dateChips.selectedId}
            onSelect={dateChips.onSelect}
          />
        )}
        <div className="mt-auto flex items-center justify-between gap-2 pt-3">
          <PriceTag
            price={c.price}
            originalPrice={c.originalPrice ?? undefined}
            currency={currency}
          />
          <span className="shrink-0 text-xs">
            {c.spots > 0 ? (
              <span className="text-(--theme)">{c.spots} left</span>
            ) : (
              <span className="text-clay">Full</span>
            )}
          </span>
        </div>
        <BookAction c={c} slug={slug} onWaitlist={onWaitlist} onJoinWaitlist={onJoinWaitlist} />
      </div>
    </article>
  );
}

export const classCardByLayout: Record<PageLayout, (props: ClassCardProps) => React.JSX.Element> = {
  CLASSIC: ClassCardClassic,
  COMPACT: ClassCardCompact,
  COVER_GRID: ClassCardCoverGrid,
};

export const layoutListClassName: Record<PageLayout, string> = {
  CLASSIC: "space-y-4",
  COMPACT: "space-y-3",
  COVER_GRID: "grid gap-4 sm:grid-cols-2",
};
