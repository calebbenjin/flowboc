import { redirect } from "next/navigation";
import { after } from "next/server";
import { prisma } from "@/lib/db";

export default async function ReferralRedirectPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const normalized = code.trim().toUpperCase();

  const instructor = await prisma.instructor.findUnique({ where: { referralCode: normalized } });

  if (!instructor) {
    // Invalid/unknown code — drop it silently rather than crash or leak
    // whether a code exists.
    redirect("/auth");
  }

  after(() =>
    prisma.instructor.update({
      where: { id: instructor.id },
      data: { referralClickCount: { increment: 1 } },
    }),
  );

  redirect(`/auth?ref=${encodeURIComponent(normalized)}`);
}
