import Image from "next/image";
import { Instagram } from "lucide-react";
import { cn } from "@/lib/utils";
import instructorPhoto from "@/assets/instructor.jpg";
import { Eyebrow, Reveal, Section } from "./primitives";

type Creator = {
  name: string;
  handle: string;
  followers: string;
  badge: string;
  photo: { src: string };
};

const creators: Creator[] = [
  {
    name: "Sarah Boone",
    handle: "@sarahboone",
    followers: "12K+ Followers",
    badge: "🧘 Yoga Instructor",
    photo: instructorPhoto,
  },
  {
    name: "Maya Chen",
    handle: "@mayaflows",
    followers: "8K+ Followers",
    badge: "🌙 Yin & Restorative",
    photo: instructorPhoto,
  },
  {
    name: "Priya Anand",
    handle: "@priyavinyasa",
    followers: "20K+ Followers",
    badge: "🔥 Power Vinyasa",
    photo: instructorPhoto,
  },
  {
    name: "Jordan Lee",
    handle: "@jordanleeyoga",
    followers: "15K+ Followers",
    badge: "🤰 Prenatal Yoga",
    photo: instructorPhoto,
  },
  // {
  //   name: "Emma Rhodes",
  //   handle: "@emmarhodes",
  //   followers: "6K+ Followers",
  //   badge: "🌬️ Breathwork Coach",
  //   photo: instructorPhoto,
  // },
  // {
  //   name: "Alina Brooks",
  //   handle: "@alinabrooks",
  //   followers: "25K+ Followers",
  //   badge: "🧘‍♀️ Meditation Guide",
  //   photo: instructorPhoto,
  // },
];

function CreatorCard({ creator }: { creator: Creator }) {
  return (
    <div className="flex shrink-0 snap-center items-center">
      <div className="relative z-10 aspect-4/5 w-64 overflow-hidden rounded-[2rem] sm:w-72">
        <img
          src={creator.photo.src}
          alt={`${creator.name}, ${creator.badge.replace(/^\S+\s/, "")}`}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-linear-to-t from-black/80 via-black/15 to-transparent"
        />
        <div className="absolute inset-x-0 bottom-0 p-6 sm:p-7">
          <h3 className="display text-2xl text-white sm:text-3xl">{creator.name}</h3>
          <p className="mt-1 text-sm text-white/70">{creator.handle}</p>
          <div className="mt-3 flex items-center gap-2 text-sm font-medium text-white/90">
            <Instagram className="size-4" />
            {creator.followers}
          </div>
          <span className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-1.5 text-sm font-semibold text-foreground">
            {creator.badge}
          </span>
        </div>
      </div>

      <Image
        src="/phone-img.png"
        alt={`${creator.name}'s Flowbuk booking page showing her classes, pricing and a book class button`}
        width={693}
        height={1451}
        className="relative z-20 -ml-16 w-36 shrink-0 sm:-ml-20 sm:w-45"
      />
    </div>
  );
}

export function CreatorShowcase() {
  return (
    <Section className="bg-white py-20">
      <Reveal className="mx-auto max-w-4xl text-center">
        <Eyebrow className="mb-4 font-bold">Best teachers use Flowboc </Eyebrow>
        <h2 className="text-3xl leading-[1.1] tracking-tight sm:text-4xl lg:text-6xl">
          One link. <span className="display italic text-clay">Everything you teach.</span>
        </h2>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          Your bio, your classes, your products on one page that looks like you, not a generic
          booking form.
        </p>
      </Reveal>

      <Reveal
        delay={0.1}
        className={cn(
          "mt-14 flex gap-12 overflow-x-auto px-1 pb-6 sm:gap-10",
          "snap-x snap-mandatory scrollbar-none",
          creators.length === 1 && "justify-center",
        )}
      >
        {creators.map((creator) => (
          <CreatorCard key={creator.handle} creator={creator} />
        ))}
      </Reveal>
    </Section>
  );
}
