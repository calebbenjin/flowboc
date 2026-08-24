"use server";

import { prisma } from "@/lib/db";
import { requireInstructor } from "@/lib/require-instructor";

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

export async function createLink(input: { label: string; url: string }): Promise<ActionResult> {
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
      order: (maxOrder._max.order ?? -1) + 1,
    },
  });

  return { ok: true };
}

export async function updateLink(
  id: string,
  input: { label: string; url: string },
): Promise<ActionResult> {
  const instructor = await requireInstructor();

  const error = validateLinkInput(input);
  if (error) return { ok: false, error };

  const result = await prisma.instructorLink.updateMany({
    where: { id, instructorId: instructor.id },
    data: { label: input.label.trim(), url: input.url.trim() },
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

export async function reorderLinks(orderedIds: string[]): Promise<ActionResult> {
  const instructor = await requireInstructor();

  const owned = await prisma.instructorLink.count({
    where: { id: { in: orderedIds }, instructorId: instructor.id },
  });
  if (owned !== orderedIds.length) {
    return { ok: false, error: "Some links could not be reordered." };
  }

  await prisma.$transaction(
    orderedIds.map((id, index) =>
      prisma.instructorLink.updateMany({
        where: { id, instructorId: instructor.id },
        data: { order: index },
      }),
    ),
  );

  return { ok: true };
}
