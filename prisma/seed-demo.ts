// One-off script to create a self-contained demo account for screenshots
// and product demos. Every row it creates is scoped to the demo User /
// Instructor (or the small "referred instructor" rows made purely to back
// the Referrals table) — it never reads or touches any other account's
// data. Safe to re-run: it deletes only its own prior demo rows first.
//
// Usage: node --env-file=.env.local prisma/seed-demo.ts
import pg from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import { PrismaClient } from "../src/generated/prisma/client.ts";

function withLibpqCompat(connectionString: string) {
  const url = new URL(connectionString);
  if (url.searchParams.get("sslmode") === "require") {
    url.searchParams.set("uselibpqcompat", "true");
  }
  return url.toString();
}

const pool = new pg.Pool({
  connectionString: withLibpqCompat(process.env["POSTGRES_PRISMA_URL"]!),
});
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

const DEMO_EMAIL = "demo@flowbuk.dev";
const DEMO_SLUG = "sarah-yoga-demo";
const DEMO_PASSWORD = process.env["DEMO_PASSWORD"] ?? randomBytes(9).toString("base64url");

const REFERRED_SEED = [
  { email: "demo-ref-1@flowbuk.dev", name: "Amaka Studio", status: "ACTIVE" as const, plan: "Growth", commissionEarned: 5800, daysAgo: 62 },
  { email: "demo-ref-2@flowbuk.dev", name: "Tunde Fit", status: "ACTIVE" as const, plan: "Starter", commissionEarned: 2400, daysAgo: 43 },
  { email: "demo-ref-3@flowbuk.dev", name: "Zen with Zainab", status: "PENDING" as const, plan: "Growth", commissionEarned: 0, daysAgo: 12 },
];

const STUDENTS = [
  { name: "Sarah Johnson", email: "sarah@mail.com", phone: "+234 803 111 2233" },
  { name: "John Smith", email: "john@mail.com", phone: "+234 805 444 5566" },
  { name: "Mary Okonkwo", email: "mary@mail.com", phone: "+234 806 777 8899" },
  { name: "David Eze", email: "david@mail.com", phone: "+234 807 222 3344" },
  { name: "Amaka Bello", email: "amaka@mail.com", phone: "+234 809 555 6677" },
  { name: "Tunde Balogun", email: "tunde@mail.com", phone: "+234 810 888 9900" },
  { name: "Grace Udo", email: "grace@mail.com", phone: "+234 811 121 3141" },
  { name: "Peter Nwosu", email: "peter@mail.com", phone: "+234 812 151 6171" },
  { name: "Ngozi Chukwu", email: "ngozi@mail.com", phone: "+234 813 202 9182" },
  { name: "Bola Adeyemi", email: "bola@mail.com", phone: "+234 814 303 8172" },
  { name: "Femi Okafor", email: "femi@mail.com", phone: "+234 815 404 7162" },
  { name: "Chioma Eze", email: "chioma@mail.com", phone: "+234 816 505 6152" },
];

function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

function hoursAgo(n: number): Date {
  return new Date(Date.now() - n * 60 * 60 * 1000);
}

