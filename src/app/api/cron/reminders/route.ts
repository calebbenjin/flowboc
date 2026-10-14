import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendClassReminderEmail } from "@/lib/email";
import { isAuthorizedCronRequest } from "@/lib/cron-auth";

// Upper bound only — the lower bound used to be "now + 23h", which meant a
// single skipped/delayed daily run (deploy freeze, platform hiccup) could
// push a booking's start time past the window entirely, and it would never
// get a reminder. reminderSentAt is the real dedupe guard, so it's safe to
// catch anything up to 25h out and let a late run send a short-notice
// reminder rather than none at all.
const REMINDER_WINDOW_END_MS = 25 * 60 * 60 * 1000;

export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = Date.now();
  const bookings = await prisma.booking.findMany({
    where: {
      status: "CONFIRMED",
      reminderSentAt: null,
      class: {
        startAt: {
          gt: new Date(now),
          lte: new Date(now + REMINDER_WINDOW_END_MS),
        },
      },
    },
    include: { class: true },
  });

  let sent = 0;
  for (const booking of bookings) {
    try {
      await sendClassReminderEmail({
        to: booking.studentEmail,
        studentName: booking.studentName,
        className: booking.class.name,
        startAt: booking.class.startAt,
        timezone: booking.class.timezone,
        location: booking.class.location,
      });
      await prisma.booking.update({
        where: { id: booking.id },
        data: { reminderSentAt: new Date() },
      });
      sent++;
    } catch (err) {
      console.error(`Failed to send reminder for booking ${booking.id}:`, err);
    }
  }

  return NextResponse.json({ ok: true, checked: bookings.length, sent });
}
