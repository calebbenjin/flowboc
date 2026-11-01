import { sageBackgroundStyle } from "@/lib/sage-background";
import Image from "next/image";
import { SageSocialLinks } from "@/components/public/SageTheme";
import { ArrowRight, Leaf, Mail, Video, BookOpen } from "lucide-react";
import { publicFont, SAGE_COVER } from "@/lib/public-page-theme";
import { money } from "@/lib/demo";
import type { PreviewInstructor, PreviewClass } from "@/components/PublicPagePreview";
import type { CSSProperties, ReactNode } from "react";

export function SagePreview({
  instructor,
  classes,
  size,
  className,
  emptyState,
}: {
  instructor: PreviewInstructor;
  classes: PreviewClass[];
  size: "sm" | "md";
  className?: string;
  emptyState?: ReactNode;
}) {
  const font = publicFont(instructor.pageFont);
  const cover = instructor.coverImageUrl || SAGE_COVER;
  const offers = [
    ...(instructor.videoCallEnabled
      ? [
          {
            kind: "One-to-one",
            title: instructor.videoCallTitle || "Private practice",
            image: instructor.videoCallImageUrl,
            description: instructor.videoCallDescription,
            price: instructor.videoCallPrice ?? 0,
            action: "Find a time",
            Icon: Video,
          },
        ]
      : []),
    ...(instructor.ebookEnabled
      ? [
          {
            kind: "Ebook",
            title: instructor.ebookTitle || "My ebook",
            image: instructor.ebookCoverUrl,
            description: instructor.ebookDescription,
            price: instructor.ebookPrice ?? 0,
            action: "Explore the guide",
            Icon: BookOpen,
          },
        ]
      : []),
  ];
  return (
    <div className={`relative mx-auto ${size === "md" ? "w-72" : "w-56"} ${className ?? ""}`}>
      <div className="overflow-hidden rounded-[2rem] border-8 border-foreground bg-[#e8ebdf] shadow-(--shadow-lift)">
        <div
          className={`public-personalized overflow-y-auto ${size === "md" ? "h-[576px]" : "h-[448px]"}`}
          style={
            {
              "--public-heading": font.heading,
              "--public-body": font.body,
              ...sageBackgroundStyle(instructor),
              color: "var(--sage-profile-ink)",
            } as CSSProperties
          }
        >
          {cover.startsWith("/") ? (
            <Image
              src={cover}
              alt=""
              width={2172}
              height={724}
              sizes="280px"
              className="h-24 w-full object-cover"
            />
          ) : (
            <img src={cover} alt="" className="h-24 w-full object-cover" />
          )}
          <div className="relative -mt-11 flex flex-col items-center px-3 pb-4 text-center">
            {instructor.photoUrl ? (
              <img
                src={instructor.photoUrl}
                alt={instructor.name}
                className="h-[76px] w-16 rounded-lg border-2 border-[#faf7ee] object-cover"
              />
            ) : (
              <div className="grid h-[76px] w-16 place-items-center rounded-lg bg-[#faf7ee]">
                <Leaf className="size-5" />
              </div>
            )}
            <h3 className="mt-2 text-[23px] leading-tight">{instructor.name}</h3>
            {instructor.bio ? (
              <p className="mt-2 line-clamp-3 text-[8px] uppercase tracking-[.1em] leading-relaxed">
                {instructor.bio}
              </p>
            ) : null}
            <SageSocialLinks socials={instructor.socials ?? []} compact preview />
          </div>
          <div className="space-y-2.5 px-3 pb-4">
            {classes.length === 0 && emptyState}
            {classes.slice(0, 1).map((cls) => (
              <div
                key={cls.id}
                className="flex gap-2 rounded-lg border border-[#89907b] bg-[#faf7ee] text-[#303b2d] p-2"
              >
                {cls.coverUrl ? (
                  <img
                    src={cls.coverUrl}
                    alt=""
                    className="min-h-28 w-[40%] rounded-md object-cover"
                  />
                ) : (
                  <div className="grid min-h-28 w-[40%] shrink-0 place-items-center rounded-md bg-[#e1e5d7]">
                    <Leaf className="size-4" />
                  </div>
                )}
                <div className="min-w-0 flex-1 space-y-1 py-0.5 leading-[1.35]">
                  <p className="text-[7px] uppercase tracking-widest">Group class</p>
                  <h3 className="text-base leading-tight">{cls.name}</h3>
                  <p className="text-[8px]">{cls.dateLabel}</p>
                  {cls.formatLabel ? <p className="text-[8px]">{cls.formatLabel}</p> : null}
                  {cls.description ? (
                    <p className="whitespace-pre-wrap break-words text-[9px] leading-snug">
                      {cls.description}
                    </p>
                  ) : null}
                  <p className="text-[10px]">{money(cls.price, cls.currency)}</p>
                  {cls.spots != null ? (
                    <p className="text-[8px] text-clay">
                      {cls.spots > 0
                        ? `${cls.spots} ${cls.spots === 1 ? "spot" : "spots"} left`
                        : "Class full"}
                    </p>
                  ) : null}
                  <span
                    className="block rounded px-2 py-1.5 text-[9px] text-white"
                    style={{ backgroundColor: instructor.themeColor }}
                  >
                    {cls.spots === 0 ? "Join waitlist →" : "Book your place →"}
                  </span>
                </div>
              </div>
            ))}
            {offers.map((offer) => (
              <div
                key={offer.kind}
                className="flex gap-2 rounded-lg border border-[#89907b] bg-[#faf7ee] text-[#303b2d] p-2"
              >
                {offer.image ? (
                  <img src={offer.image} alt="" className="h-20 w-16 rounded object-cover" />
                ) : (
                  <div className="grid h-20 w-16 shrink-0 place-items-center rounded bg-[#e1e5d7]">
                    <offer.Icon className="size-4" />
                  </div>
                )}
                <div className="min-w-0 space-y-0.5 py-0.5 leading-[1.35]">
                  <p className="text-[7px] uppercase tracking-widest">{offer.kind}</p>
                  <h3 className="text-sm leading-tight">{offer.title}</h3>
                  {offer.description ? (
                    <p className="whitespace-pre-wrap break-words text-[9px] leading-snug">
                      {offer.description}
                    </p>
                  ) : null}
                  <p className="text-[11px] font-medium">
                    {money(offer.price, instructor.currency ?? "NGN")}
                  </p>
                  <p className="text-[10px] underline underline-offset-2">{offer.action} →</p>
                </div>
              </div>
            ))}
            {!(classes.length === 0 && emptyState) &&
              [
                { label: "Upcoming classes", Icon: Leaf },
                { label: "Join my newsletter", Icon: Mail },
              ]
                .filter(({ Icon }) => Icon !== Mail || instructor.newsletterEnabled !== false)
                .map(({ label, Icon }) => (
                  <div
                    key={label}
                    className="flex items-center justify-between rounded-lg border border-[#89907b] bg-[#faf7ee] text-[#303b2d] px-3 py-3"
                  >
                    <Icon className="mr-2 size-4 shrink-0" aria-hidden="true" />
                    <span className="display min-w-0 flex-1 text-sm">{label}</span>
                    <ArrowRight className="size-3" />
                  </div>
                ))}
            <p className="py-3 text-center text-[8px] tracking-widest">Powered by Flowboc</p>
          </div>
        </div>
      </div>
    </div>
  );
}
