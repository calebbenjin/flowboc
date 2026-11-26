import Image from "next/image";
import Link from "next/link";
import { testimonials } from "./testimonial-data";

export function Testimonials() {
  if (testimonials.length === 0) return null;

  return (
    <section id="instructors" className="px-5 py-16 sm:px-8 lg:py-24">
      <div className="mx-auto w-full max-w-[1230px]">
        <div className="mx-auto max-w-[650px] text-center">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.17em] text-primary">
            Yoga instructors on Flowboc
          </p>
          <h2 className="display mt-4 text-4xl leading-[1.08] tracking-tight text-[#272334] sm:text-5xl">
            In their <em className="font-normal italic text-primary">own words.</em>
          </h2>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {testimonials.map((t) => (
            <figure
              key={`${t.name}-${t.city}`}
              className="flex flex-col rounded-2xl border border-[#e9e2dc] bg-[#fffaf0] p-6"
            >
              {t.sample ? (
                <span className="mb-4 self-start rounded-full bg-[#f1ddc0] px-2.5 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.12em] text-[#8a6a3f]">
                  Sample — preview only
                </span>
              ) : null}
              <blockquote className="flex-1 text-sm leading-[1.9] text-[#4a4152]">
                “{t.quote}”
              </blockquote>
              <figcaption className="mt-6 flex items-center gap-3">
                {t.photoUrl ? (
                  <Image
                    src={t.photoUrl}
                    alt={t.name}
                    width={44}
                    height={44}
                    className="size-11 rounded-full object-cover"
                  />
                ) : null}
                <div className="text-sm">
                  <div className="font-semibold text-[#272334]">{t.name}</div>
                  <div className="text-xs text-[#82688b]">
                    {t.city}
                    {t.slug ? (
                      <>
                        {" · "}
                        <Link href={`/${t.slug}`} className="text-primary hover:underline">
                          See their page
                        </Link>
                      </>
                    ) : null}
                  </div>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
