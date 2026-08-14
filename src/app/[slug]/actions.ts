"use server";

import { prisma } from "@/lib/db";

type ActionResult = { ok: true } | { ok: false; error: string };

export async function joinWaitlist(input: {
  slug: string;
  classId: string;
  name: string;
  email: string;
}): Promise<ActionResult> {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();

  if (!name || !email) {
    return { ok: false, error: "Please enter your name and email." };
  }

  const cls = await prisma.yogaClass.findUnique({
    where: { id: input.classId },
    include: { instructor: { select: { slug: true } } },
  });

  if (!cls || cls.instructor.slug !== input.slug) {
    return { ok: false, error: "This class could not be found." };
  }

  await prisma.waitlistEntry.upsert({
    where: { classId_email: { classId: cls.id, email } },
    create: { classId: cls.id, name, email },
    update: { name },
  });

  return { ok: true };
}
