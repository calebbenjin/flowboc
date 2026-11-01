import { prisma } from "@/lib/db";
import { formatClassDate, formatClassTime } from "@/lib/format-class-time";
import { siteUrl } from "@/lib/site";
import { emailButton } from "@/lib/email-layout";
import { cleanNewsletterHtml, escapeEmailText } from "./content";
import type { CurrentInstructor } from "@/lib/get-current-instructor";

type Sender = Pick<CurrentInstructor, "id" | "slug" | "currency">;
const symbols: Record<string, string> = {
  NGN: "₦",
  USD: "$",
  GBP: "£",
  EUR: "€",
  ZAR: "R",
  KES: "KSh",
  GHS: "GH₵",
  XOF: "CFA",
};

export async function renderNewsletterBody(
  input: { bodyHtml: string; classIds: string[] },
  instructor: Sender,
): Promise<string> {
  const classes = input.classIds.length
    ? await prisma.yogaClass.findMany({
        where: {
          id: { in: input.classIds },
          instructorId: instructor.id,
          status: { in: ["PUBLISHED", "FULL"] },
          startAt: { gt: new Date() },
        },
      })
    : [];
  if (classes.length !== input.classIds.length)
    throw new Error(
      "An inserted class is no longer available. Remove it or choose another upcoming class.",
    );
  return (
    cleanNewsletterHtml(input.bodyHtml) +
    input.classIds
      .map((id) => {
        const cls = classes.find((item) => item.id === id)!;
        const url = `${siteUrl}/${encodeURIComponent(instructor.slug)}/book/${encodeURIComponent(cls.id)}`;
        const cover =
          cls.coverUrl && /^https?:\/\//i.test(cls.coverUrl)
            ? `<img src="${escapeEmailText(cls.coverUrl)}" alt="${escapeEmailText(cls.name)}" width="480" style="width:100%;max-height:220px;object-fit:cover;display:block;border:0;" />`
            : "";
        const price = `${symbols[instructor.currency] ?? instructor.currency}${cls.price.toLocaleString("en-US")}`;
        return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:24px 0;border:1px solid #e4dcc9;border-radius:12px;overflow:hidden;"><tr><td>${cover}<div style="padding:20px;"><h2 style="margin:0 0 8px;font-family:Georgia,serif;font-size:22px;">${escapeEmailText(cls.name)}</h2><p style="margin:0 0 6px;">${escapeEmailText(formatClassDate(cls))} · ${escapeEmailText(formatClassTime(cls))} (${escapeEmailText(cls.timezone)})</p><p style="margin:0 0 12px;color:#756f65;">${cls.durationMinutes} minutes · ${escapeEmailText(cls.mode === "ONLINE" ? "Online class" : cls.location || "In-person class")}</p><strong style="font-size:20px;">${escapeEmailText(price)}</strong><br />${emailButton("View class & book", url)}</div></td></tr></table>`;
      })
      .join("")
  );
}
