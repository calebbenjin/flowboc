import { Building2, User, Users, Video } from "lucide-react";
import { TestimonialQuoteCard } from "./TestimonialQuoteCard";
import { testimonials } from "./testimonial-data";

// Each card names a way solo instructors actually teach, in the words they'd
// search for ("online yoga classes", "private yoga sessions"), and only
// claims what that format can do in Flowboc today.
const audiences = [
  {
    icon: Users,
    label: "In person",
    title: "Group classes",
    body: "Fill a regular weekly slot at a studio, park or community hall, with the venue, time and spaces left on show.",
  },
  {
    icon: Video,
    label: "Online",
    title: "Online yoga classes",
    body: "Teach students anywhere, with joining details, a booking confirmation and a reminder sent before every class.",
  },
  {
    icon: User,
    label: "1:1",
    title: "Private sessions",
    body: "Sell paid 1:1 sessions at home, in a studio or online, with a free intro call so new students can meet you first.",
  },
  {
    icon: Building2,
    label: "Corporate & community",
    title: "Offices, gyms and estates",
    body: "Run a standing weekly class for a team or community, take attendance, and keep everyone on one student list.",
  },
];

export function WhoItsFor() {
  // The second quote — the first goes beside How it works. With none
  // (production, until real quotes are added) the cards take the full width.
  const quote = testimonials[1];

  return (
    <section id="who-its-for" className="bg-[#f3efe5] px-5 py-16 sm:px-8 lg:py-24">
      <div className="mx-auto w-full max-w-[1230px]">
        <div className="mx-auto max-w-[880px] text-center">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.17em] text-primary">
            Who it&apos;s for
          </p>
          <h2 className="display mt-4 text-4xl leading-[1.08] tracking-tight text-[#272334] sm:text-5xl">
            Built for independent yoga instructors,
            <br />
            <em className="font-normal italic text-primary">however you teach.</em>
          </h2>
          <p className="mt-5 text-lg leading-[1.85] text-[#716277]">
            One booking page for every way you teach, from your first regular class to a full weekly
            schedule.
          </p>
        </div>

        <div
          className={quote ? "mt-12 grid gap-6 lg:grid-cols-[1fr_380px] lg:items-stretch" : "mt-12"}
        >
          <div className={`grid gap-6 sm:grid-cols-2 ${quote ? "" : "lg:grid-cols-4"}`}>
            {audiences.map((a) => (
              <div key={a.title} className="rounded-2xl border border-[#e9e2dc] bg-[#fcfbf7] p-6">
                <a.icon className="size-8 text-primary" strokeWidth={1.3} />
                <p className="mt-6 text-[0.6rem] font-semibold uppercase tracking-[0.17em] text-[#9f83aa]">
                  {a.label}
                </p>
                <h3 className="display mt-2 text-2xl text-[#272334]">{a.title}</h3>
                <p className="mt-3 text-sm leading-[1.8] text-[#716277]">{a.body}</p>
              </div>
            ))}
          </div>

          {quote ? <TestimonialQuoteCard quote={quote} /> : null}
        </div>
      </div>
    </section>
  );
}
