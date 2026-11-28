import type { Metadata } from "next";
import Link from "next/link";
import {
  AtSign,
  BarChart3,
  BellRing,
  BookOpen,
  CalendarClock,
  CalendarPlus,
  CalendarX2,
  ClipboardCheck,
  Clock,
  Download,
  Eye,
  FileText,
  Gift,
  Hourglass,
  Images,
  LayoutTemplate,
  Link2,
  ListOrdered,
  Mail,
  MailCheck,
  MapPin,
  Palette,
  PenLine,
  Repeat,
  ShieldCheck,
  Tag,
  Type,
  UserPlus,
  UserRound,
  Users,
  Video,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { LaunchDialogProvider } from "@/components/landing/launch/LaunchDialogContext";
import { LaunchNavbar } from "@/components/landing/launch/LaunchNavbar";
import { LaunchFinalCTA } from "@/components/landing/launch/LaunchFinalCTA";
import { LaunchFooter } from "@/components/landing/launch/LaunchFooter";
import { TawkToWidget } from "@/components/landing/TawkToWidget";
import { Providers } from "@/app/providers";

// The root layout's title template appends "| Flowboc"; social cards don't
// use the template, so they get the brand name spelled out.
const title = "Features";
const socialTitle = "Flowboc features";
const description =
  "Every Flowboc feature in one place: your booking page, classes, online payments in your local currency, reminders, student records, offers, newsletters and insights.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/features" },
  openGraph: {
    title: socialTitle,
    description,
    type: "website",
    url: "/features",
    siteName: "Flowboc",
  },
  twitter: { card: "summary_large_image", title: socialTitle, description },
};

type Feature = { icon: LucideIcon; name: string; body: string; pro?: boolean };
type Category = { id: string; name: string; intro: string; features: Feature[] };

