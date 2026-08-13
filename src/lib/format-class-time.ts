type TimedClass = { startAt: Date; timezone: string };

export function formatClassDate(cls: TimedClass, style: "short" | "long" = "short") {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: cls.timezone,
    weekday: style,
    month: "short",
    day: "numeric",
  }).format(cls.startAt);
}

export function formatClassTime(cls: TimedClass) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: cls.timezone,
    hour: "numeric",
    minute: "2-digit",
  }).format(cls.startAt);
}
