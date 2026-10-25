import { Resend } from "resend";
import { formatClassDate, formatClassTime } from "@/lib/format-class-time";
import { supportEmail } from "@/lib/site";
import { emailButton, emailLayout, newsletterLayout } from "@/lib/email-layout";
import type { CurrencyCode } from "@/generated/prisma/enums";

// Same symbols as src/lib/demo.ts's `money` — duplicated rather than
// imported since that module pulls in demo image assets not meant for a
// server-only context like this one.
const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  NGN: "₦",
  USD: "$",
  GBP: "£",
  EUR: "€",
  ZAR: "R",
  KES: "KSh",
  GHS: "₵",
  XOF: "CFA",
};

function money(amount: number, currency: CurrencyCode): string {
  return `${CURRENCY_SYMBOLS[currency]}${amount.toLocaleString("en-US")}`;
}

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

export async function sendFeedbackNotificationEmail(input: {
  instructorName: string;
  instructorEmail: string;
  message: string;
}) {
  await sendEmail({
    to: supportEmail,
    subject: `Dashboard feedback: ${input.instructorName}`,
    text: `From: ${input.instructorName} <${input.instructorEmail}>\n\n${input.message}`,
    html: `<p>From: ${input.instructorName} &lt;${input.instructorEmail}&gt;</p><p>${input.message.replace(/\n/g, "<br>")}</p>`,
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

    try {
      const { data, error } = await resend.batch.send(chunk);
      if (error) {
        failed += chunk.length;
      } else {
        sent += data.data.length;
        failed += chunk.length - data.data.length;
      }
    } catch (err) {
      // A thrown error (network blip, timeout) is just as possible as a
      // structured {error} response — without this, one bad chunk aborts
      // the whole send and loses the sent/failed count for every chunk
      // already delivered before it.
      console.error("Newsletter batch chunk failed to send:", err);
      failed += chunk.length;
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
  instructorEmail: string;
  offerTitle: string;
  meetingLink: string;
  // Null for a free call — paid rows always carry both or neither.
  amount: number | null;
  currency: CurrencyCode | null;
}) {
  const paidLine =
    input.amount && input.currency
      ? `We've received your payment of ${money(input.amount, input.currency)}.`
      : "This is a free call — no payment needed.";

  await sendBrandedEmail({
    to: input.to,
    subject: `You're booked: ${input.offerTitle}`,
    heading: "You're booked!",
    text: `Hi ${input.studentName},\n\nYou're confirmed for "${input.offerTitle}", a 1:1 video call with ${input.instructorName}. ${paidLine}\n\nThis link isn't a live meeting room yet — it's where you'll pick a time that works for both of you. ${input.instructorName} will confirm the exact time with you directly.\n\nPick a time: ${input.meetingLink}\n\nQuestions about your booking? Reach ${input.instructorName} directly at ${input.instructorEmail}.`,
    bodyHtml: `<p>Hi ${input.studentName},</p><p>You're confirmed for <strong>${input.offerTitle}</strong>, a 1:1 video call with ${input.instructorName}. ${paidLine}</p><p>This link isn't a live meeting room yet — it's where you'll pick a time that works for both of you. ${input.instructorName} will confirm the exact time with you directly.</p><p>${emailButton("Pick a time", input.meetingLink)}</p><p style="font-size:13px;color:#8a8171;">Questions about your booking? Reach ${input.instructorName} directly at <a href="mailto:${input.instructorEmail}" style="color:#8a8171;">${input.instructorEmail}</a>.</p>`,
  });
}

export async function sendInstructorNewVideoCallBookingEmail(input: {
  to: string;
  studentName: string;
  studentEmail: string;
  offerTitle: string;
  amount: number | null;
  currency: CurrencyCode | null;
}) {
  const paidLine =
    input.amount && input.currency ? `and paid ${money(input.amount, input.currency)}` : "(free)";

  await sendBrandedEmail({
    to: input.to,
    subject: `New video call booking: ${input.studentName}`,
    heading: "New booking",
    text: `${input.studentName} (${input.studentEmail}) just booked "${input.offerTitle}" ${paidLine}.\n\nReach out to ${input.studentEmail} to confirm a time that works for both of you.`,
    bodyHtml: `<p><strong>${input.studentName}</strong> (<a href="mailto:${input.studentEmail}" style="color:#2e2a24;">${input.studentEmail}</a>) just booked <strong>${input.offerTitle}</strong> ${paidLine}.</p><p>Reach out to them directly to confirm a time that works for both of you.</p>`,
  });
}

export async function sendEbookPurchaseEmail(input: {
  to: string;
  buyerName: string;
  instructorName: string;
  instructorEmail: string;
  offerTitle: string;
  downloadUrl: string;
  // 0 for a free ebook — paid rows always carry a positive amount.
  amount: number;
  currency: CurrencyCode;
}) {
  const paidLine =
    input.amount > 0
      ? `We've received your payment of ${money(input.amount, input.currency)}.`
      : "This one's free — no payment needed.";

  await sendBrandedEmail({
    to: input.to,
    subject: `Your download: ${input.offerTitle}`,
    heading: "It's yours!",
    text: `Hi ${input.buyerName},\n\nThanks for getting "${input.offerTitle}" from ${input.instructorName}. ${paidLine}\n\nDownload it here: ${input.downloadUrl}\n\nQuestions? Reach ${input.instructorName} directly at ${input.instructorEmail}.`,
    bodyHtml: `<p>Hi ${input.buyerName},</p><p>Thanks for getting <strong>${input.offerTitle}</strong> from ${input.instructorName}. ${paidLine}</p><p>${emailButton("Download now", input.downloadUrl)}</p><p style="font-size:13px;color:#8a8171;">Questions? Reach ${input.instructorName} directly at <a href="mailto:${input.instructorEmail}" style="color:#8a8171;">${input.instructorEmail}</a>.</p>`,
  });
}

export async function sendInstructorNewEbookSaleEmail(input: {
  to: string;
  buyerName: string;
  buyerEmail: string;
  offerTitle: string;
  amount: number;
  currency: CurrencyCode;
}) {
  const paidLine = input.amount > 0 ? `and paid ${money(input.amount, input.currency)}` : "(free)";

  await sendBrandedEmail({
    to: input.to,
    subject: `New ebook sale: ${input.buyerName}`,
    heading: "New sale",
    text: `${input.buyerName} (${input.buyerEmail}) just got "${input.offerTitle}" ${paidLine}.`,
    bodyHtml: `<p><strong>${input.buyerName}</strong> (<a href="mailto:${input.buyerEmail}" style="color:#2e2a24;">${input.buyerEmail}</a>) just got <strong>${input.offerTitle}</strong> ${paidLine}.</p>`,
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
