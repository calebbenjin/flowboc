import { Resend } from "resend";
import { formatClassDate, formatClassTime } from "@/lib/format-class-time";
import { supportEmail } from "@/lib/site";
import { emailButton, emailLayout, newsletterLayout } from "@/lib/email-layout";

const resend = new Resend(process.env["RESEND_API_KEY"]);

// flowboc.com is verified with Resend, so this can deliver to any
// recipient — the shared onboarding@resend.dev sandbox sender (used before
// verification) could only deliver to the address on the Resend account.
const FROM = "Flowboc <notifications@flowboc.com>";

const TEXT_FOOTER = `\n\n—\nFlowboc\n${supportEmail}`;

type ClassTiming = { startAt: Date; timezone: string };

function whenLine(cls: ClassTiming): string {
  return `${formatClassDate(cls, "long")} at ${formatClassTime(cls)}`;
}

async function dispatch(params: { to: string; subject: string; html: string; text: string }) {
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

// Raw send for internal/ops notifications that don't need the customer-facing
// branded layout (e.g. contact form alerts to the support inbox).
async function sendEmail(params: { to: string; subject: string; html: string; text: string }) {
  await dispatch(params);
}

// Branded send for every customer-facing automated email — wraps bodyHtml in
// the shared flowboc layout and appends a consistent text footer.
async function sendBrandedEmail(params: {
  to: string;
  subject: string;
  heading: string;
  bodyHtml: string;
  text: string;
}) {
  await dispatch({
    to: params.to,
    subject: params.subject,
    html: emailLayout({ heading: params.heading, bodyHtml: params.bodyHtml }),
    text: `${params.text}${TEXT_FOOTER}`,
  });
}

export async function sendOtpEmail(to: string, code: string) {
  await sendBrandedEmail({
    to,
    subject: "Your Flowboc verification code",
    heading: "Verify your email",
    text: `Your verification code is ${code}. It expires in 10 minutes.`,
    bodyHtml: `<p>Enter this code to verify your email:</p><p style="font-size:28px;font-weight:700;letter-spacing:0.1em;color:#2e2a24;margin:16px 0;">${code}</p><p>It expires in 10 minutes.</p>`,
  });
}

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  await sendBrandedEmail({
    to,
    subject: "Reset your Flowboc password",
    heading: "Reset your password",
    text: `Reset your password: ${resetUrl}\n\nThis link expires in 1 hour. If you didn't request this, you can ignore this email.`,
    bodyHtml: `<p>We received a request to reset your password.</p><p>${emailButton("Reset password", resetUrl)}</p><p>This link expires in 1 hour. If you didn't request this, you can ignore this email.</p>`,
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
  await sendBrandedEmail({
    to: input.to,
    subject: `You're booked: ${input.className}`,
    heading: "You're booked!",
    text: `Hi ${input.studentName},\n\nYou're booked for ${input.className} with ${input.instructorName} on ${when}${input.location ? ` at ${input.location}` : ""}.\n\nSee you there!`,
    bodyHtml: `<p>Hi ${input.studentName},</p><p>You're booked for <strong>${input.className}</strong> with ${input.instructorName} on ${when}${input.location ? ` at ${input.location}` : ""}.</p><p>See you there!</p>`,
  });
}

export async function sendInstructorNewBookingEmail(
  input: { to: string; studentName: string; className: string } & ClassTiming,
) {
  const when = whenLine(input);
  await sendBrandedEmail({
    to: input.to,
    subject: `New booking: ${input.studentName} for ${input.className}`,
    heading: "New booking",
    text: `${input.studentName} just booked ${input.className} on ${when}.`,
    bodyHtml: `<p><strong>${input.studentName}</strong> just booked <strong>${input.className}</strong> on ${when}.</p>`,
  });
}

export async function sendCapacityReachedEmail(
  input: { to: string; className: string; capacity: number } & ClassTiming,
) {
  const when = whenLine(input);
  await sendBrandedEmail({
    to: input.to,
    subject: `${input.className} is fully booked`,
    heading: "Class fully booked",
    text: `${input.className} on ${when} just hit its capacity of ${input.capacity}. New students will be offered the waitlist.`,
    bodyHtml: `<p><strong>${input.className}</strong> on ${when} just hit its capacity of ${input.capacity}. New students will be offered the waitlist.</p>`,
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
  await sendBrandedEmail({
    to: input.to,
    subject: `Cancelled: ${input.className}`,
    heading: "Booking cancelled",
    text: `Hi ${input.studentName},\n\nYour booking for ${input.className} with ${input.instructorName} on ${when} has been cancelled.`,
    bodyHtml: `<p>Hi ${input.studentName},</p><p>Your booking for <strong>${input.className}</strong> with ${input.instructorName} on ${when} has been cancelled.</p>`,
  });
}

export async function sendWaitlistSpotOpenEmail(
  input: { to: string; name: string; className: string; bookUrl: string } & ClassTiming,
) {
  const when = whenLine(input);
  await sendBrandedEmail({
    to: input.to,
    subject: `A spot opened up: ${input.className}`,
    heading: "A spot opened up!",
    text: `Hi ${input.name},\n\nA spot just opened up for ${input.className} on ${when}. Book it before it's gone: ${input.bookUrl}`,
    bodyHtml: `<p>Hi ${input.name},</p><p>A spot just opened up for <strong>${input.className}</strong> on ${when}.</p><p>${emailButton("Book your spot", input.bookUrl)}</p>`,
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
  return newsletterLayout({
    bodyHtml,
    footerHtml: `You're receiving this because you subscribed to updates from ${instructorName}. <a href="${unsubscribeUrl}" style="color:#8a8171;">Unsubscribe</a>`,
  });
}

function buildNewsletterText(bodyHtml: string, instructorName: string, unsubscribeUrl: string) {
  return `${stripHtml(bodyHtml)}\n\n—\nYou're receiving this because you subscribed to updates from ${instructorName} on Flowboc.\nUnsubscribe: ${unsubscribeUrl}`;
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

export async function sendVideoCallBookingEmail(input: {
  to: string;
  studentName: string;
  instructorName: string;
  offerTitle: string;
  meetingLink: string;
}) {
  await sendBrandedEmail({
    to: input.to,
    subject: `You're booked: ${input.offerTitle}`,
    heading: "You're booked!",
    text: `Hi ${input.studentName},\n\nYou're booked for "${input.offerTitle}" with ${input.instructorName}.\n\nJoin here: ${input.meetingLink}`,
    bodyHtml: `<p>Hi ${input.studentName},</p><p>You're booked for <strong>${input.offerTitle}</strong> with ${input.instructorName}.</p><p>${emailButton("Join the call", input.meetingLink)}</p>`,
  });
}

export async function sendInstructorNewVideoCallBookingEmail(input: {
  to: string;
  studentName: string;
  studentEmail: string;
  offerTitle: string;
}) {
  await sendBrandedEmail({
    to: input.to,
    subject: `New video call booking: ${input.studentName}`,
    heading: "New booking",
    text: `${input.studentName} (${input.studentEmail}) just booked "${input.offerTitle}".`,
    bodyHtml: `<p><strong>${input.studentName}</strong> (${input.studentEmail}) just booked <strong>${input.offerTitle}</strong>.</p>`,
  });
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
  await sendBrandedEmail({
    to: input.to,
    subject: `Reminder: ${input.className} is coming up`,
    heading: "See you soon",
    text: `Hi ${input.studentName},\n\nJust a reminder — you're booked for ${input.className} on ${when}${input.location ? ` at ${input.location}` : ""}.`,
    bodyHtml: `<p>Hi ${input.studentName},</p><p>Just a reminder — you're booked for <strong>${input.className}</strong> on ${when}${input.location ? ` at ${input.location}` : ""}.</p>`,
  });
}
