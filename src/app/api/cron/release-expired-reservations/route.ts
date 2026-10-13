import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAuthorizedCronRequest } from "@/lib/cron-auth";

export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
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
    const didRelease = await prisma.$transaction(async (tx) => {
      // Guard the write with paymentStatus: "PENDING" so this can't stomp a
      // payment that the webhook/verifyPayment confirmed in the gap between
      // the findMany above and this update — updateMany returns count: 0 if
      // the row has already moved on, and we skip reopening the class.
      const result = await tx.booking.updateMany({
        where: { id: booking.id, paymentStatus: "PENDING" },
        data: { status: "CANCELLED", paymentStatus: "CANCELLED" },
      });
      if (result.count === 0) return false;

      const cls = await tx.yogaClass.findUnique({ where: { id: booking.classId } });
      if (cls?.status === "FULL") {
        await tx.yogaClass.update({ where: { id: cls.id }, data: { status: "PUBLISHED" } });
      }
      return true;
    });
    if (didRelease) released++;
  }

  return NextResponse.json({ ok: true, released });
}
