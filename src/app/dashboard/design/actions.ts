"use server";

import { prisma } from "@/lib/db";
import { requireInstructor } from "@/lib/require-instructor";
import type { PageLayout } from "@/generated/prisma/enums";

type ActionResult = { ok: true } | { ok: false; error: string };

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

export async function updateDesign(input: {
  themeColor: string;
  backgroundImageUrl: string | null;
  pageLayout: PageLayout;
}): Promise<ActionResult> {
  const instructor = await requireInstructor();

  if (!HEX_COLOR.test(input.themeColor)) {
    return { ok: false, error: "Theme color must be a valid hex color." };
  }

  await prisma.instructor.update({
    where: { id: instructor.id },
    data: {
      themeColor: input.themeColor,
      backgroundImageUrl: input.backgroundImageUrl,
      pageLayout: input.pageLayout,
    },
  });

  return { ok: true };
}
