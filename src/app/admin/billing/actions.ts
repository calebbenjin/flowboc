"use server";

import { prisma } from "@/lib/db";
import { logAdminActivity } from "@/lib/admin-activity";
import { requireAdmin } from "@/lib/require-admin";
import { cancelSubscriber, StartbuttonError } from "@/lib/startbutton";

type ActionResult = { ok: true } | { ok: false; error: string };

export async function adminCancelSubscription(instructorId: string): Promise<ActionResult> {
  await requireAdmin();

  const instructor = await prisma.instructor.findUnique({ where: { id: instructorId } });
  if (!instructor) return { ok: false, error: "Instructor not found." };

  if (instructor.subscriptionProviderId) {
    try {
      await cancelSubscriber({
        subscriberId: instructor.subscriptionProviderId,
        reason: "Canceled by admin from Flowboc billing dashboard",
      });
    } catch (err) {
      return {
        ok: false,
        error:
          err instanceof StartbuttonError
            ? err.message
            : "Couldn't cancel subscription on Startbutton.",
      };
    }
  }

  await prisma.instructor.update({
    where: { id: instructorId },
    data: { planStatus: "CANCELED" },
  });

  await logAdminActivity({
    type: "SUBSCRIPTION_CANCELED",
    message: `Admin canceled ${instructor.name}'s subscription`,
    instructorId: instructor.id,
  });

  return { ok: true };
}

export async function adminGrantComp(input: {
  instructorId: string;
  days: number | null;
  note?: string;
}): Promise<ActionResult> {
  await requireAdmin();

  const result = await prisma.instructor.update({
    where: { id: input.instructorId },
    data: {
      planStatus: "COMPED",
      compedUntil:
        input.days !== null ? new Date(Date.now() + input.days * 24 * 60 * 60 * 1000) : null,
      compNote: input.note?.trim() || null,
    },
  });

  const note = input.note?.trim();
  await logAdminActivity({
    type: "COMP_GRANTED",
    message: `Admin granted ${result.name} comp access${note ? ` (${note})` : ""}`,
    instructorId: result.id,
  });

  return { ok: true };
}

export async function adminExtendTrial(input: {
  instructorId: string;
  days: number;
}): Promise<ActionResult> {
  await requireAdmin();

  const result = await prisma.instructor.update({
    where: { id: input.instructorId },
    data: {
      planStatus: "TRIALING",
      trialEndsAt: new Date(Date.now() + input.days * 24 * 60 * 60 * 1000),
    },
  });

  await logAdminActivity({
    type: "TRIAL_EXTENDED",
    message: `Admin extended ${result.name}'s trial by ${input.days} days`,
    instructorId: result.id,
  });

  return { ok: true };
}
