import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canUseProDesign } from "@/lib/public-page-theme";
import { slugify } from "@/lib/slug";
import { referralCodeExists } from "@/lib/referral-code";
import { OnboardingClient } from "./onboarding-client";
import type { PlanTier } from "@/generated/prisma/enums";

export const metadata: Metadata = {
  title: "Set up your instructor profile — Flowboc",
  description: "Add your bio, location, specialties and booking link to publish your page.",
  openGraph: {
    title: "Set up your instructor profile — Flowboc",
    description: "Your booking page is minutes away.",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
  robots: { index: false, follow: false },
};

async function suggestSlug(seed: string, currentUserId: string): Promise<string> {
  const base = slugify(seed);
  let slug = base;
  let suffix = 1;
  while (true) {
    const existing = await prisma.instructor.findUnique({ where: { slug } });
    if (!existing || existing.userId === currentUserId) return slug;
    slug = `${base}-${suffix++}`;
  }
}

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string; plan?: string; slug?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth");
  }

  const { ref, plan, slug: slugParam } = await searchParams;

  const [initialUser, instructor] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.user.id } }),
    prisma.instructor.findUnique({
      where: { userId: session.user.id },
      include: { socials: true },
    }),
  ]);

  // The JWT session can outlive the User row it points to (e.g. a stale
  // cookie from before a dev DB reset, or a deleted account). Treat that
  // the same as "not signed in" rather than crashing.
  if (!initialUser) {
    redirect("/auth");
  }
  let user = initialUser;

  // Already finished onboarding — don't re-show step 1. Needed because
  // Google sign-in's redirectTo always points here (see handleGoogleSignIn
  // in auth-client.tsx), since it can't tell in advance whether this will
  // be a brand-new signup or a returning user signing back in.
  if (instructor?.onboardingCompletedAt) {
    redirect("/dashboard");
  }

  // Google sign-in has no equivalent of the credentials signUp() call to
  // attach these to — it lands here directly instead, so pick them up from
  // the query string signIn("google", { redirectTo }) carried through (see
  // handleGoogleSignIn in auth-client.tsx). Only relevant pre-onboarding;
  // harmless no-op once an Instructor already exists.
  if (!instructor) {
    const planTier = plan?.toUpperCase();
    const validPlan: PlanTier | undefined =
      planTier === "STARTER" || planTier === "PRO" || planTier === "PREMIUM" ? planTier : undefined;
    const referralCode = ref?.trim() || null;
    const validReferral = referralCode && (await referralCodeExists(referralCode));

    if ((validReferral && !user.pendingReferralCode) || (validPlan && !user.pendingPlanTier)) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          ...(validReferral && !user.pendingReferralCode
            ? { pendingReferralCode: referralCode }
            : {}),
          ...(validPlan && !user.pendingPlanTier ? { pendingPlanTier: validPlan } : {}),
        },
      });
    }
  }

  const defaultSlug =
    instructor?.slug ??
    (await suggestSlug(slugParam?.trim() || user.name || user.email, session.user.id));
  const instagram = instructor?.socials.find((s) => s.platform === "INSTAGRAM")?.handle ?? "";

  return (
    <OnboardingClient
      canCustomize={
        instructor
          ? canUseProDesign(instructor)
          : ["PRO", "PREMIUM"].includes(user.pendingPlanTier ?? "STARTER")
      }
      defaults={{
        name: instructor?.name ?? user.name ?? "",
        location: instructor?.location ?? "",
        bio: instructor?.bio ?? "",
        phone: instructor?.phone ?? "",
        instagram,
        photoUrl: instructor?.photoUrl ?? null,
        themeColor: instructor?.themeColor ?? "#6355ff",
        specialties: instructor?.specialties ?? ["Vinyasa", "Yin"],
        slug: defaultSlug,
        currency: instructor?.currency ?? "NGN",
      }}
    />
  );
}
