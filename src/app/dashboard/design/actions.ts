"use server";

import { prisma } from "@/lib/db";
import { requireInstructor } from "@/lib/require-instructor";
import type { BackgroundType, PageLayout } from "@/generated/prisma/enums";

type ActionResult = { ok: true } | { ok: false; error: string };

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

export async function updateDesign(input: {
  themeColor: string;
  pageLayout: PageLayout;
  backgroundType: BackgroundType;
  backgroundImageUrl: string | null;
  backgroundColor: string | null;
  backgroundGradientFrom: string | null;
  backgroundGradientTo: string | null;
}): Promise<ActionResult> {
  const instructor = await requireInstructor();

  if (!HEX_COLOR.test(input.themeColor)) {
    return { ok: false, error: "Theme color must be a valid hex color." };
  }

  if (
    input.backgroundType === "COLOR" &&
    input.backgroundColor &&
    !HEX_COLOR.test(input.backgroundColor)
  ) {
    return { ok: false, error: "Background color must be a valid hex color." };
  }
  if (input.backgroundType === "GRADIENT") {
    if (input.backgroundGradientFrom && !HEX_COLOR.test(input.backgroundGradientFrom)) {
      return { ok: false, error: "Gradient colors must be valid hex colors." };
    }
    if (input.backgroundGradientTo && !HEX_COLOR.test(input.backgroundGradientTo)) {
      return { ok: false, error: "Gradient colors must be valid hex colors." };
    }
  }

  await prisma.instructor.update({
    where: { id: instructor.id },
    data: {
      themeColor: input.themeColor,
      pageLayout: input.pageLayout,
      backgroundType: input.backgroundType,
      backgroundImageUrl: input.backgroundImageUrl,
      backgroundColor: input.backgroundColor,
      backgroundGradientFrom: input.backgroundGradientFrom,
      backgroundGradientTo: input.backgroundGradientTo,
    },
  });

  return { ok: true };
}
