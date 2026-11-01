"use server";

import { revalidatePath } from "next/cache";
import {
  canUseProDesign,
  PAGE_TEMPLATES,
  PAGE_FONTS,
  type PublicPageTemplate,
  type PublicPageFont,
} from "@/lib/public-page-theme";
import { prisma } from "@/lib/db";
import { requireInstructor } from "@/lib/require-instructor";
import type { BackgroundType, PageLayout } from "@/generated/prisma/enums";

type ActionResult = { ok: true } | { ok: false; error: string };

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

export async function updateDesign(input: {
  pageTemplate: PublicPageTemplate;
  pageFont: PublicPageFont;
  coverImageUrl: string | null;
  themeColor: string;
  pageLayout: PageLayout;
  backgroundType: BackgroundType;
  backgroundImageUrl: string | null;
  backgroundColor: string | null;
  backgroundGradientFrom: string | null;
  backgroundGradientTo: string | null;
}): Promise<ActionResult> {
  const instructor = await requireInstructor();

  if (!canUseProDesign(instructor))
    return {
      ok: false,
      error: "An active Pro or Premium plan is required to publish custom themes and fonts.",
    };
  if (!PAGE_TEMPLATES.includes(input.pageTemplate) || !PAGE_FONTS.includes(input.pageFont))
    return { ok: false, error: "Choose a valid template and font." };
  if (
    !["CLASSIC", "COMPACT", "COVER_GRID"].includes(input.pageLayout) ||
    !["IMAGE", "COLOR", "GRADIENT"].includes(input.backgroundType)
  )
    return { ok: false, error: "Choose valid layout and background settings." };
  for (const image of [input.coverImageUrl, input.backgroundImageUrl]) {
    if (image && (!/^https:\/\//i.test(image) || image.length > 2048))
      return { ok: false, error: "Use a valid uploaded image URL." };
  }
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
      pageTemplate: input.pageTemplate,
      pageFont: input.pageFont,
      coverImageUrl: input.coverImageUrl,
      themeColor: input.themeColor,
      pageLayout: input.pageLayout,
      backgroundType: input.backgroundType,
      backgroundImageUrl: input.backgroundImageUrl,
      backgroundColor: input.backgroundColor,
      backgroundGradientFrom: input.backgroundGradientFrom,
      backgroundGradientTo: input.backgroundGradientTo,
    },
  });

  revalidatePath(`/${instructor.slug}`);
  revalidatePath(`/${instructor.slug}/classes`);
  revalidatePath("/dashboard/booking-page");
  return { ok: true };
}