// Built from what the dashboard actually does. `pro` mirrors the ProBadge
// gates in the app and proFeatures in src/lib/plan-features.ts — keep the
// three in step when a feature moves between plans.
const categories: Category[] = [
  {
    id: "booking-page",
    name: "Your booking page",
    intro: "One link for your bio, your schedule and everything you offer.",
    features: [
      {
        icon: Link2,
        name: "Your own booking link",
        body: "A page at flowboc.com/yourname that you can share anywhere.",
      },
      {
        icon: UserRound,
        name: "Profile and specialties",
        body: "Your photo, bio, location and the styles you teach.",
      },
      {
        icon: AtSign,
        name: "Social links",
        body: "Instagram, TikTok, YouTube, Facebook, X, WhatsApp and LinkedIn.",
      },
      {
        icon: Images,
        name: "Custom links",
        body: "Add your own links with images, like a link-in-bio, and see how often each is clicked.",
      },
      {
        icon: ListOrdered,
        name: "Arrange your page",
        body: "Choose the order your classes, offers and links appear in.",
      },
      {
        icon: LayoutTemplate,
        name: "Page layouts",
        body: "Pick from classic, compact and cover-grid layouts for your classes.",
        pro: true,
      },
      {
        icon: Palette,
        name: "Colours and backgrounds",
        body: "Set your brand colour and a photo, solid colour or gradient background.",
        pro: true,
      },
      {
        icon: Type,
        name: "Font styles",
        body: "Give your page an editorial, literary or modern voice.",
        pro: true,
      },
    ],
  },
  {
    id: "classes",
    name: "Classes and scheduling",
    intro: "Set up a class once and let students find it.",
    features: [
      {
        icon: MapPin,
        name: "In-person and online classes",
        body: "Add a venue for in-person classes, or a joining link for online ones.",
      },
      {
        icon: Repeat,
        name: "Recurring classes",
        body: "Create weekly dates for a fixed period in one go.",
        pro: true,
      },
      {
        icon: Users,
        name: "Capacity and spaces left",
        body: "Set how many students fit, and your page shows the spaces left.",
      },
      {
        icon: Clock,
        name: "Booking deadlines",
        body: "Close bookings a set time before class starts.",
      },
      {
        icon: FileText,
        name: "Cancellation policy",
        body: "Show your policy to students before they book.",
      },
      {
        icon: Tag,
        name: "Sale prices",
        body: "Show an original price next to a discounted one.",
      },
      {
        icon: PenLine,
        name: "Drafts",
        body: "Prepare a class privately and publish it when you're ready.",
      },
      {
        icon: CalendarX2,
        name: "Cancel a class",
        body: "Cancel a class and everyone booked is emailed for you.",
      },
    ],
  },
  {
    id: "bookings-payments",
    name: "Bookings and payments",
    intro: "Students book and pay in one step, and the money goes to you.",
    features: [
      {
        icon: UserPlus,
        name: "Guest checkout",
        body: "Students book without creating an account or downloading an app.",
      },
      {
        icon: Wallet,
        name: "Online payments",
        body: "Payments go to your bank or mobile money account through Paystack.",
      },
      {
        icon: ShieldCheck,
        name: "Local currencies",
        body: "Charge in naira, cedi, shilling, rand or CFA franc.",
      },
      {
        icon: Hourglass,
        name: "Spots held until paid",
        body: "A spot is only confirmed once it's paid, and unpaid holds are released.",
      },
      {
        icon: CalendarClock,
        name: "Waitlist",
        body: "When a class is full, students join a waitlist and hear when a spot opens.",
      },
      {
        icon: ClipboardCheck,
        name: "Manual bookings",
        body: "Add students who booked with you outside Flowboc.",
      },
      {
        icon: CalendarPlus,
        name: "Add to calendar",
        body: "Students save their booking straight to their calendar.",
      },
    ],
  },
  {
    id: "emails",
    name: "Emails and reminders",
    intro: "The messages you used to type by hand, sent for you.",
    features: [
      {
        icon: MailCheck,
        name: "Booking confirmations",
        body: "Every student gets a confirmation as soon as they book.",
      },
      {
        icon: BellRing,
        name: "Class reminders",
        body: "Students get a reminder before class starts.",
      },
      {
        icon: Mail,
        name: "Alerts for you",
        body: "Hear about each new booking, and when a class is fully booked.",
      },
    ],
  },
  {
    id: "students",
    name: "Students",
    intro: "Know who's coming, who's paid and who keeps coming back.",
    features: [
      {
        icon: Users,
        name: "Student list",
        body: "Everyone who has booked with you, with their booking history.",
      },
      {
        icon: ClipboardCheck,
        name: "Attendance",
        body: "Mark who came to each class.",
      },
      {
        icon: Wallet,
        name: "Payment status",
        body: "See which bookings are paid at a glance.",
      },
    ],
  },
  {
    id: "offers",
    name: "Offers beyond classes",
    intro: "Earn from your teaching outside the class schedule.",
    features: [
      {
        icon: Video,
        name: "1:1 video calls",
        body: "Offer a free intro call or a paid private session, with your call link sent after booking.",
        pro: true,
      },
      {
        icon: BookOpen,
        name: "Ebook sales",
        body: "Sell a guide or ebook, and buyers get a secure download link.",
        pro: true,
      },
    ],
  },
  {
    id: "newsletter",
    name: "Newsletter",
    intro: "Stay in touch between classes.",
    features: [
      {
        icon: UserPlus,
        name: "Subscribe form",
        body: "Visitors can subscribe to your updates from your page.",
      },
      {
        icon: Download,
        name: "Subscriber export",
        body: "Download your subscriber list whenever you need it.",
      },
      {
        icon: Mail,
        name: "Newsletter campaigns",
        body: "Write and send updates about new classes and workshops.",
        pro: true,
      },
      {
        icon: LayoutTemplate,
        name: "Ready-made templates",
        body: "Start from a template for your weekly schedule or a new workshop.",
        pro: true,
      },
    ],
  },
  {
    id: "insights",
    name: "Insights",
    intro: "See what's working and plan what comes next.",
    features: [
      {
        icon: Eye,
        name: "Booking and revenue overview",
        body: "Page views, bookings and recorded revenue in your dashboard.",
      },
      {
        icon: BarChart3,
        name: "Class performance and trends",
        body: "Fill rates, your top-earning classes and revenue over time.",
        pro: true,
      },
    ],
  },
  {
    id: "account",
    name: "Your account",
    intro: "Try it properly, and earn when you share it.",
    features: [
      {
        icon: CalendarClock,
        name: "14-day free trial",
        body: "Set up your page and take bookings before you pay anything.",
      },
      {
        icon: Gift,
        name: "Referral program",
        body: "Earn a 20% bonus when an instructor you refer makes their first payment.",
      },
    ],
  },
];

