import { Resend } from "resend";
import { formatClassDate, formatClassTime } from "@/lib/format-class-time";
import { supportEmail } from "@/lib/site";

const resend = new Resend(process.env["RESEND_API_KEY"]);

// No verified sending domain yet — Resend's shared sandbox sender works
// without one, but can only deliver to the email address on the Resend
// account. Swap to a verified flowbuk.com address once that's set up.
const FROM = "Flowbuk <onboarding@resend.dev>";

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
