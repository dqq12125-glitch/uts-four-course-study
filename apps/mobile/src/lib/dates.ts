export function dateOnlyOffset(
  date: Date,
  offsetDays: number,
): string {
  const value = new Date(date);
  value.setUTCDate(value.getUTCDate() + offsetDays);
  return value.toISOString().slice(0, 10);
}

export function defaultSemesterDates(now = new Date()): {
  startDate: string;
  endDate: string;
} {
  return {
    startDate: dateOnlyOffset(now, 0),
    endDate: dateOnlyOffset(now, 126),
  };
}

export function formatReviewTime(
  value: string | null,
  locale: string,
  timezone: string,
): string {
  if (!value) return locale === "zh-CN" ? "等待首次练习" : "No review yet";
  return new Intl.DateTimeFormat(locale, {
    timeZone: timezone,
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function focusSecondsRemaining(input: {
  startedAt: string;
  plannedMinutes: number;
}, now = Date.now()): number {
  const target =
    Date.parse(input.startedAt) + input.plannedMinutes * 60_000;
  return Math.max(0, Math.ceil((target - now) / 1_000));
}

export function formatClock(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
}
