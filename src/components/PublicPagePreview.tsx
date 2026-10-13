import type { CSSProperties } from "react";
import { Instagram, Video } from "lucide-react";
import { PriceTag } from "@/components/PriceTag";
import { socialIcons, socialHref, type PageLayout } from "@/lib/public-page-layout";
import {
  instructor as demoInstructor,
  classes as demoClasses,
  money,
  type CurrencyCode,
} from "@/lib/demo";
import { cn } from "@/lib/utils";

export type PreviewInstructor = {
  name: string;
  photoUrl: string | null;
  themeColor: string;
  backgroundImageUrl?: string | null;
  pageLayout: PageLayout;
  bio?: string | null;
  socials?: { platform: string; handle: string }[];
  videoCallEnabled?: boolean;
  videoCallTitle?: string | null;
  videoCallDescription?: string | null;
  videoCallImageUrl?: string | null;
  videoCallPrice?: number | null;
  currency?: CurrencyCode;
};

export type PreviewClass = {
  id: string;
  name: string;
  coverUrl: string | null;
  dateLabel: string;
  price: number;
  originalPrice?: number | null;
  currency: CurrencyCode;
  spots?: number | null;
};

function buildDemoClasses(currency: CurrencyCode): PreviewClass[] {
  return demoClasses.slice(0, 3).map((c) => ({
    id: c.id,
    name: c.name,
    coverUrl: c.cover,
    dateLabel: `${c.date} · ${c.time}`,
    price: c.price,
    originalPrice: c.originalPrice ?? null,
    currency,
    spots: Math.max(0, c.capacity - c.booked),
  }));
}

function BookPill({ full = false, label = "SAVE MY SEAT" }: { full?: boolean; label?: string }) {
  return (
    <span
      className={cn(
        "shrink-0 rounded-full px-2 py-2 text-center text-[0.6rem] font-medium text-white",
        full && "block w-full",
      )}
      style={{ backgroundColor: "var(--theme)" }}
    >
      {label}
    </span>
  );
}

function PreviewClassRow({ c, layout }: { c: PreviewClass; layout: PageLayout }) {
  if (layout === "COMPACT") {
    return (
      <div className="space-y-2 rounded-lg border border-border bg-card px-3 py-2.5">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium">{c.name}</p>
          <p className="truncate text-[0.65rem] text-muted-foreground">{c.dateLabel}</p>
        </div>
        <div className="flex items-center justify-between gap-2">
          <PriceTag
            price={c.price}
            originalPrice={c.originalPrice ?? undefined}
            currency={c.currency}
            priceClassName="display text-lg"
          />
        </div>
        <BookPill full />
      </div>
    );
  }

  if (layout === "COVER_GRID") {
    return (
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        {c.coverUrl ? (
          <div>
            <img src={c.coverUrl} alt="" className="aspect-4/3 w-full object-cover" />
          </div>
        ) : (
          <div className="aspect-4/3 w-full bg-sand" />
        )}
        <div className="space-y-1 p-2.5">
          <p className="truncate text-xs font-medium">{c.name}</p>
          <p className="truncate text-[0.62rem] text-muted-foreground">{c.dateLabel}</p>
          <PriceTag
            price={c.price}
            originalPrice={c.originalPrice ?? undefined}
            currency={c.currency}
            priceClassName="display text-lg"
          />
          <BookPill full />
        </div>
      </div>
    );
  }

  // CLASSIC
  return (
    <div className="fle  rounded-lg border border-border bg-card p-2.5">
      {c.coverUrl ? (
        <div className="flex gap-2.5">
          <img src={c.coverUrl} alt="" className="size-12 shrink-0 rounded-md object-cover" />
          <div>
            <p className="truncate text-xs font-medium">{c.name}</p>
            <p className="truncate text-[0.62rem] text-muted-foreground">{c.dateLabel}</p>
          </div>
        </div>
      ) : (
        <div className="flex gap-2.5">
          <div className="size-12 shrink-0 rounded-md bg-sand" />
          <div>
            <p className="truncate text-xs font-medium">{c.name}</p>
            <p className="truncate text-[0.62rem] text-muted-foreground">{c.dateLabel}</p>
          </div>
        </div>
      )}
      <div className="mt-2">
        <div className="flex items-center justify-between gap-2">
          <PriceTag
            price={c?.price}
            originalPrice={c?.originalPrice ?? undefined}
            currency={c?.currency}
            priceClassName="display text-lg"
          />
          {c?.spots !== null && c?.spots !== undefined && (
            <span className="shrink-0 text-[0.6rem]" style={{ color: "var(--theme)" }}>
              {c?.spots} left
            </span>
          )}
        </div>
        <BookPill full />
      </div>
    </div>
  );
}

