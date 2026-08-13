// ClassForm shows a friendly select; the DB stores structured minutes so
// booking-deadline enforcement (a later batch) can do plain arithmetic
// against a class's startAt.
export const DEADLINE_OPTIONS = [
  { label: "2 hours before start", minutes: 120 },
  { label: "1 hour before start", minutes: 60 },
  { label: "24 hours before start", minutes: 1440 },
  { label: "Until class starts", minutes: 0 },
] as const;

export function deadlineLabelToMinutes(label: string): number {
  return DEADLINE_OPTIONS.find((o) => o.label === label)?.minutes ?? 120;
}

export function deadlineMinutesToLabel(minutes: number): string {
  return (
    DEADLINE_OPTIONS.find((o) => o.minutes === minutes)?.label ?? `${minutes} minutes before start`
  );
}
