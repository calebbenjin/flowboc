import morningFlow from "@/assets/class-morning-flow.jpg";
import eveningYin from "@/assets/class-evening-yin.jpg";
import instructorPhoto from "@/assets/instructor.jpg";
import { siteHost } from "@/lib/site";

export type ClassStatus = "draft" | "published" | "full" | "cancelled" | "completed";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded" | "cancelled";

export const currencies = [
  { code: "NGN", symbol: "₦", label: "Nigerian Naira", payoutProvider: "paystack" },
  { code: "USD", symbol: "$", label: "US Dollar", payoutProvider: "stripe" },
  { code: "GBP", symbol: "£", label: "British Pound", payoutProvider: "stripe" },
  { code: "EUR", symbol: "€", label: "Euro", payoutProvider: "stripe" },
  { code: "ZAR", symbol: "R", label: "South African Rand", payoutProvider: "paystack" },
  { code: "KES", symbol: "KSh", label: "Kenyan Shilling", payoutProvider: "paystack" },
] as const;

export type CurrencyCode = (typeof currencies)[number]["code"];
export type PayoutProvider = (typeof currencies)[number]["payoutProvider"];

export const payoutProviderInfo: Record<PayoutProvider, { name: string; bankLabel: string }> = {
  stripe: { name: "Stripe", bankLabel: "Chase Checking •••• 4821" },
  paystack: { name: "Paystack", bankLabel: "GTBank •••• 2093" },
};

export function payoutProviderForCurrency(code: CurrencyCode): PayoutProvider {
  return currencies.find((c) => c.code === code)?.payoutProvider ?? "stripe";
}

export const timezones = [
  { value: "Africa/Lagos", label: "WAT", city: "Lagos" },
  { value: "Africa/Johannesburg", label: "SAST", city: "Johannesburg" },
  { value: "Africa/Nairobi", label: "EAT", city: "Nairobi" },
  { value: "Europe/London", label: "GMT/BST", city: "London" },
  { value: "Europe/Berlin", label: "CET", city: "Berlin" },
  { value: "America/New_York", label: "ET", city: "New York" },
  { value: "America/Los_Angeles", label: "PT", city: "Los Angeles" },
] as const;

export type TimezoneCode = (typeof timezones)[number]["value"];

export function timezoneLabel(value: string) {
  return timezones.find((t) => t.value === value)?.label ?? value;
}

export type SocialPlatform =
  "instagram" | "tiktok" | "youtube" | "facebook" | "twitter" | "whatsapp" | "linkedin";

export const socialPlatforms: { platform: SocialPlatform; label: string; placeholder: string }[] = [
  { platform: "instagram", label: "Instagram", placeholder: "@yourhandle" },
  { platform: "tiktok", label: "TikTok", placeholder: "@yourhandle" },
  { platform: "youtube", label: "YouTube", placeholder: "@yourchannel" },
  { platform: "facebook", label: "Facebook", placeholder: "facebook.com/yourpage" },
  { platform: "twitter", label: "X (Twitter)", placeholder: "@yourhandle" },
  { platform: "whatsapp", label: "WhatsApp", placeholder: "+234 800 000 0000" },
  { platform: "linkedin", label: "LinkedIn", placeholder: "linkedin.com/in/yourname" },
];

export type Social = {
  platform: SocialPlatform;
  handle: string;
};

export const instructor = {
  name: "Sarah Boone",
  slug: "sarah-yoga",
  photo: instructorPhoto.src,
  bio: "Yoga instructor helping people build strength, flexibility and mindfulness. Slow mornings, steady breath, no rush.",
  location: "Lekki, Lagos",
  email: "sarah@flowboc.com",
  phone: "+234 802 000 1122",
  consultationLink: "https://calendly.com/sarah-yoga/consultation",
  socials: [
    { platform: "instagram", handle: "@sarah.yoga" },
    { platform: "tiktok", handle: "@sarah.yoga" },
    { platform: "youtube", handle: "@sarahyogastudio" },
    { platform: "twitter", handle: "@sarahyoga" },
    { platform: "linkedin", handle: "linkedin.com/in/sarahboone" },
  ] as Social[],
  specialties: ["Vinyasa", "Yin", "Breathwork", "Beginners"],
  currency: "NGN" as CurrencyCode,
};