function PreviewVideoCallCard({ instructor }: { instructor: PreviewInstructor }) {
  if (!instructor.videoCallEnabled) return null;

  const title = instructor.videoCallTitle || "Book a Video Call with Me";
  const isPaid = (instructor.videoCallPrice ?? 0) > 0;

  return (
    <div className="mx-3 mb-3 fle items-center gap-2.5 rounded-lg border border-border bg-card p-2.5">
      {instructor.videoCallImageUrl ? (
        <div className="flex gap-2.5">
          <img
            src={instructor.videoCallImageUrl}
            alt=""
            className="size-10 shrink-0 rounded-md object-cover"
          />
          <div>
            <p className="truncate text-xs font-medium">{title}</p>
            <p className="text-[0.6rem] font-semibold" style={{ color: "var(--theme)" }}>
              {isPaid ? money(instructor.videoCallPrice!, instructor.currency ?? "NGN") : "FREE"}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex gap-2.5">
          <div className="grid size-10 shrink-0 place-items-center rounded-md bg-(--theme)/12 text-(--theme)">
            <Video className="size-4" />
          </div>
          <div>
            <p className="truncate text-xs font-medium">{title}</p>
            <p className="text-[0.6rem] font-semibold" style={{ color: "var(--theme)" }}>
              {isPaid ? money(instructor.videoCallPrice!, instructor.currency ?? "NGN") : "FREE"}
            </p>
          </div>
        </div>
      )}
      <div className="min-w-0 flex-1 mt-2">
        {isPaid ? (
          <span className="shrink-0 rounded-xs bg-secondary px-2 py-1 text-[0.6rem] font-medium text-secondary-foreground">
            Coming soon
          </span>
        ) : (
          <BookPill full label="FIND A TIME" />
        )}
      </div>
    </div>
  );
}

export function PublicPagePreview({
  instructor,
  classes,
  size = "sm",
  className,
}: {
  instructor: PreviewInstructor;
  classes: PreviewClass[];
  size?: "sm" | "md";
  className?: string;
}) {
  const isDemo = classes.length === 0;
  const items = isDemo ? buildDemoClasses("NGN") : classes;
  const name = instructor.name || demoInstructor.name;
  const photoUrl = instructor.photoUrl ?? demoInstructor.photo;
  const socials = instructor.socials?.length ? instructor.socials : demoInstructor.socials;

  const frameWidth = size === "md" ? "w-72" : "w-56";
  const screenHeight = size === "md" ? "h-[576px]" : "h-[448px]";
  // A photo background can be any brightness, so the header (sitting
  // directly over it, outside the cards' own bg-card surfaces) switches to
  // white text + a shadow for guaranteed contrast, same treatment as
  // captions over a photo anywhere else.
  const hasBg = Boolean(instructor.backgroundImageUrl);

  return (
    <div className={cn("relative mx-auto", frameWidth, className)}>
      <div className="rounded-[2rem] border border-border bg-foreground p-2 shadow-(--shadow-lift)">
        <div
          className={cn(
            "relative overflow-hidden rounded-[1.5rem] bg-background",
            screenHeight,
            instructor.backgroundImageUrl ? "bg-cover bg-center" : undefined,
          )}
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
            className={cn(
              "h-full overflow-y-auto",
              instructor.backgroundImageUrl ? "bg-background/40 backdrop-blur-[1px]" : undefined,
            )}
          >
            <div
              className={cn(
                "flex items-center justify-between px-3 pb-1 pt-2.5 text-[0.55rem]",
                hasBg ? "text-white/80 drop-shadow-sm" : "text-muted-foreground",
              )}
            >
              <span>9:41</span>
              <span>flowboc</span>
            </div>

            <div className="flex flex-col items-center px-3 pb-3 pt-1 text-center">
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt={name}
                  className={cn(
                    "size-14 rounded-full object-cover",
                    hasBg && "ring-2 ring-white/80",
                  )}
                />
              ) : (
                <div
                  className={cn(
                    "grid size-14 place-items-center rounded-full bg-clay/15 text-xs font-medium text-clay",
                    hasBg && "ring-2 ring-white/80",
                  )}
                >
                  {name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </div>
              )}
              <p className={cn("mt-2 text-xs font-semibold", hasBg && "text-white drop-shadow-sm")}>
                {name}
              </p>
              {instructor.bio ? (
                <p
                  className={cn(
                    "mt-1 line-clamp-2 text-[0.62rem]",
                    hasBg ? "text-white/85 drop-shadow-sm" : "text-muted-foreground",
                  )}
                >
                  {instructor.bio}
                </p>
              ) : null}
              {socials.length > 0 && (
                <div className="mt-2 flex items-center gap-1.5">
                  {socials.slice(0, 5).map((s) => {
                    const Icon = socialIcons[s.platform] ?? Instagram;
                    return (
                      <span
                        key={s.platform}
                        className={cn(
                          "grid size-5 place-items-center rounded-full bg-white text-muted-foreground",
                          hasBg ? "shadow-sm" : "border border-border",
                        )}
                        aria-hidden="true"
                      >
                        <Icon className="size-2.5" />
                      </span>
                    );
                  })}
                </div>
              )}
            </div>

            <PreviewVideoCallCard instructor={instructor} />

            <div
              className={cn(
                "px-3 pb-4",
                instructor.pageLayout === "COVER_GRID"
                  ? "grid grid-cols-1 gap-2"
                  : "flex flex-col gap-2",
              )}
            >
              {items?.map((c) => (
                <PreviewClassRow key={c.id} c={c} layout={instructor?.pageLayout} />
              ))}
            </div>
          </div>
        </div>
      </div>
      {isDemo && (
        <span className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-foreground px-2.5 py-0.5 text-[0.6rem] font-medium text-background shadow-sm">
          Sample preview
        </span>
      )}
    </div>
  );
}
