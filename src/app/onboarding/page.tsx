import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { slugify } from "@/lib/slug";
import { OnboardingClient } from "./onboarding-client";

export const metadata: Metadata = {
  title: "Set up your instructor profile — Flowbuk",
  description: "Add your bio, location, specialties and booking link to publish your page.",
  openGraph: {
    title: "Set up your instructor profile — Flowbuk",
    description: "Your booking page is minutes away.",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
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

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/auth");
  }

  const [user, instructor] = await Promise.all([
    prisma.user.findUniqueOrThrow({ where: { id: session.user.id } }),
    prisma.instructor.findUnique({
      where: { userId: session.user.id },
      include: { socials: true },
    }),
  ]);

  const defaultSlug =
    instructor?.slug ?? (await suggestSlug(user.name || user.email, session.user.id));
  const instagram = instructor?.socials.find((s) => s.platform === "INSTAGRAM")?.handle ?? "";

  return (
    <OnboardingClient
      defaults={{
        name: instructor?.name ?? user.name ?? "",
        location: instructor?.location ?? "",
        bio: instructor?.bio ?? "",
        phone: instructor?.phone ?? "",
        instagram,
        specialties: instructor?.specialties ?? ["Vinyasa", "Yin"],
        slug: defaultSlug,
        currency: instructor?.currency ?? "NGN",
      }}
    />
  );
}