export const referralProgram = {
  commissionRate: 20,
  code: "SARAH20",
  link: `${siteHost}/r/SARAH20`,
};

export type ReferralStatus = "pending" | "active" | "churned";

export type Referral = {
  id: string;
  name: string;
  joinedAt: string;
  status: ReferralStatus;
  plan: string;
  commissionEarned: number;
};

export const referrals: Referral[] = [
  {
    id: "ref-1",
    name: "Amaka Studio",
    joinedAt: "2026-06-02",
    status: "active",
    plan: "Growth",
    commissionEarned: 5800,
  },
  {
    id: "ref-2",
    name: "Tunde Fit",
    joinedAt: "2026-06-21",
    status: "active",
    plan: "Starter",
    commissionEarned: 2400,
  },
  {
    id: "ref-3",
    name: "Zen with Zainab",
    joinedAt: "2026-07-14",
    status: "pending",
    plan: "Growth",
    commissionEarned: 0,
  },
];

export const referralStats = {
  totalReferred: referrals.length,
  activeReferrals: referrals.filter((r) => r.status === "active").length,
  totalCommission: referrals.reduce((sum, r) => sum + r.commissionEarned, 0),
};

export function money(amount: number, code: CurrencyCode = instructor.currency) {
  const c = currencies.find((x) => x.code === code) ?? currencies[0];
  return `${c.symbol}${amount.toLocaleString("en-US")}`;
}

export function discountPercent(cls: { price: number; originalPrice?: number | undefined }) {
  if (!cls.originalPrice || cls.originalPrice <= cls.price) return null;
  return Math.round((1 - cls.price / cls.originalPrice) * 100);
}

export type YogaClass = {
  id: string;
  name: string;
  cover: string;
  type: string;
  description: string;
  day: string;
  date: string;
  time: string;
  timezone: TimezoneCode;
  duration: number;
  mode: "In-person" | "Online";
  location: string;
  price: number;
  originalPrice?: number;
  capacity: number;
  booked: number;
  status: ClassStatus;
  recurring?: string;
  deadline: string;
  cancellation: string;
};

export const classes: YogaClass[] = [
  {
    id: "morning-flow",
    name: "Morning Flow",
    cover: morningFlow.src,
    type: "Vinyasa",
    description:
      "A steady sunrise vinyasa to wake the spine and settle the mind. Suitable for all levels — modifications offered throughout.",
    day: "Today",
    date: "Tue, 11 Aug",
    time: "7:00 AM",
    timezone: "Africa/Lagos",
    duration: 60,
    mode: "In-person",
    location: "Freedom Park Studio, Lekki",
    price: 8000,
    originalPrice: 9500,
    capacity: 12,
    booked: 8,
    status: "published",
    recurring: "Every Tuesday & Thursday",
    deadline: "2 hours before start",
    cancellation: "Free cancellation up to 12 hours before class.",
  },
  {
    id: "evening-yin",
    name: "Evening Yin & Breath",
    cover: eveningYin.src,
    type: "Yin",
    description:
      "Long held floor shapes with candlelight and slow breathing. Bring warm layers — we stay still for a while.",
    day: "Wednesday",
    date: "Wed, 12 Aug",
    time: "7:30 PM",
    timezone: "Africa/Lagos",
    duration: 75,
    mode: "In-person",
    location: "Freedom Park Studio, Lekki",
    price: 10000,
    capacity: 14,
    booked: 14,
    status: "full",
    recurring: "Every Wednesday",
    deadline: "1 hour before start",
    cancellation: "Free cancellation up to 24 hours before class.",
  },
  {
    id: "online-foundations",
    name: "Foundations Online",
    cover: morningFlow.src,
    type: "Beginners",
    description:
      "A gentle 45 minute introduction to the postures and breath, streamed live from the studio.",
    day: "Saturday",
    date: "Sat, 15 Aug",
    time: "9:00 AM",
    timezone: "Africa/Lagos",
    duration: 45,
    mode: "Online",
    location: "Zoom link sent after booking",
    price: 5000,
    originalPrice: 6500,
    capacity: 40,
    booked: 21,
    status: "published",
    deadline: "30 minutes before start",
    cancellation: "Free cancellation any time before class.",
  },
  {
    id: "sunday-restore",
    name: "Sunday Restore",
    cover: eveningYin.src,
    type: "Restorative",
    description: "Props, blankets and nothing to achieve. A slow close to the week.",
    day: "Sunday",
    date: "Sun, 16 Aug",
    time: "5:00 PM",
    timezone: "Africa/Lagos",
    duration: 60,
    mode: "In-person",
    location: "Freedom Park Studio, Lekki",
    price: 8000,
    capacity: 12,
    booked: 0,
    status: "draft",
    deadline: "2 hours before start",
    cancellation: "Free cancellation up to 12 hours before class.",
  },
];

