"use server";

import { randomBytes, randomInt, createHash } from "node:crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";
import { sendOtpEmail, sendPasswordResetEmail } from "@/lib/email";
import { siteUrl } from "@/lib/site";
import { referralCodeExists } from "@/lib/referral-code";
import type { PlanTier } from "@/generated/prisma/enums";

type ActionResult = { ok: true } | { ok: false; error: string };

const OTP_TTL_MS = 10 * 60 * 1000;
const OTP_RESEND_COOLDOWN_MS = 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;
const RESET_TTL_MS = 60 * 60 * 1000;

function generateOtp(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function signUp(input: {
  name: string;
  email: string;
  password: string;
  referralCode?: string;
  planTier?: PlanTier;
  acceptedTerms: boolean;
}): Promise<ActionResult> {
  const email = input.email.trim().toLowerCase();
  const name = input.name.trim();

  if (!email || !name) {
    return { ok: false, error: "Please provide your name and email." };
  }
  if (input.password.length < 8) {
    return { ok: false, error: "Password must be at least 8 characters." };
  }
  if (!input.acceptedTerms) {
    return { ok: false, error: "Please accept the Terms of Service and Privacy Policy." };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing?.emailVerifiedAt) {
    return {
      ok: false,
      error: "An account with this email already exists. Try logging in instead.",
    };
  }
  // Without this, resubmitting signUp() for an existing unverified account
  // bypassed resendOtp()'s cooldown entirely — anyone could email-bomb an
  // arbitrary address with OTP codes and refill the attempt budget each time.
  if (existing?.otpResendAvailableAt && existing.otpResendAvailableAt > new Date()) {
    const waitSeconds = Math.ceil((existing.otpResendAvailableAt.getTime() - Date.now()) / 1000);
    return { ok: false, error: `Please wait ${waitSeconds}s before requesting a new code.` };
  }

  const referralCode = input.referralCode?.trim() || null;
  if (referralCode && !(await referralCodeExists(referralCode))) {
    return { ok: false, error: "That referral code isn't valid." };
  }

  const hashedPassword = await bcrypt.hash(input.password, 12);
  const otpCode = generateOtp();
  const now = new Date();

  const data = {
    name,
    hashedPassword,
    otpCode,
    otpExpiresAt: new Date(now.getTime() + OTP_TTL_MS),
    otpAttempts: 0,
    otpResendAvailableAt: new Date(now.getTime() + OTP_RESEND_COOLDOWN_MS),
    pendingReferralCode: referralCode,
    pendingPlanTier: input.planTier ?? null,
    termsAcceptedAt: now,
  };

  let user;
  try {
    user = existing
      ? await prisma.user.update({ where: { email }, data })
      : await prisma.user.create({ data: { email, ...data } });
  } catch (err) {
    // Two concurrent signUp() calls for the same brand-new email can both
    // pass the findUnique check above — the loser hits the unique
    // constraint on create() instead of silently throwing.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return {
        ok: false,
        error: "An account with this email already exists. Try logging in instead.",
      };
    }
    throw err;
  }

  try {
    await sendOtpEmail(user.email, otpCode);
  } catch (err) {
    console.error("Failed to send signup OTP email:", err);
    return { ok: false, error: "Couldn't send a verification email. Please try again." };
  }
  return { ok: true };
}

export async function verifyOtp(input: { email: string; code: string }): Promise<ActionResult> {
  const email = input.email.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !user.otpCode || !user.otpExpiresAt) {
    return { ok: false, error: "Invalid or expired code. Request a new one." };
  }
  if (user.otpAttempts >= OTP_MAX_ATTEMPTS) {
    return { ok: false, error: "Too many attempts. Request a new code." };
  }
  if (user.otpExpiresAt < new Date()) {
    return { ok: false, error: "This code has expired. Request a new one." };
  }
  if (user.otpCode !== input.code) {
    await prisma.user.update({
      where: { email },
      data: { otpAttempts: { increment: 1 } },
    });
    return { ok: false, error: "Incorrect code. Try again." };
  }

  await prisma.user.update({
    where: { email },
    data: {
      emailVerifiedAt: new Date(),
      otpCode: null,
      otpExpiresAt: null,
      otpAttempts: 0,
      otpResendAvailableAt: null,
    },
  });

  return { ok: true };
}

export async function resendOtp(input: { email: string }): Promise<ActionResult> {
  const email = input.email.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || user.emailVerifiedAt) {
    return { ok: false, error: "No pending verification for this email." };
  }
  if (user.otpResendAvailableAt && user.otpResendAvailableAt > new Date()) {
    const waitSeconds = Math.ceil((user.otpResendAvailableAt.getTime() - Date.now()) / 1000);
    return { ok: false, error: `Please wait ${waitSeconds}s before requesting a new code.` };
  }

  const otpCode = generateOtp();
  const now = new Date();
  await prisma.user.update({
    where: { email },
    data: {
      otpCode,
      otpExpiresAt: new Date(now.getTime() + OTP_TTL_MS),
      otpAttempts: 0,
      otpResendAvailableAt: new Date(now.getTime() + OTP_RESEND_COOLDOWN_MS),
    },
  });

  try {
    await sendOtpEmail(user.email, otpCode);
  } catch (err) {
    console.error("Failed to send OTP resend email:", err);
    return { ok: false, error: "Couldn't send a verification email. Please try again." };
  }
  return { ok: true };
}

// Always returns the same result regardless of whether the account exists,
// so the client can't use this endpoint to enumerate registered emails.
export async function forgotPassword(input: { email: string }): Promise<ActionResult> {
  const email = input.email.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });

  // Unverified accounts can't log in anyway (see authorize() in
  // src/lib/auth.ts) — skip issuing a reset token for one so a password
  // isn't silently overwritten on an account nobody has finished creating.
  if (user?.emailVerifiedAt) {
    const rawToken = randomBytes(32).toString("hex");
    await prisma.user.update({
      where: { email },
      data: {
        passwordResetTokenHash: hashToken(rawToken),
        passwordResetExpiresAt: new Date(Date.now() + RESET_TTL_MS),
      },
    });

    const resetUrl = `${siteUrl}/auth?token=${rawToken}`;
    try {
      await sendPasswordResetEmail(user.email, resetUrl);
    } catch (err) {
      // Still return { ok: true } below — surfacing a send failure here would
      // leak whether the account exists, defeating the enumeration-safety
      // guarantee. Log server-side instead.
      console.error("Failed to send password reset email:", err);
    }
  }

  return { ok: true };
}

export async function resetPassword(input: {
  token: string;
  newPassword: string;
}): Promise<ActionResult> {
  if (input.newPassword.length < 8) {
    return { ok: false, error: "Password must be at least 8 characters." };
  }

  const tokenHash = hashToken(input.token);
  const hashedPassword = await bcrypt.hash(input.newPassword, 12);

  // One conditional update instead of findFirst-then-update — Postgres
  // serializes concurrent UPDATEs matching the same row, so if two requests
  // race on the same still-valid token, only the first one's WHERE still
  // matches; the second re-checks after the first commits and finds the
  // token already cleared, instead of both silently succeeding.
  const result = await prisma.user.updateMany({
    where: { passwordResetTokenHash: tokenHash, passwordResetExpiresAt: { gt: new Date() } },
    data: { hashedPassword, passwordResetTokenHash: null, passwordResetExpiresAt: null },
  });

  if (result.count === 0) {
    return { ok: false, error: "This reset link is invalid or has expired." };
  }

  return { ok: true };
}
