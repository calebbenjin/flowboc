import { prisma } from "@/lib/db";
import { sendInstructorNewEbookSaleEmail, sendEbookPurchaseEmail } from "@/lib/email";
import { siteUrl } from "@/lib/site";

// Shared between verifyEbookPurchase (src/app/[slug]/actions.ts, the buyer's
// browser returning from Paystack checkout, or a same-request free "buy"),
// and the Paystack webhook (src/app/api/webhooks/paystack/route.ts, the
// authoritative confirmation that doesn't depend on the browser making it
// back) — same "two paths converge on one idempotent finalizer" pattern as
// finalizeVideoCallPayment. Emails (and the download link) only go out
// here, once payment is actually confirmed.
export async function finalizeEbookPurchase(input: {
  purchaseId: string;
  paystackFee: number | null; // major units
}): Promise<{ downloadUrl: string; title: string } | null> {
  const purchase = await prisma.ebookPurchase.findUnique({
    where: { id: input.purchaseId },
    include: { instructor: true },
  });
  if (!purchase || !purchase.instructor.ebookFileUrl) return null;

  const title = purchase.instructor.ebookTitle || "Ebook";
  const downloadUrl = `${siteUrl}/api/ebooks/download/${purchase.id}?token=${purchase.downloadToken}`;

  if (purchase.paymentStatus !== "PAID") {
    await prisma.ebookPurchase.update({
      where: { id: purchase.id },
      data: { paymentStatus: "PAID", paystackFee: input.paystackFee },
    });

    await sendEbookPurchaseEmail({
      to: purchase.buyerEmail,
      buyerName: purchase.buyerName,
      instructorName: purchase.instructor.name,
      instructorEmail: purchase.instructor.email,
      offerTitle: title,
      downloadUrl,
      amount: purchase.amount,
      currency: purchase.currency,
    }).catch((err: unknown) => console.error("Failed to send ebook purchase email:", err));

    await sendInstructorNewEbookSaleEmail({
      to: purchase.instructor.email,
      buyerName: purchase.buyerName,
      buyerEmail: purchase.buyerEmail,
      offerTitle: title,
      amount: purchase.amount,
      currency: purchase.currency,
    }).catch((err: unknown) =>
      console.error("Failed to send instructor ebook sale notification:", err),
    );
  }

  return { downloadUrl, title };
}
