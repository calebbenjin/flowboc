import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Gated redirect to the instructor's ebookFileUrl — never expose that blob
// URL directly. Requires both the purchase id (in the path) and its
// downloadToken (query param) to match, plus a confirmed PAID purchase, so
// a leaked purchase id alone can't unlock the file.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ purchaseId: string }> },
) {
  const { purchaseId } = await params;
  const token = new URL(request.url).searchParams.get("token");

  const purchase = token
    ? await prisma.ebookPurchase.findUnique({
        where: { id: purchaseId },
        include: { instructor: { select: { ebookFileUrl: true } } },
      })
    : null;

  if (
    !purchase ||
    purchase.downloadToken !== token ||
    purchase.paymentStatus !== "PAID" ||
    !purchase.instructor.ebookFileUrl
  ) {
    return new NextResponse("Not found", { status: 404 });
  }

  return NextResponse.redirect(purchase.instructor.ebookFileUrl);
}
