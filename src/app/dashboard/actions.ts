"use server";

import { prisma } from "@/lib/db";
import { requireInstructor } from "@/lib/require-instructor";
import { logAdminActivity } from "@/lib/admin-activity";
import { sendFeedbackNotificationEmail } from "@/lib/email";

type ActionResult = { ok: true } | { ok: false; error: string };

export async function dismissChecklist(): Promise<{ ok: true }> {
  const instructor = await requireInstructor();
  await prisma.instructor.update({
    where: { id: instructor.id },
    data: { checklistDismissedAt: new Date() },
  });
  return { ok: true };
}

const FEEDBACK_RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const FEEDBACK_RATE_LIMIT_MAX_PER_WINDOW = 5;

export async function submitFeedback(message: string): Promise<ActionResult> {
  const instructor = await requireInstructor();
  const trimmed = message.trim();

  if (!trimmed) return { ok: false, error: "Please enter your feedback first." };
  if (trimmed.length > 5000)
    return { ok: false, error: "That's a bit long — please trim it down." };

  const since = new Date(Date.now() - FEEDBACK_RATE_LIMIT_WINDOW_MS);
  const recentCount = await prisma.feedback.count({
    where: { instructorId: instructor.id, createdAt: { gte: since } },
  });
  if (recentCount >= FEEDBACK_RATE_LIMIT_MAX_PER_WINDOW) {
    return {
      ok: false,
      error: "You've sent a few of these already — please wait a bit before sending another.",
    };
  }

  await prisma.feedback.create({
    data: { instructorId: instructor.id, message: trimmed },
  });

  await logAdminActivity({
    type: "FEEDBACK_SUBMITTED",
    message: `${instructor.name} left feedback`,
    instructorId: instructor.id,
  });

  try {
    await sendFeedbackNotificationEmail({
      instructorName: instructor.name,
      instructorEmail: instructor.email,
      message: trimmed,
    });
  } catch (err) {
    // The feedback is already stored — don't fail the submission over a
    // transient email-provider issue.
    console.error("Failed to send feedback notification email:", err);
  }

  return { ok: true };
}