export type Booking = {
  id: string;
  student: string;
  email: string;
  phone: string;
  classId: string;
  status: "Confirmed" | "Cancelled" | "Waitlist";
  payment: PaymentStatus;
  amount: number;
  attended?: boolean;
  bookedAt: string;
  source: "Online" | "Manual";
};

export const bookings: Booking[] = [
  {
    id: "b1",
    student: "Sarah Johnson",
    email: "sarah@mail.com",
    phone: "+234 803 111 2233",
    classId: "morning-flow",
    status: "Confirmed",
    payment: "paid",
    amount: 8000,
    attended: true,
    bookedAt: "2 hours ago",
    source: "Online",
  },
  {
    id: "b2",
    student: "John Smith",
    email: "john@mail.com",
    phone: "+234 805 444 5566",
    classId: "morning-flow",
    status: "Confirmed",
    payment: "paid",
    amount: 8000,
    attended: true,
    bookedAt: "5 hours ago",
    source: "Online",
  },
  {
    id: "b3",
    student: "Mary Okonkwo",
    email: "mary@mail.com",
    phone: "+234 806 777 8899",
    classId: "morning-flow",
    status: "Confirmed",
    payment: "pending",
    amount: 8000,
    attended: false,
    bookedAt: "Yesterday",
    source: "Manual",
  },
  {
    id: "b4",
    student: "David Eze",
    email: "david@mail.com",
    phone: "+234 807 222 3344",
    classId: "morning-flow",
    status: "Confirmed",
    payment: "paid",
    amount: 8000,
    attended: true,
    bookedAt: "Yesterday",
    source: "Online",
  },
  {
    id: "b5",
    student: "Amaka Bello",
    email: "amaka@mail.com",
    phone: "+234 809 555 6677",
    classId: "morning-flow",
    status: "Confirmed",
    payment: "paid",
    amount: 8000,
    attended: true,
    bookedAt: "Yesterday",
    source: "Online",
  },
  {
    id: "b6",
    student: "Tunde Balogun",
    email: "tunde@mail.com",
    phone: "+234 810 888 9900",
    classId: "morning-flow",
    status: "Confirmed",
    payment: "failed",
    amount: 8000,
    attended: false,
    bookedAt: "2 days ago",
    source: "Online",
  },
  {
    id: "b7",
    student: "Grace Udo",
    email: "grace@mail.com",
    phone: "+234 811 121 3141",
    classId: "morning-flow",
    status: "Confirmed",
    payment: "paid",
    amount: 8000,
    attended: true,
    bookedAt: "2 days ago",
    source: "Online",
  },
  {
    id: "b8",
    student: "Peter Nwosu",
    email: "peter@mail.com",
    phone: "+234 812 151 6171",
    classId: "morning-flow",
    status: "Confirmed",
    payment: "paid",
    amount: 8000,
    attended: true,
    bookedAt: "3 days ago",
    source: "Manual",
  },
  {
    id: "b9",
    student: "Sarah Johnson",
    email: "sarah@mail.com",
    phone: "+234 803 111 2233",
    classId: "evening-yin",
    status: "Confirmed",
    payment: "paid",
    amount: 10000,
    bookedAt: "1 day ago",
    source: "Online",
  },
  {
    id: "b10",
    student: "Amaka Bello",
    email: "amaka@mail.com",
    phone: "+234 809 555 6677",
    classId: "online-foundations",
    status: "Confirmed",
    payment: "paid",
    amount: 5000,
    bookedAt: "3 hours ago",
    source: "Online",
  },
];

