import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarDays, Leaf, Video, BookOpen, Check } from "lucide-react";
import { PriceTag } from "@/components/PriceTag";
import {
  DateChips,
  socialIcons,
  socialHref,
  type PublicInstructor,
  type ClassCardProps,
} from "@/lib/public-page-layout";
import { formatClassDate, formatClassTime } from "@/lib/format-class-time";
import { SAGE_COVER } from "@/lib/public-page-theme";
import { timezoneLabel, type CurrencyCode } from "@/lib/demo";

export function SageSocialLinks({
  socials,
  compact = false,
  preview = false,
}: {
  socials: { platform: string; handle: string }[];
  compact?: boolean;
  preview?: boolean;
}) {
  return (
    <div className={compact ? "mt-3 flex flex-wrap justify-center gap-3" : "sage-socials"}>
      {socials
        .filter((social) => social.handle.trim())
        .map((social) => {
          const platform = social.platform.toLowerCase();
          const Icon = socialIcons[platform];
          if (!Icon) return null;
          return preview ? (
            <span key={platform} role="img" aria-label={platform}>
              <Icon className="size-3.5" aria-hidden="true" />
            </span>
          ) : (
            <a
              key={platform}
              href={socialHref(platform, social.handle)}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={platform}
            >
              <Icon className="size-5" aria-hidden="true" />
            </a>
          );
        })}
    </div>
  );
}

export function SageProfileHeader({
  instructor,
}: {
  instructor: Pick<PublicInstructor, "name" | "photoUrl" | "bio" | "coverImageUrl" | "socials">;
}) {
  const cover = instructor.coverImageUrl || SAGE_COVER;
  return (
    <>
      <div className="sage-banner" aria-hidden="true">
        <Image
          src={cover}
          alt=""
          width={2172}
          height={724}
          priority
          sizes="100vw"
          className="h-full w-full object-cover"
        />
      </div>
      <header className="sage-profile">
        {instructor.photoUrl ? (
          <Image
            src={instructor.photoUrl}
            alt={instructor.name}
            width={120}
            height={144}
            priority
            sizes="120px"
            className="sage-portrait"
          />
        ) : (
          <div className="sage-portrait sage-initials">
            {instructor.name
              .split(" ")
              .map((part) => part[0])
              .slice(0, 2)
              .join("")}
          </div>
        )}
        <h1>{instructor.name}</h1>
        {instructor.bio ? <p className="sage-bio">{instructor.bio}</p> : null}
        <SageSocialLinks socials={instructor.socials} />
      </header>
    </>
  );
}

export function SageClassCard({
  c,
  slug,
  currency,
  onWaitlist,
  onJoinWaitlist,
  dateChips,
}: ClassCardProps) {
  const words = c.description?.trim().split(/\s+/) ?? [];
  const descriptionPreview = words.slice(0, 8).join(" ") + (words.length > 8 ? "…" : "");
  return (
    <article className="sage-class-card">
      {c.coverUrl ? (
        <Image
          src={c.coverUrl}
          alt={c.name}
          width={640}
          height={480}
          sizes="(min-width: 768px) 320px, 44vw"
          className="sage-class-photo"
        />
      ) : (
        <div className="sage-class-photo sage-image-placeholder">
          <Leaf className="size-10" aria-hidden="true" />
        </div>
      )}
      <div className="sage-class-copy">
        <p className="sage-eyebrow">{c.mode === "ONLINE" ? "Online class" : "Group class"}</p>
        <h2>{c.name}</h2>
        <p className="sage-class-time">
          <CalendarDays className="size-4 shrink-0" aria-hidden="true" />
          <span>
            {formatClassDate(c)} · {formatClassTime(c)}{" "}
            <span className="text-xs">{timezoneLabel(c.timezone)}</span>
          </span>
        </p>
        <p className="text-xs text-muted-foreground">
          {c.mode === "ONLINE" ? "Online" : "In studio"} · {c.durationMinutes} min
          {c.recurringLabel ? ` · ${c.recurringLabel}` : ""}
        </p>
        {descriptionPreview ? (
          <p className="break-words text-sm leading-snug text-muted-foreground">
            {descriptionPreview}
          </p>
        ) : null}
        {dateChips ? <DateChips {...dateChips} /> : null}
        <PriceTag
          price={c.price}
          originalPrice={c.originalPrice ?? undefined}
          currency={currency}
          priceClassName="text-xl font-bold"
        />
        <p className="text-xs text-clay">
          {c.spots > 0 ? `${c.spots} ${c.spots === 1 ? "spot" : "spots"} left` : "Class full"}
        </p>
        {c.spots > 0 ? (
          <Link href={`/${slug}/book/${c.id}`} className="sage-book-button uppercase text-sm">
            Book your seat <ArrowRight className="size-4" />
          </Link>
        ) : (
          <button
            type="button"
            className="sage-book-button uppercase text-sm"
            disabled={onWaitlist}
            onClick={onJoinWaitlist}
          >
            {onWaitlist ? (
              <>
                <Check className="size-4" /> On waitlist
              </>
            ) : (
              <>
                Join waitlist <ArrowRight className="size-4" />
              </>
            )}
          </button>
        )}
      </div>
    </article>
  );
}

export function SageOfferCard({
  kind,
  title,
  description,
  imageUrl,
  price,
  currency,
  available,
  onClick,
}: {
  kind: "call" | "ebook";
  title: string;
  description: string | null;
  imageUrl: string | null;
  price: number;
  currency: CurrencyCode;
  available: boolean;
  onClick: () => void;
}) {
  const Icon = kind === "call" ? Video : BookOpen;
  return (
    <article className="sage-offer-card">
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt=""
          width={400}
          height={300}
          sizes="(min-width: 768px) 220px, 29vw"
          className="sage-offer-photo"
        />
      ) : (
        <div className="sage-offer-photo sage-image-placeholder">
          <Icon className="size-8" aria-hidden="true" />
        </div>
      )}
      <div className="sage-offer-copy">
        <p className="sage-eyebrow">{kind === "call" ? "One-to-one" : "Ebook"}</p>
        <h2>{title}</h2>
        {description ? <p className="sage-offer-description">{description}</p> : null}
        <PriceTag price={price} currency={currency} priceClassName="text-base font-medium" />
        <button
          type="button"
          disabled={!available}
          onClick={onClick}
          className="sage-text-action"
          aria-label={`${kind === "call" ? "Book" : "View"} ${title}`}
          aria-haspopup="dialog"
        >
          {available ? (kind === "call" ? "Find a time" : "Explore the guide") : "Coming soon"}
          <ArrowRight className="size-4" />
        </button>
      </div>
    </article>
  );
}
