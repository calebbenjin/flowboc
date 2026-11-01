import { Flower2 } from "lucide-react";

const stops = [
  {
    icon: "◎",
    title: "They discover your teaching",
    body: "Socials, a recommendation, a conversation.",
  },
  {
    title: "They find their class",
    body: "Your story, schedule, and offers in one place.",
    featured: true,
  },
  {
    icon: "✓",
    title: "They book directly",
    body: "A simple checkout. No account required.",
    success: true,
  },
];

export function WhyJourney() {
  return (
    <section id="why" className="px-5 py-16 sm:px-8 lg:py-24">
      <div className="mx-auto w-full max-w-[1230px] items-center">
        <div className="text-center mx-auto w-full lg:w-[630px]">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.17em] text-primary">
            A clearer next step
          </p>
          <h2 className="display mt-4 text-4xl leading-[1.08] tracking-tight text-[#272334] sm:text-5xl">
            Make it easier for interest
            <br />
            to become <em className="font-normal italic text-primary">a booking.</em>
          </h2>
          <p className="mt-5 text-sm leading-[1.85] text-[#716277]">
            Someone discovers your teaching. They want to know what you offer, when you teach, and
            how to join. Give them a clear next step while they are ready to take it.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-x-12 gap-y-6 pt-18 sm:grid-cols-2 lg:grid-cols-3 lg:gap-y-8 mx-auto w-full max-w-[990px]">
          {stops.map((stop, i) => (
            <div
              key={stop.title}
              className={`items-center justify-center text-center gap-x-5 py-6`}
            >
              {stop.featured ? (
                <Flower2 className="row-span-2 size-20 text-primary mx-auto" />
              ) : (
                <span
                  className={`row-span-2 grid size-20 place-items-center rounded-full text-3xl mx-auto ${
                    stop.success ? "bg-[#e4efd7] text-[#75915a]" : "bg-[#f0ebdf] text-[#9a8270]"
                  }`}
                >
                  {stop.icon}
                </span>
              )}
              <h4 className="font-medium text-[#272334] mt-2 text-xl">{stop.title}</h4>
              <p className="text-base leading-[1.8] text-[#706d79]">{stop.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
