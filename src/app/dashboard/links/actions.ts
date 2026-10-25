"use server";

import { prisma } from "@/lib/db";
import { requireInstructor } from "@/lib/require-instructor";
import { FIXED_BLOCK_TOKENS, linkIdFromToken } from "@/lib/public-page-blocks";

type ActionResult = { ok: true } | { ok: false; error: string };

const URL_PATTERN = /^https?:\/\/.+/i;

function validateLinkInput(input: { label: string; url: string }): string | null {
  const label = input.label.trim();
  const url = input.url.trim();
  if (!label) return "Please enter a label.";
  if (label.length > 100) return "Label is too long.";
  if (!URL_PATTERN.test(url)) return "Please enter a valid URL starting with http:// or https://.";
  return null;
}

export async function createLink(input: {
  label: string;
  url: string;
  imageUrl?: string | null;
}): Promise<ActionResult> {
  const instructor = await requireInstructor();

  const error = validateLinkInput(input);
  if (error) return { ok: false, error };

  const maxOrder = await prisma.instructorLink.aggregate({
    where: { instructorId: instructor.id },
    _max: { order: true },
  });

  await prisma.instructorLink.create({
    data: {
      instructorId: instructor.id,
      label: input.label.trim(),
      url: input.url.trim(),
      imageUrl: input.imageUrl || null,
      order: (maxOrder._max.order ?? -1) + 1,
    },
  });

  return { ok: true };
}

export async function updateLink(
  id: string,
  input: { label: string; url: string; imageUrl?: string | null },
): Promise<ActionResult> {
  const instructor = await requireInstructor();

  const error = validateLinkInput(input);
  if (error) return { ok: false, error };

  const result = await prisma.instructorLink.updateMany({
    where: { id, instructorId: instructor.id },
    data: {
      label: input.label.trim(),
      url: input.url.trim(),
      imageUrl: input.imageUrl || null,
    },
  });
  if (result.count === 0) return { ok: false, error: "Link not found." };

  return { ok: true };
}

export async function toggleLinkActive(id: string, isActive: boolean): Promise<ActionResult> {
  const instructor = await requireInstructor();

  const result = await prisma.instructorLink.updateMany({
    where: { id, instructorId: instructor.id },
    data: { isActive },
  });
  if (result.count === 0) return { ok: false, error: "Link not found." };

  return { ok: true };
}

export async function deleteLink(id: string): Promise<ActionResult> {
  const instructor = await requireInstructor();

  const result = await prisma.instructorLink.deleteMany({
    where: { id, instructorId: instructor.id },
  });
  if (result.count === 0) return { ok: false, error: "Link not found." };

  return { ok: true };
}

export async function reorderPageBlocks(tokens: string[]): Promise<ActionResult> {
  const instructor = await requireInstructor();

  const linkIds: string[] = [];
  const seen = new Set<string>();
  for (const token of tokens) {
    if (seen.has(token)) return { ok: false, error: "That order couldn't be saved." };
    seen.add(token);

    const linkId = linkIdFromToken(token);
    if (linkId) {
      linkIds.push(linkId);
    } else if (!(FIXED_BLOCK_TOKENS as readonly string[]).includes(token)) {
      return { ok: false, error: "That order couldn't be saved." };
    }
  }

  const owned = await prisma.instructorLink.count({
    where: { id: { in: linkIds }, instructorId: instructor.id },
  });
  if (owned !== linkIds.length) {
    return { ok: false, error: "Some links could not be reordered." };
  }

  await prisma.instructor.update({
    where: { id: instructor.id },
    data: { publicPageBlockOrder: tokens },
  });

  return { ok: true };
}
