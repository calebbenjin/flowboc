import { cache } from "react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

// Wrapped in React's cache() so a Server Component tree that calls this in
// both a layout and a page (e.g. dashboard/layout.tsx + dashboard/page.tsx)
// only pays for one DB round trip per request. Includes `socials` since it's
// a small relation and multiple dashboard pages need it.
export const getCurrentInstructor = cache(async () => {
  const session = await auth();
  if (!session?.user?.id) return null;
  return prisma.instructor.findUnique({
    where: { userId: session.user.id },
    include: { socials: true },
  });
});

export type CurrentInstructor = NonNullable<Awaited<ReturnType<typeof getCurrentInstructor>>>;
