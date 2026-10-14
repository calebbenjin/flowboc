import { prisma } from "@/lib/db";

function randomDigits(length: number): string {
  const chars = "0123456789";
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export async function generateReferralCode(name: string): Promise<string> {
  const base =
    (name.split(" ")[0] ?? "")
      .replace(/[^a-zA-Z]/g, "")
      .toUpperCase()
      .slice(0, 12) || "INSTRUCTOR";

  for (let attempt = 0; attempt < 20; attempt++) {
    const code = `${base}${randomDigits(attempt === 0 ? 2 : 4)}`;
    const existing = await prisma.instructor.findUnique({ where: { referralCode: code } });
    if (!existing) return code;
  }

  // Astronomically unlikely to be reached, but keep it deterministically unique.
  return `${base}${Date.now().toString(36).toUpperCase()}`;
}

// Lets signUp() give the user feedback on a bad code immediately, instead of
// consumeReferralCode's deliberately-silent no-op at onboarding time.
export async function referralCodeExists(rawCode: string): Promise<boolean> {
  const code = rawCode.trim().toUpperCase();
  if (!code) return false;
  const referrer = await prisma.instructor.findUnique({ where: { referralCode: code } });
  return referrer !== null;
}

// Turns a signup-time referral code into a PENDING Referral row once the
// referred instructor's own Instructor record exists. Silently no-ops on an
// invalid code, a self-referral, or a missing code — this runs as part of
// onboarding completion and shouldn't block it over a bad ?ref= value.
export async function consumeReferralCode(
  referredInstructorId: string,
  rawCode: string | null | undefined,
): Promise<void> {
  const code = rawCode?.trim().toUpperCase();
  if (!code) return;

  const referrer = await prisma.instructor.findUnique({ where: { referralCode: code } });
  if (!referrer || referrer.id === referredInstructorId) return;

  await prisma.referral.upsert({
    where: { referredInstructorId },
    create: { referrerInstructorId: referrer.id, referredInstructorId },
    update: {},
  });
}
