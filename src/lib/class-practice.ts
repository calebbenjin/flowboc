export const CLASS_PRACTICES = [
  {
    name: "Morning Flow",
    type: "Vinyasa",
    description:
      "An energising practice with mindful movement and steady breath. Move at your own pace and leave with a little more space for the day.",
    durationMinutes: 60,
  },
  {
    name: "Slow Down & Restore",
    type: "Restorative",
    description:
      "A gentle practice with supported poses and unhurried breathing. Make time to settle, soften, and rest.",
    durationMinutes: 60,
  },
  {
    name: "A Gentle Beginning",
    type: "Beginners",
    description:
      "Explore foundational poses, comfortable movement, and simple breathwork. A welcoming place to begin, with options for your own pace.",
    durationMinutes: 45,
  },
] as const;

// Use the teacher's calendar day, rather than the browser or server timezone.
export function suggestedClassDate(timezone: string, daysAhead: number, now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const value = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  const day = new Date(Date.UTC(value("year"), value("month") - 1, value("day") + daysAhead));
  return day.toISOString().slice(0, 10);
}
