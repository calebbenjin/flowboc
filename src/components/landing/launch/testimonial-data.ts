// Real quotes from instructors using Flowboc. Order matters: the first sits
// beside How it works (so a quote about getting set up fits best), the
// second beside Who it's for, and the Testimonials section shows them all.
// Get written permission to use each name, photo and quote, and never add
// invented quotes here — this list is what production shows.
export type Testimonial = {
  quote: string;
  name: string;
  city: string; // e.g. "Lekki, Lagos"
  photoUrl?: string; // under /public, or an allowed remote image host
  slug?: string; // their Flowboc page, linked as a live example
  sample?: boolean; // placeholder — labelled in the UI, never shown in production
};

const realTestimonials: Testimonial[] = [];

// Layout placeholders so the section can be reviewed before real quotes
// come in. Only used in local dev and Vercel preview deployments, and only
// while realTestimonials is empty.
const sampleTestimonials: Testimonial[] = [
  {
    quote:
      "I set up my page between two classes. That evening I put the link on my WhatsApp status, and my first paid booking came in before bed.",
    name: "Rosemary M.",
    city: "Observatory, Cape Town",
    sample: true,
    photoUrl: "/tes/rose-img.jpg",
  },
  {
    quote:
      "I used to spend Sunday evenings matching bank transfers to a Google Form. Now students book and pay from the link in my bio, and I just check who's coming.",
    name: "Sharon Baron",
    city: "Lekki, Lagos",
    sample: true,
    photoUrl: "/tes/sharon-img.png",
  },
  {
    quote:
      "My students pay with mobile money and the place is confirmed straight away. No more holding spots for people who never sent payment.",
    name: "Sample instructor",
    city: "East Legon, Accra",
    sample: true,
  },
  {
    quote:
      "The reminder emails alone cut my no-shows. It finally feels like I'm running a business, not a group chat.",
    name: "Sample instructor",
    city: "Westlands, Nairobi",
    sample: true,
  },
];

const showSamples =
  process.env.NODE_ENV === "development" || process.env["VERCEL_ENV"] === "preview";

export const testimonials: Testimonial[] =
  realTestimonials.length > 0 ? realTestimonials : showSamples ? sampleTestimonials : [];
