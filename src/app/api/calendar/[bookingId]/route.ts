import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { siteHost } from "@/lib/site";

function escapeIcsText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

function formatIcsDate(date: Date): string {
  return `${date.toISOString().replace(/[-:]/g, "").split(".")[0]}Z`;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ bookingId: string }> },
) {
  const { bookingId } = await params;

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { class: { include: { instructor: { select: { name: true } } } } },
  });

  if (!booking || booking.status !== "CONFIRMED") {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  const cls = booking.class;
  const endAt = new Date(cls.startAt.getTime() + cls.durationMinutes * 60_000);

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Flowbuk//Booking//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${booking.id}@${siteHost}`,
    `DTSTAMP:${formatIcsDate(new Date())}`,
    `DTSTART:${formatIcsDate(cls.startAt)}`,
    `DTEND:${formatIcsDate(endAt)}`,
    `SUMMARY:${escapeIcsText(cls.name)}`,
    cls.location ? `LOCATION:${escapeIcsText(cls.location)}` : null,
    `DESCRIPTION:${escapeIcsText(`Booked with ${cls.instructor.name} via Flowbuk`)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter((line): line is string => line !== null);

  const ics = lines.join("\r\n");
  const filename = cls.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase() || "class";

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}.ics"`,
    },
  });
}
