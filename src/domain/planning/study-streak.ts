import { localDateKey } from "../../lib/timezone.ts";

function addDays(value: string, days: number): string {
  const date = new Date(`${value}T12:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function calculateStudyStreak(input: {
  activityInstants: string[];
  timezone: string;
  now: Date;
}): number {
  const activeDates = new Set(
    input.activityInstants
      .map((value) => new Date(value))
      .filter((value) => !Number.isNaN(value.getTime()))
      .map((value) => localDateKey(value, input.timezone)),
  );
  const today = localDateKey(input.now, input.timezone);
  let cursor = activeDates.has(today) ? today : addDays(today, -1);
  let streak = 0;
  while (activeDates.has(cursor) && streak < 366) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}
