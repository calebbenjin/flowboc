function toGoogleDate(date: Date): string {
  return `${date.toISOString().replace(/[-:]/g, "").split(".")[0]}Z`;
}

export function googleCalendarUrl(input: {
  title: string;
  startAt: Date;
  durationMinutes: number;
  location?: string | null;
  details?: string;
}): string {
  const endAt = new Date(input.startAt.getTime() + input.durationMinutes * 60_000);
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: input.title,
    dates: `${toGoogleDate(input.startAt)}/${toGoogleDate(endAt)}`,
  });
  if (input.location) params.set("location", input.location);
  if (input.details) params.set("details", input.details);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
