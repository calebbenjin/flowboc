import { Resend } from "resend";

const resend = new Resend(process.env["RESEND_API_KEY"]);

// No verified sending domain yet — Resend's shared sandbox sender works
// without one, but can only deliver to the email address on the Resend
// account. Swap to a verified flowbuk.com address once that's set up.
const FROM = "Flowbuk <onboarding@resend.dev>";

async function sendEmail(params: { to: string; subject: string; html: string; text: string }) {
  if (process.env["NODE_ENV"] !== "production") {
    console.log(`[email] to=${params.to} subject="${params.subject}"\n${params.text}`);
  }

  const { error } = await resend.emails.send({
    from: FROM,
    to: params.to,
    subject: params.subject,
    html: params.html,
    text: params.text,
  });

  if (error) {
    throw new Error(`Failed to send email: ${error.message}`);
  }
}

export async function sendOtpEmail(to: string, code: string) {
  await sendEmail({
    to,
    subject: "Your Flowbuk verification code",
    text: `Your verification code is ${code}. It expires in 10 minutes.`,
    html: `<p>Your verification code is <strong>${code}</strong>.</p><p>It expires in 10 minutes.</p>`,
  });
}

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  await sendEmail({
    to,
    subject: "Reset your Flowbuk password",
    text: `Reset your password: ${resetUrl}\n\nThis link expires in 1 hour. If you didn't request this, you can ignore this email.`,
    html: `<p><a href="${resetUrl}">Reset your password</a></p><p>This link expires in 1 hour. If you didn't request this, you can ignore this email.</p>`,
  });
}
