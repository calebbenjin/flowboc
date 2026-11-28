import Image from "next/image";
import Link from "next/link";
import type { Testimonial } from "./testimonial-data";

// Dark single-quote card shown beside a section's content (How it works,
// Who it's for). No hooks, so it renders from server and client sections.
export function TestimonialQuoteCard({ quote }: { quote: Testimonial }) {
  return (
    <figure className="flex flex-col justify-between rounded-2xl bg-[#2d263b] p-8 text-[#fff8ed]">
      <div>
        {quote.sample ? (
          <span className="inline-block rounded-full bg-[#f1ddc0] px-2.5 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.12em] text-[#8a6a3f]">
            Sample — preview only
          </span>
        ) : null}
        <span aria-hidden className="display mt-6 block text-6xl leading-none text-[#d4edb0]">
          “
        </span>
        <blockquote className="display mt-2 text-2xl leading-[1.35]">{quote.quote}</blockquote>
      </div>
      <figcaption className="mt-10 flex items-center gap-3 border-t border-white/10 pt-6">
        {quote.photoUrl ? (
          <Image
            src={quote.photoUrl}
            alt={quote.name}
            width={48}
            height={48}
            className="size-12 rounded-full object-cover"
          />
        ) : (
          <span className="grid size-12 place-items-center rounded-full bg-[#d4edb0] font-display text-xl text-[#3e4935]">
            {quote.name.charAt(0)}
          </span>
        )}
        <div className="text-sm">
          <div className="font-semibold">{quote.name}</div>
          <div className="text-xs text-[#bca8c6]">
            {quote.city}
            {quote.slug ? (
              <>
                {" · "}
                <Link href={`/${quote.slug}`} className="text-[#d4edb0] hover:underline">
                  See their page
                </Link>
              </>
            ) : null}
          </div>
        </div>
      </figcaption>
    </figure>
  );
}
