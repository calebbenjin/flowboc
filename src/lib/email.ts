import { Resend } from "resend";
import { formatClassDate, formatClassTime } from "@/lib/format-class-time";
import { supportEmail } from "@/lib/site";

const resend = new Resend(process.env["RESEND_API_KEY"]);

// flowboc.com is verified with Resend, so this can deliver to any
// recipient — the shared onboarding@resend.dev sandbox sender (used before
// verification) could only deliver to the address on the Resend account.
const FROM = "Flowbuk <notifications@flowboc.com>";

type ClassTiming = { startAt: Date; timezone: string };

function whenLine(cls: ClassTiming): string {
  return `${formatClassDate(cls, "long")} at ${formatClassTime(cls)}`;
}

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

export async function sendContactNotificationEmail(input: {
  name: string;
  email: string;
  subject: string | null;
  message: string;
}) {
  const subjectLine = input.subject ? `Contact form: ${input.subject}` : "New contact form message";
  await sendEmail({
    to: supportEmail,
    subject: subjectLine,
    text: `From: ${input.name} <${input.email}>\n\n${input.message}`,
    html: `<p>From: ${input.name} &lt;${input.email}&gt;</p><p>${input.message.replace(/\n/g, "<br>")}</p>`,
  });
}

// Sent when a booking is created — payments aren't wired up yet (a later
// batch), so this confirms the reservation rather than a completed
// payment.
export async function sendBookingConfirmationEmail(
  input: {
    to: string;
    studentName: string;
    className: string;
    instructorName: string;
    location: string | null;
  } & ClassTiming,
) {
  const when = whenLine(input);
  await sendEmail({
    to: input.to,
    subject: `You're booked: ${input.className}`,
    text: `Hi ${input.studentName},\n\nYou're booked for ${input.className} with ${input.instructorName} on ${when}${input.location ? ` at ${input.location}` : ""}.\n\nSee you there!`,
    html: `<p>Hi ${input.studentName},</p><p>You're booked for <strong>${input.className}</strong> with ${input.instructorName} on ${when}${input.location ? ` at ${input.location}` : ""}.</p><p>See you there!</p>`,
  });
}

export async function sendInstructorNewBookingEmail(
  input: { to: string; studentName: string; className: string } & ClassTiming,
) {
  const when = whenLine(input);
  await sendEmail({
    to: input.to,
    subject: `New booking: ${input.studentName} for ${input.className}`,
    text: `${input.studentName} just booked ${input.className} on ${when}.`,
    html: `<p><strong>${input.studentName}</strong> just booked <strong>${input.className}</strong> on ${when}.</p>`,
  });
}

export async function sendCapacityReachedEmail(
  input: { to: string; className: string; capacity: number } & ClassTiming,
) {
  const when = whenLine(input);
  await sendEmail({
    to: input.to,
    subject: `${input.className} is fully booked`,
    text: `${input.className} on ${when} just hit its capacity of ${input.capacity}. New students will be offered the waitlist.`,
    html: `<p><strong>${input.className}</strong> on ${when} just hit its capacity of ${input.capacity}. New students will be offered the waitlist.</p>`,
  });
}

export async function sendCancellationEmail(
  input: {
    to: string;
    studentName: string;
    className: string;
    instructorName: string;
  } & ClassTiming,
) {
  const when = whenLine(input);
  await sendEmail({
    to: input.to,
    subject: `Cancelled: ${input.className}`,
    text: `Hi ${input.studentName},\n\nYour booking for ${input.className} with ${input.instructorName} on ${when} has been cancelled.`,
    html: `<p>Hi ${input.studentName},</p><p>Your booking for <strong>${input.className}</strong> with ${input.instructorName} on ${when} has been cancelled.</p>`,
  });
}

export async function sendWaitlistSpotOpenEmail(
  input: { to: string; name: string; className: string; bookUrl: string } & ClassTiming,
) {
  const when = whenLine(input);
  await sendEmail({
    to: input.to,
    subject: `A spot opened up: ${input.className}`,
    text: `Hi ${input.name},\n\nA spot just opened up for ${input.className} on ${when}. Book it before it's gone: ${input.bookUrl}`,
    html: `<p>Hi ${input.name},</p><p>A spot just opened up for <strong>${input.className}</strong> on ${when}.</p><p><a href="${input.bookUrl}">Book your spot</a></p>`,
  });
}

// Reasonable-effort plain-text fallback for the rich-text campaign body —
// not a full HTML parser, just enough to turn the composer's HTML into
// readable text for clients that render text/plain.
export function stripHtml(html: string): string {
  return html
    .replace(/<\/(p|div|h[1-6]|li)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<li[^>]*>/gi, "• ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function buildNewsletterHtml(bodyHtml: string, instructorName: string, unsubscribeUrl: string) {
  return `${bodyHtml}<p style="margin-top:32px;color:#8a8a8a;font-size:12px;">You're receiving this because you subscribed to updates from ${instructorName} on Flowbuk. <a href="${unsubscribeUrl}">Unsubscribe</a></p>`;
}

function buildNewsletterText(bodyHtml: string, instructorName: string, unsubscribeUrl: string) {
  return `${stripHtml(bodyHtml)}\n\n—\nYou're receiving this because you subscribed to updates from ${instructorName} on Flowbuk.\nUnsubscribe: ${unsubscribeUrl}`;
}

export function buildNewsletterEmail(input: {
  to: string;
  subject: string;
  bodyHtml: string;
  instructorName: string;
  unsubscribeUrl: string;
}) {
  return {
    from: FROM,
    to: input.to,
    subject: input.subject,
    html: buildNewsletterHtml(input.bodyHtml, input.instructorName, input.unsubscribeUrl),
    text: buildNewsletterText(input.bodyHtml, input.instructorName, input.unsubscribeUrl),
  };
}

const BATCH_CHUNK_SIZE = 100;

// No queue/job runner in this stack — sending happens synchronously inside
// the server action that calls this. Fine for lists up to a few hundred
// subscribers; larger lists should move to a cron-batch pattern (like
// /api/cron/release-expired-reservations processes N rows per tick).
export async function sendNewsletterBatch(
  emails: { from: string; to: string; subject: string; html: string; text: string }[],
): Promise<{ sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;

  for (let i = 0; i < emails.length; i += BATCH_CHUNK_SIZE) {
    const chunk = emails.slice(i, i + BATCH_CHUNK_SIZE);

    if (process.env["NODE_ENV"] !== "production") {
      console.log(`[email] newsletter batch of ${chunk.length}`);
    }

    const { data, error } = await resend.batch.send(chunk);
    if (error) {
      failed += chunk.length;
    } else {
      sent += data.data.length;
      failed += chunk.length - data.data.length;
    }

    if (i + BATCH_CHUNK_SIZE < emails.length) {
      await new Promise((resolve) => setTimeout(resolve, 600));
    }
  }

  return { sent, failed };
}

export async function sendClassReminderEmail(
  input: {
    to: string;
    studentName: string;
    className: string;
    location: string | null;
  } & ClassTiming,
) {
  const when = whenLine(input);
  await sendEmail({
    to: input.to,
    subject: `Reminder: ${input.className} is coming up`,
    text: `Hi ${input.studentName},\n\nJust a reminder — you're booked for ${input.className} on ${when}${input.location ? ` at ${input.location}` : ""}.`,
    html: `<p>Hi ${input.studentName},</p><p>Just a reminder — you're booked for <strong>${input.className}</strong> on ${when}${input.location ? ` at ${input.location}` : ""}.</p>`,
  });
}