export default function FeaturesPage() {
  return (
    <Providers>
      <LaunchDialogProvider>
        <div className="min-h-screen overflow-x-clip bg-[#fcfbf7]">
          <LaunchNavbar />
          <main>
            <section className="px-5 pb-10 pt-16 sm:px-8 lg:pt-24">
              <div className="mx-auto max-w-[760px] text-center">
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.17em] text-primary">
                  Features
                </p>
                <h1 className="display mt-4 text-4xl leading-[1.08] tracking-tight text-[#272334] sm:text-5xl">
                  Everything Flowboc does,
                  <br />
                  <em className="font-normal italic text-primary">in one place.</em>
                </h1>
                <p className="mt-5 text-lg leading-[1.85] text-[#716277]">
                  Everything is on the Starter plan unless it’s marked <ProPill />.{" "}
                  <Link href="/pricing" className="text-primary underline-offset-2 hover:underline">
                    Compare plans
                  </Link>
                </p>
              </div>

              <nav
                aria-label="Feature categories"
                className="mx-auto mt-8 flex max-w-[900px] flex-wrap justify-center gap-2"
              >
                {categories.map((c) => (
                  <a
                    key={c.id}
                    href={`#${c.id}`}
                    className="rounded-full border border-[#e9e2dc] bg-white px-4 py-1.5 text-xs font-medium text-[#4a4152] hover:border-primary hover:text-primary"
                  >
                    {c.name}
                  </a>
                ))}
              </nav>
            </section>

            <div className="px-5 pb-16 sm:px-8 lg:pb-24">
              <div className="mx-auto w-full max-w-[1100px] divide-y divide-[#e9e2dc]">
                {categories.map((c) => (
                  <section
                    key={c.id}
                    id={c.id}
                    className="grid scroll-mt-28 gap-8 py-12 lg:grid-cols-[280px_1fr] lg:gap-16"
                  >
                    <div>
                      <h2 className="display text-3xl leading-tight text-[#272334]">{c.name}</h2>
                      <p className="mt-3 text-sm leading-[1.8] text-[#716277]">{c.intro}</p>
                    </div>
                    <ul className="grid gap-x-10 gap-y-7 sm:grid-cols-2">
                      {c.features.map((f) => (
                        <li key={f.name} className="flex gap-4">
                          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#eeebff] text-primary">
                            <f.icon className="size-[18px]" strokeWidth={1.7} />
                          </span>
                          <div>
                            <p className="flex flex-wrap items-center gap-2 font-medium text-[#272334]">
                              {f.name}
                              {f.pro ? <ProPill /> : null}
                            </p>
                            <p className="mt-1 text-sm leading-[1.75] text-[#716277]">{f.body}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </section>
                ))}
              </div>
            </div>

            <LaunchFinalCTA />
          </main>
          <LaunchFooter />
        </div>
        <TawkToWidget />
      </LaunchDialogProvider>
    </Providers>
  );
}

function ProPill() {
  return (
    <span className="inline-flex rounded-full bg-[#2d263b] px-2 py-0.5 align-middle text-[0.6rem] font-semibold uppercase tracking-[0.12em] text-white">
      Pro
    </span>
  );
}
