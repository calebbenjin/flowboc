import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendClassReminderEmail } from "@/lib/email";

const REMINDER_WINDOW_START_MS = 23 * 60 * 60 * 1000;
const REMINDER_WINDOW_END_MS = 25 * 60 * 60 * 1000;

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env["CRON_SECRET"]}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = Date.now();
  const bookings = await prisma.booking.findMany({
    where: {
      status: "CONFIRMED",
      reminderSentAt: null,
      class: {
        startAt: {
          gte: new Date(now + REMINDER_WINDOW_START_MS),
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