async function main() {
  console.log(`Seeding demo account: ${DEMO_EMAIL}`);

  // --- Clean up any prior run of this script (demo rows only) ---
  const existingUser = await prisma.user.findUnique({
    where: { email: DEMO_EMAIL },
    include: { instructor: true },
  });
  if (existingUser?.instructor) {
    await prisma.instructor.delete({ where: { id: existingUser.instructor.id } });
  }
  if (existingUser) {
    await prisma.user.delete({ where: { id: existingUser.id } });
  }
  for (const r of REFERRED_SEED) {
    const u = await prisma.user.findUnique({ where: { email: r.email }, include: { instructor: true } });
    if (u?.instructor) await prisma.instructor.delete({ where: { id: u.instructor.id } });
    if (u) await prisma.user.delete({ where: { id: u.id } });
  }

  // --- Demo user + instructor ---
  const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, 10);
  const user = await prisma.user.create({
    data: {
      email: DEMO_EMAIL,
      name: "Sarah Boone",
      hashedPassword,
      emailVerifiedAt: new Date(),
    },
  });

  const instructor = await prisma.instructor.create({
    data: {
      userId: user.id,
      name: "Sarah Boone",
      slug: DEMO_SLUG,
      photoUrl: "/demo/sarah-boone.jpg",
      bio: "Yoga instructor helping people build strength, flexibility and mindfulness. Slow mornings, steady breath, no rush.",
      location: "Williamsburg, Brooklyn",
      email: DEMO_EMAIL,
      phone: "+1 (718) 555-0142",
      consultationLink: "https://calendly.com/sarah-yoga/consultation",
      specialties: ["Vinyasa", "Yin", "Breathwork", "Beginners"],
      currency: "USD",
      onboardingCompletedAt: daysAgo(90),
      planStatus: "ACTIVE",
      payoutProvider: "STRIPE",
      payoutStatus: "CONNECTED",
      payoutAccountId: "demo_stripe_acct",
      payoutBankLabel: "Chase Checking •••• 4821",
      referralCode: "SARAHDEMO",
      commissionRate: 20,
      referralClickCount: 184,
      socials: {
        create: [
          { platform: "INSTAGRAM", handle: "@sarah.yoga" },
          { platform: "TIKTOK", handle: "@sarah.yoga" },
          { platform: "YOUTUBE", handle: "@sarahyogastudio" },
          { platform: "TWITTER", handle: "@sarahyoga" },
          { platform: "LINKEDIN", handle: "linkedin.com/in/sarahboone" },
        ],
      },
      links: {
        create: [
          { label: "Book a 1:1 consultation", url: "https://calendly.com/sarah-yoga/consultation", order: 0, clickCount: 62 },
          { label: "Free breathwork guide (PDF)", url: "https://flowboc.com/r/breathwork-guide", order: 1, clickCount: 41 },
          { label: "Studio location & parking", url: "https://maps.google.com/?q=Bloom+Studio+Williamsburg+Brooklyn", order: 2, clickCount: 19 },
        ],
      },
    },
  });

  // --- Classes: a mix of past (completed), live (published/full), and draft/cancelled ---
  const classDefs = [
    { name: "Morning Flow", type: "Vinyasa", mode: "IN_PERSON" as const, location: "Bloom Studio, Williamsburg", coverUrl: "/demo/morning-mats.jpg", duration: 60, price: 28, originalPrice: 34, capacity: 12, hoursFromNow: 18, status: "PUBLISHED" as const, recurringLabel: "Every Tuesday & Thursday", recurringDays: ["TUE", "THU"] },
    { name: "Evening Yin & Breath", type: "Yin", mode: "IN_PERSON" as const, location: "Bloom Studio, Williamsburg", coverUrl: "/demo/evening-candlelight.jpg", duration: 75, price: 32, originalPrice: null, capacity: 14, hoursFromNow: 44, status: "FULL" as const, recurringLabel: "Every Wednesday", recurringDays: ["WED"] },
    { name: "Foundations Online", type: "Beginners", mode: "ONLINE" as const, location: "Zoom link sent after booking", coverUrl: "/demo/home-studio-stretch.jpg", duration: 45, price: 18, originalPrice: 22, capacity: 40, hoursFromNow: 92, status: "PUBLISHED" as const, recurringLabel: null, recurringDays: [] },
    { name: "Sunday Restore", type: "Restorative", mode: "IN_PERSON" as const, location: "Bloom Studio, Williamsburg", coverUrl: "/demo/evening-candlelight.jpg", duration: 60, price: 26, originalPrice: null, capacity: 12, hoursFromNow: 140, status: "DRAFT" as const, recurringLabel: null, recurringDays: [] },
    { name: "Power Vinyasa", type: "Vinyasa", mode: "IN_PERSON" as const, location: "Bloom Studio, Williamsburg", coverUrl: "/demo/studio-standing-pose.jpg", duration: 60, price: 30, originalPrice: null, capacity: 16, hoursFromNow: 260, status: "PUBLISHED" as const, recurringLabel: "Every Friday", recurringDays: ["FRI"] },
    { name: "Prospect Park Sunrise Session", type: "Vinyasa", mode: "IN_PERSON" as const, location: "Prospect Park, Brooklyn", coverUrl: "/demo/studio-standing-pose.jpg", duration: 60, price: 35, originalPrice: null, capacity: 20, hoursFromNow: -6, status: "COMPLETED" as const, recurringLabel: null, recurringDays: [] },
    { name: "Rainy Day Restorative", type: "Restorative", mode: "ONLINE" as const, location: "Zoom link sent after booking", coverUrl: "/demo/home-studio-stretch.jpg", duration: 50, price: 18, originalPrice: null, capacity: 30, hoursFromNow: -36, status: "CANCELLED" as const, recurringLabel: null, recurringDays: [] },
  ];

  const classes = [];
  for (const c of classDefs) {
    const startAt = hoursAgo(-c.hoursFromNow);
    classes.push(
      await prisma.yogaClass.create({
        data: {
          instructorId: instructor.id,
          name: c.name,
          type: c.type,
          coverUrl: c.coverUrl,
          description: `A ${c.type.toLowerCase()} session for all levels — modifications offered throughout.`,
          startAt,
          timezone: "America/New_York",
          durationMinutes: c.duration,
          mode: c.mode,
          location: c.location,
          price: c.price,
          originalPrice: c.originalPrice,
          capacity: c.capacity,
          status: c.status,
          recurringLabel: c.recurringLabel,
          recurringDays: c.recurringDays,
          deadlineMinutesBeforeStart: 120,
          cancellationPolicy: "Free cancellation up to 12 hours before class.",
          publishedAt: c.status === "DRAFT" ? null : daysAgo(90),
          cancelledAt: c.status === "CANCELLED" ? hoursAgo(-c.hoursFromNow + 2) : null,
        },
      }),
    );
  }

  // --- Bookings spread across the last 16 weeks (for revenue/views charts) + a few very recent ---
  let studentCursor = 0;
  function nextStudent() {
    return STUDENTS[studentCursor++ % STUDENTS.length]!;
  }

  const bookingRows: {
    classId: string;
    instructorId: string;
    studentName: string;
    studentEmail: string;
    studentPhone: string;
    status: "CONFIRMED" | "CANCELLED";
    paymentStatus: "PAID" | "PENDING" | "FAILED";
    amount: number;
    currency: "USD";
    attended: boolean;
    bookedAt: Date;
    source: "ONLINE" | "MANUAL";
  }[] = [];

  // Historical weeks get their own COMPLETED occurrence rows (one per past
  // Tue/Thu Morning Flow session) rather than piling onto the single
  // upcoming class — otherwise its real booking count would exceed
  // capacity and the public page would wrongly show it as sold out.
  const recurringClass = classes[0]!; // Morning Flow — the live, bookable occurrence
  const morningFlowSeriesId = `series-${recurringClass.id}`;
  await prisma.yogaClass.update({
    where: { id: recurringClass.id },
    data: { seriesId: morningFlowSeriesId },
  });

  for (let week = 15; week >= 1; week--) {
    const pastOccurrence = await prisma.yogaClass.create({
      data: {
        instructorId: instructor.id,
        seriesId: morningFlowSeriesId,
        name: recurringClass.name,
        type: recurringClass.type,
        coverUrl: recurringClass.coverUrl,
        description: recurringClass.description,
        startAt: daysAgo(week * 7),
        timezone: "America/New_York",
        durationMinutes: recurringClass.durationMinutes,
        mode: recurringClass.mode,
        location: recurringClass.location,
        price: recurringClass.price,
        capacity: recurringClass.capacity,
        status: "COMPLETED",
        recurringLabel: recurringClass.recurringLabel,
        recurringDays: recurringClass.recurringDays,
        publishedAt: daysAgo(week * 7 + 3),
      },
    });

    const perWeek = 2 + (week % 3); // 2-4 bookings/week of history, well under capacity
    for (let j = 0; j < perWeek; j++) {
      const s = nextStudent();
      const bookedAt = daysAgo(week * 7 + (j % 5));
      bookingRows.push({
        classId: pastOccurrence.id,
        instructorId: instructor.id,
        studentName: s.name,
        studentEmail: s.email,
        studentPhone: s.phone,
        status: "CONFIRMED",
        paymentStatus: "PAID",
        amount: recurringClass.price,
        currency: "USD",
        attended: true,
        bookedAt,
        source: j % 3 === 0 ? "MANUAL" : "ONLINE",
      });
    }
  }

  // Recent, varied-status bookings across a few classes for "Recent bookings" + "Needs attention"
  const recentSpecs: { classIdx: number; hoursAgo: number; payment: "PAID" | "PENDING" | "FAILED"; source: "ONLINE" | "MANUAL"; attended: boolean }[] = [
    { classIdx: 0, hoursAgo: 2, payment: "PAID", source: "ONLINE", attended: false },
    { classIdx: 0, hoursAgo: 5, payment: "PAID", source: "ONLINE", attended: false },
    { classIdx: 0, hoursAgo: 20, payment: "PENDING", source: "MANUAL", attended: false },
    { classIdx: 0, hoursAgo: 22, payment: "PAID", source: "ONLINE", attended: false },
    { classIdx: 1, hoursAgo: 26, payment: "PAID", source: "ONLINE", attended: false },
    { classIdx: 1, hoursAgo: 28, payment: "PAID", source: "ONLINE", attended: false },
    { classIdx: 0, hoursAgo: 30, payment: "FAILED", source: "ONLINE", attended: false },
    { classIdx: 2, hoursAgo: 3, payment: "PAID", source: "ONLINE", attended: false },
    { classIdx: 5, hoursAgo: 30, payment: "PAID", source: "ONLINE", attended: true },
    { classIdx: 5, hoursAgo: 32, payment: "PAID", source: "MANUAL", attended: true },
  ];
  for (const spec of recentSpecs) {
    const s = nextStudent();
    const cls = classes[spec.classIdx]!;
    bookingRows.push({
      classId: cls.id,
      instructorId: instructor.id,
      studentName: s.name,
      studentEmail: s.email,
      studentPhone: s.phone,
      status: "CONFIRMED",
      paymentStatus: spec.payment,
      amount: cls.price,
      currency: "USD",
      attended: spec.attended,
      bookedAt: hoursAgo(spec.hoursAgo),
      source: spec.source,
    });
  }

  // Fill Evening Yin & Breath (idx 1) to capacity so it legitimately reads FULL.
  const eveningYin = classes[1]!;
  for (let i = 0; i < eveningYin.capacity; i++) {
    const s = nextStudent();
    bookingRows.push({
      classId: eveningYin.id,
      instructorId: instructor.id,
      studentName: s.name,
      studentEmail: s.email,
      studentPhone: s.phone,
      status: "CONFIRMED",
      paymentStatus: "PAID",
      amount: eveningYin.price,
      currency: "USD",
      attended: false,
      bookedAt: daysAgo(1 + (i % 3)),
      source: "ONLINE",
    });
  }

  // Push Morning Flow to near-capacity (2 spots left) to trigger the
  // "Almost full" attention item.
  const morningFlow = classes[0]!;
  const morningFlowConfirmed = bookingRows.filter(
    (b) => b.classId === morningFlow.id && b.paymentStatus !== "FAILED",
  ).length;
  const spotsToFill = morningFlow.capacity - 2 - morningFlowConfirmed;
  for (let i = 0; i < Math.max(0, spotsToFill); i++) {
    const s = nextStudent();
    bookingRows.push({
      classId: morningFlow.id,
      instructorId: instructor.id,
      studentName: s.name,
      studentEmail: s.email,
      studentPhone: s.phone,
      status: "CONFIRMED",
      paymentStatus: "PAID",
      amount: morningFlow.price,
      currency: "USD",
      attended: false,
      bookedAt: hoursAgo(1),
      source: "ONLINE",
    });
  }

  await prisma.booking.createMany({ data: bookingRows });

  // --- Waitlist for the full class ---
  await prisma.waitlistEntry.createMany({
    data: [
      { classId: eveningYin.id, name: "Ngozi Chukwu", email: "ngozi@mail.com", joinedAt: hoursAgo(2) },
      { classId: eveningYin.id, name: "Bola Adeyemi", email: "bola@mail.com", joinedAt: daysAgo(1) },
    ],
  });

  // --- Page views across the last 16 weeks (for the analytics chart) ---
  const pageViewRows: { instructorId: string; path: string; createdAt: Date }[] = [];
  for (let week = 15; week >= 0; week--) {
    const count = 25 + ((week * 7) % 40);
    for (let k = 0; k < count; k++) {
      pageViewRows.push({
        instructorId: instructor.id,
        path: `/${DEMO_SLUG}`,
        createdAt: daysAgo(week * 7 + (k % 6)),
      });
    }
  }
  await prisma.pageView.createMany({ data: pageViewRows });

  // --- Newsletter ---
  await prisma.newsletterSubscriber.createMany({
    data: STUDENTS.map((s, i) => ({
      instructorId: instructor.id,
      email: s.email,
      name: s.name,
      status: i === STUDENTS.length - 1 ? "UNSUBSCRIBED" : "SUBSCRIBED",
      unsubscribeToken: randomBytes(24).toString("hex"),
      source: "booking",
      subscribedAt: daysAgo(30 + i * 4),
      unsubscribedAt: i === STUDENTS.length - 1 ? daysAgo(5) : null,
    })),
  });

  await prisma.newsletterCampaign.createMany({
    data: [
      {
        instructorId: instructor.id,
        subject: "New class added: Power Vinyasa 🔥",
        bodyHtml: "<p>Hi there! I've just added a new Friday evening Power Vinyasa class — book your spot before it fills up.</p>",
        status: "SENT",
        recipientCount: 11,
        sentCount: 11,
        failedCount: 0,
        sentAt: daysAgo(9),
      },
      {
        instructorId: instructor.id,
        subject: "Studio closed this Sunday",
        bodyHtml: "<p>Quick note that the studio will be closed this Sunday for a private event. See you Monday!</p>",
        status: "SENT",
        recipientCount: 11,
        sentCount: 10,
        failedCount: 1,
        sentAt: daysAgo(23),
      },
      {
        instructorId: instructor.id,
        subject: "October class schedule",
        bodyHtml: "<p>Draft — finish outlining next month's schedule before sending.</p>",
        status: "DRAFT",
        recipientCount: 0,
        sentCount: 0,
        failedCount: 0,
      },
    ],
  });

  // --- Referred instructors (minimal accounts, only to back the Referrals table) ---
  for (const r of REFERRED_SEED) {
    const refUser = await prisma.user.create({
      data: {
        email: r.email,
        name: r.name,
        hashedPassword: await bcrypt.hash(randomBytes(12).toString("hex"), 10),
        emailVerifiedAt: daysAgo(r.daysAgo),
      },
    });
    const refInstructor = await prisma.instructor.create({
      data: {
        userId: refUser.id,
        name: r.name,
        slug: `${r.email.split("@")[0]}`,
        email: r.email,
        referralCode: r.email.split("@")[0]!.toUpperCase(),
        onboardingCompletedAt: daysAgo(r.daysAgo),
        planStatus: "ACTIVE",
      },
    });
    await prisma.referral.create({
      data: {
        referrerInstructorId: instructor.id,
        referredInstructorId: refInstructor.id,
        status: r.status,
        plan: r.plan,
        commissionEarned: r.commissionEarned,
        joinedAt: daysAgo(r.daysAgo),
      },
    });
  }

  console.log("\nDemo account ready:");
  console.log(`  Email:    ${DEMO_EMAIL}`);
  console.log(`  Password: ${DEMO_PASSWORD}`);
  console.log(`  Public page: /${DEMO_SLUG}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
