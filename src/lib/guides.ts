// Long-form guides for independent yoga instructors, served at
// /guides/{slug}. Plain data rather than MDX — there are only a handful, and
// keeping them typed means the index page, sitemap and Article structured
// data all read from the one list.
//
// Fee figures quoted here come from PAYSTACK_FEES in src/lib/payout.ts —
// update both together when Paystack changes its pricing.

export type GuideSection = {
  heading: string;
  paragraphs: string[];
  list?: string[];
};

export type Guide = {
  slug: string;
  title: string;
  description: string;
  published: string; // ISO date
  updated: string; // ISO date
  readMinutes: number;
  sections: GuideSection[];
};

export const guides: Guide[] = [
  {
    slug: "how-to-price-yoga-classes-in-nigeria",
    title: "How to price your yoga classes in Nigeria",
    description:
      "A practical way to set drop-in, package and private-session prices for yoga classes in Lagos, Abuja and across Nigeria — including what payment fees really cost you.",
    published: "2026-11-26",
    updated: "2026-11-26",
    readMinutes: 6,
    sections: [
      {
        heading: "Start from what a class costs you, not what others charge",
        paragraphs: [
          "Most new instructors price by looking at what the studio down the road charges and going slightly lower. That tells you what the market tolerates, but not whether you'll earn a living. Begin with your own numbers instead.",
          "Add up what one class actually costs to run: venue hire or a share of your rent, transport to and from the venue (in Lagos traffic, this is real money and real time), props you replace, data and a subscription for online classes, and the time you spend messaging students before and after.",
        ],
        list: [
          "Venue or space cost per session",
          "Transport and time to get there",
          "Equipment wear — mats, blocks, straps",
          "Software, data and payment fees",
          "Your own hourly rate for teaching and admin",
        ],
      },
      {
        heading: "Work out your break-even class size",
        paragraphs: [
          "Divide the cost of running a class by your price per student. If a session costs you ₦30,000 to run and you charge ₦5,000 a head, you need six students just to cover costs — everything after that is income.",
          "If your break-even number is close to your usual attendance, your price is too low or your costs are too high. A smaller, regular group at a fair price is usually more sustainable than a big class that barely covers the venue.",
        ],
      },
      {
        heading: "Offer three price points",
        paragraphs: [
          "Students compare. Giving them a clear ladder makes the decision easier and nudges regulars towards commitment:",
        ],
        list: [
          "Drop-in: the single-class price. Keep it the highest per-class rate.",
          "Packs or recurring classes: a lower per-class rate in exchange for coming back. This is what fills your schedule predictably.",
          "Private sessions: priced well above group rates, because the whole hour is built around one person. A class with a capacity of one works for this.",
        ],
      },
      {
        heading: "Account for payment fees",
        paragraphs: [
          "Taking payment online is far easier than chasing bank transfers, but it isn't free. At the time of writing, Paystack's local card rate in Nigeria is 1.5% plus ₦100, with the ₦100 waived on payments under ₦2,500 and the total fee capped at ₦2,000.",
          "On a ₦5,000 class that's about ₦175. Depending on how your Paystack account is set up, either your student pays it on top or it comes out of what you receive — so decide which you want, and price with it in mind. Flowboc shows you an estimate of the fee as you set each class price.",
        ],
      },
      {
        heading: "Use introductory prices carefully",
        paragraphs: [
          "A launch discount is a good way to fill a new class, but make it obviously temporary. Showing the original price next to the discounted one tells students what the class is really worth, and makes raising the price later feel like the offer ending rather than a price hike.",
        ],
      },
      {
        heading: "Review every few months",
        paragraphs: [
          "Venue and transport costs move, and so does inflation. Look at your numbers each quarter. If classes are regularly full and you have a waitlist, that's a clear signal you can raise prices — or add another session.",
        ],
      },
    ],
  },
  {
    slug: "how-to-get-paid-for-yoga-classes-online-in-africa",
    title: "How to get paid for yoga classes online in Africa",
    description:
      "Taking payment for yoga classes in Nigeria, Ghana, Kenya, South Africa and Côte d'Ivoire: cards, bank payments, mobile money, payouts and fees, explained simply.",
    published: "2026-11-26",
    updated: "2026-11-26",
    readMinutes: 5,
    sections: [
      {
        heading: "Why stop collecting payment by transfer",
        paragraphs: [
          "Plenty of instructors still run bookings over WhatsApp: a student messages, you send account details, they send a screenshot of the transfer, and you add them to a list. It works for five students. At twenty it means hours of checking statements, chasing people who said they'd pay, and no-shows who never did.",
          "Taking payment when someone books fixes most of this. The spot is only theirs once they've paid, you have a record of who's coming, and you're not doing bookkeeping between classes.",
        ],
      },
      {
        heading: "What your students can pay with",
        paragraphs: [
          "Most online payments across the continent go through a payment provider such as Paystack, which lets students pay with local cards and bank payments. In Ghana, Kenya and Côte d'Ivoire, mobile money is also widely used — which payment methods appear at checkout depends on the country and on how your payment account is configured.",
          'Your students shouldn\'t need to create an account to pay you. Every extra step between "I want this class" and "paid" loses people, especially on mobile.',
        ],
      },
      {
        heading: "Where the money goes",
        paragraphs: [
          "With Flowboc, each payment settles into a payout account in your own name — a bank account, or a mobile money wallet in Ghana, Kenya and Côte d'Ivoire. Flowboc doesn't take a cut of your class payments; you pay for the software through your subscription instead.",
          "When you connect a payout account, check that the account name matches your profile name. In Nigeria, Ghana and Kenya the account name can be verified before you save it, which catches typos in an account number before any money goes astray.",
        ],
      },
      {
        heading: "What it costs",
        paragraphs: [
          "Payment providers charge a fee on each transaction. At the time of writing, Paystack's published local card rates are:",
        ],
        list: [
          "Nigeria: 1.5% + ₦100 (₦100 waived under ₦2,500, capped at ₦2,000)",
          "Ghana: 1.95%",
          "Kenya: 2.9% (mobile money such as M-Pesa can be lower)",
          "South Africa: 2.9% + R1",
          "Côte d'Ivoire: 3.2%",
        ],
      },
      {
        heading: "Set clear rules before you take money",
        paragraphs: [
          "Once you're taking payment upfront, students will ask about cancellations and refunds. Decide in advance and write it on every class:",
        ],
        list: [
          "A booking deadline — how close to the start students can still book.",
          "A cancellation policy — whether and until when someone can cancel for a refund or credit.",
          "A capacity — so you never take payment for a spot that doesn't exist. A waitlist catches the overflow.",
        ],
      },
    ],
  },
  {
    slug: "how-to-start-teaching-yoga-independently",
    title: "How to start teaching yoga independently: a practical checklist",
    description:
      "Just finished your yoga teacher training in Lagos, Accra, Nairobi or Cape Town? A step-by-step checklist for running your own classes and finding your first students.",
    published: "2026-11-26",
    updated: "2026-11-26",
    readMinutes: 6,
    sections: [
      {
        heading: "Decide what you'll teach, and to whom",
        paragraphs: [
          '"Yoga for everyone" is hard to market. "Gentle morning yoga for office workers in Victoria Island" or "prenatal yoga online for mums in Nairobi" is easy to describe, easy to share, and easy for the right person to say yes to. You can widen later; a clear focus gets you your first regulars.',
        ],
      },
      {
        heading: "Choose your format",
        paragraphs: ["Each format has different costs and reach:"],
        list: [
          "In-person group classes: the strongest community, but you carry venue costs and are limited to people nearby.",
          "Online classes: no venue, students from any city or country, but you compete for attention with everything else on their screen.",
          "Private sessions: the highest rate per hour and the fastest way to earn while your groups grow.",
          "Corporate and community classes: offices, gyms, estates and churches often want a regular teacher — one contract can fill a weekday.",
        ],
      },
      {
        heading: "Find a space",
        paragraphs: [
          "You don't need your own studio. Rooftops, event spaces, co-working spaces, hotel gyms and quiet parks all host yoga classes. Ask for an off-peak rate or a revenue share while you build attendance, and agree a regular slot — a consistent day and time matters more than a perfect room.",
        ],
      },
      {
        heading: "Set up how people book and pay",
        paragraphs: [
          "Before you announce anything, make it easy to say yes. You need one link you can share everywhere that shows your upcoming classes, lets someone pick a spot, and takes payment — without them having to message you first.",
          'Put that link in your Instagram and WhatsApp bios and your WhatsApp status, and send it to everyone who asks "how do I join?".',
        ],
      },
      {
        heading: "Find your first ten students",
        paragraphs: [
          "Your first students will almost always come from people who already know you. Don't skip this step in favour of ads.",
        ],
        list: [
          "Message friends, colleagues and your teacher-training cohort directly with your first class date.",
          "Offer an introductory price for the first month.",
          "Post short clips of practice, not just announcements — people book teachers they feel they know.",
          "Partner with a café, gym or wellness brand for a launch class.",
          "Ask everyone who attends to bring a friend next time.",
        ],
      },
      {
        heading: "Keep them coming back",
        paragraphs: [
          "Getting someone to one class is the hard part; getting them to the tenth is where an independent teaching business lives. Run classes at the same time every week, send a reminder before each one, learn names, and follow up with people who stop coming. A short newsletter about what's coming up next month does more than you'd expect.",
        ],
      },
    ],
  },
];

export function getGuide(slug: string): Guide | undefined {
  return guides.find((g) => g.slug === slug);
}
