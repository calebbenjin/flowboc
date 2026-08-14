import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env["CRON_SECRET"]}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const expired = await prisma.booking.findMany({
    where: {
      status: "CONFIRMED",
      paymentStatus: "PENDING",
      reservationExpiresAt: { lt: new Date() },
    },
  });

  let released = 0;
  for (const booking of expired) {
    await prisma.$transaction(async (tx) => {
      await tx.booking.update({
        where: { id: booking.id },
        data: { status: "CANCELLED", paymentStatus: "CANCELLED" },
      });

      const cls = await tx.yogaClass.findUnique({ where: { id: booking.classId } });
      if (cls?.status === "FULL") {
        await tx.yogaClass.update({ where: { id: cls.id }, data: { status: "PUBLISHED" } });
      }
    });
    released++;
  }

  return NextResponse.json({ ok: true, released });
}
