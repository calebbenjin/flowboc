export type SampleClass = {
  name: string;
  date: string;
  duration: string;
  mode: string;
  price: string;
  spots: string;
  image: string;
  alt: string;
  description: string;
};

export const sampleClasses: SampleClass[] = [
  {
    name: "Morning Flow",
    date: "Monday · 2 Nov · 7:00 AM WAT",
    duration: "60 minutes",
    mode: "Online class",
    price: "$28",
    spots: "8 spaces available",
    image: "/flowboc-launch/assets/morning.jpg",
    alt: "Yoga mats arranged in a bright studio",
    description:
      "Ease into your day with a gentle, energising flow. Make a little room for yourself before the world wakes up.",
  },
  {
    name: "Slow down & reset",
    date: "Wednesday · 4 Nov · 6:00 PM WAT",
    duration: "75 minutes",
    mode: "In-person class",
    price: "$35",
    spots: "5 spaces available",
    image: "/flowboc-launch/assets/evening.jpg",
    alt: "A calm studio prepared for an evening practice",
    description:
      "A slower practice for a softer landing. Gentle movement, unhurried breathing, and a little time to return to yourself.",
  },
  {
    name: "Private practice",
    date: "Friday · 6 Nov · 10:00 AM WAT",
    duration: "60 minutes",
    mode: "Online class",
    price: "$70",
    spots: "1 space available",
    image: "/flowboc-launch/assets/studio.jpg",
    alt: "A yoga studio with room for a private practice",
    description:
      "A class built around you. An individual session with space for your pace, your questions, and the way you want to move.",
  },
];

export type ThemeKey = "violet" | "sand" | "forest";

export const themeMap: Record<ThemeKey, { page: string; bg: string }> = {
  violet: { page: "#6355ff", bg: "#eeebff" },
  sand: { page: "#af774d", bg: "#f0e3d0" },
  forest: { page: "#28654d", bg: "#dfe9d9" },
};

export type PlanKey = "starter" | "pro";

export const planPricing: Record<PlanKey, { label: string; monthly: number; annual: number }> = {
  starter: { label: "Starter", monthly: 9, annual: 90 },
  pro: { label: "Pro", monthly: 19, annual: 190 },
};

export const growthPeriods = {
  "4": {
    revenue: "$672",
    views: "640",
    bookings: "24",
    fillRate: "80%",
    rangeLabel: "Week 4",
    line: "M8 145 170 99 345 115 512 35",
    lastCy: 35,
  },
  "8": {
    revenue: "$1,232",
    views: "1,180",
    bookings: "44",
    fillRate: "73%",
    rangeLabel: "Week 8",
    line: "M8 155 80 140 152 153 224 99 296 113 368 62 440 83 512 30",
    lastCy: 30,
  },
} as const;

export type GrowthPeriod = keyof typeof growthPeriods;
