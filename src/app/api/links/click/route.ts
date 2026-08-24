import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { linkId?: string } | null;
  const linkId = body?.linkId;
  if (!linkId) return NextResponse.json({ ok: false }, { status: 400 });

  await prisma.instructorLink.updateMany({
    where: { id: linkId, isActive: true },
    data: { clickCount: { increment: 1 } },
  });

  return NextResponse.json({ ok: true });
}