export type Student = {
  name: string;
  email: string;
  phone: string;
  classesBooked: number;
  classesAttended: number;
  totalSpent: number;
  lastBooking: string;
  upcoming: string | null;
};

export const students: Student[] = [
  {
    name: "Sarah Johnson",
    email: "sarah@mail.com",
    phone: "+234 803 111 2233",
    classesBooked: 12,
    classesAttended: 11,
    totalSpent: 96000,
    lastBooking: "2 hours ago",
    upcoming: "Evening Yin & Breath · Wed 7:30 PM",
  },
  {
    name: "John Smith",
    email: "john@mail.com",
    phone: "+234 805 444 5566",
    classesBooked: 8,
    classesAttended: 8,
    totalSpent: 64000,
    lastBooking: "5 hours ago",
    upcoming: "Morning Flow · Today 7:00 AM",
  },
  {
    name: "Amaka Bello",
    email: "amaka@mail.com",
    phone: "+234 809 555 6677",
    classesBooked: 6,
    classesAttended: 5,
    totalSpent: 45000,
    lastBooking: "3 hours ago",
    upcoming: "Foundations Online · Sat 9:00 AM",
  },
  {
    name: "David Eze",
    email: "david@mail.com",
    phone: "+234 807 222 3344",
    classesBooked: 5,
    classesAttended: 4,
    totalSpent: 40000,
    lastBooking: "Yesterday",
    upcoming: null,
  },
  {
    name: "Mary Okonkwo",
    email: "mary@mail.com",
    phone: "+234 806 777 8899",
    classesBooked: 3,
    classesAttended: 2,
    totalSpent: 16000,
    lastBooking: "Yesterday",
    upcoming: "Morning Flow · Today 7:00 AM",
  },
  {
    name: "Tunde Balogun",
    email: "tunde@mail.com",
    phone: "+234 810 888 9900",
    classesBooked: 2,
    classesAttended: 1,
    totalSpent: 8000,
    lastBooking: "2 days ago",
    upcoming: null,
  },
];

export const attention = [
  { kind: "Almost full", detail: "Morning Flow · Today 7:00 AM has 4 spots left" },
  { kind: "Failed payment", detail: "Tunde Balogun's payment for Morning Flow failed" },
  { kind: "Draft class", detail: "Sunday Restore is still unpublished" },
];

export const stats = {
  revenue: 184000,
  upcoming: 4,
  bookings: 37,
  students: 28,
};

export type WeeklyMetric = {
  week: string;
  revenue: number;
  views: number;
  bookings: number;
};

export const weeklyMetrics: WeeklyMetric[] = [
  { week: "Jun 22", revenue: 34000, views: 210, bookings: 8 },
  { week: "Jun 29", revenue: 41000, views: 245, bookings: 9 },
  { week: "Jul 6", revenue: 37000, views: 198, bookings: 7 },
  { week: "Jul 13", revenue: 45000, views: 267, bookings: 10 },
  { week: "Jul 20", revenue: 52000, views: 289, bookings: 11 },
  { week: "Jul 27", revenue: 48000, views: 253, bookings: 9 },
  { week: "Aug 3", revenue: 61000, views: 312, bookings: 13 },
  { week: "Aug 10", revenue: 58000, views: 298, bookings: 12 },
];

export type WaitlistEntry = {
  id: string;
  classId: string;
  name: string;
  email: string;
  joinedAt: string;
};

export const waitlist: WaitlistEntry[] = [
  {
    id: "w1",
    classId: "evening-yin",
    name: "Ngozi Chukwu",
    email: "ngozi@mail.com",
    joinedAt: "2 hours ago",
  },
  {
    id: "w2",
    classId: "evening-yin",
    name: "Bola Adeyemi",
    email: "bola@mail.com",
    joinedAt: "Yesterday",
  },
];

export function classById(id: string) {
  return classes.find((c) => c.id === id);
}

export function bookingsForClass(id: string) {
  return bookings.filter((b) => b.classId === id);
}

export function waitlistForClass(id: string) {
  return waitlist.filter((w) => w.classId === id);
}
