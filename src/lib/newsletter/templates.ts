export const MAX_CAMPAIGN_CLASSES = 6;

export const newsletterTemplates = [
  {
    id: "weekly",
    name: "This week’s classes",
    description: "Share your schedule and invite students to book.",
    subject: "Your classes for the week ahead",
    bodyHtml:
      "<p>Hi everyone,</p><p>Here’s what’s coming up this week. Choose a class below and book a time that works for you.</p><p>I look forward to seeing you on the mat.</p>",
  },
  {
    id: "workshop",
    name: "Workshop announcement",
    description: "Introduce a special session and open bookings.",
    subject: "You’re invited: a new workshop",
    bodyHtml:
      "<p>Hi everyone,</p><p>I’m hosting a new workshop and would love for you to join.</p><p>We’ll explore a focused practice together, with time to learn and ask questions. Add your workshop details here, then include its class card below.</p><p>Book your place below.</p>",
  },
  {
    id: "update",
    name: "Studio update",
    description: "Keep your community informed and connected.",
    subject: "A little update from the studio",
    bodyHtml:
      "<p>Hi everyone,</p><p>I have a few updates to share with you.</p><p>Add your studio news, schedule changes, or a practice tip here.</p><p>Thank you for being part of this community.</p>",
  },
] as const;
