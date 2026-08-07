function dateParts(date: Date, timeZone: string): Record<string, number> {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  return Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, Number(part.value)]),
  );
}

export function localDateKey(date: Date, timeZone: string): string {
  const parts = dateParts(date, timeZone);
  return `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(
    parts.day,
  ).padStart(2, "0")}`;
}

export function localDayOfWeek(date: Date, timeZone: string): number {
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
  }).format(date);
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(
    weekday,
  );
}

export function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat("en", { timeZone }).format();
    return true;
  } catch {
    return false;
  }
}

export function zonedDateTimeToUtc(
  localDateTime: string,
  timeZone: string,
): Date {
  const match =
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(
      localDateTime,
    );
  if (!match || !isValidTimeZone(timeZone)) {
    throw new RangeError("Invalid local date-time or time zone.");
  }

  const wanted = {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
    hour: Number(match[4]),
    minute: Number(match[5]),
    second: Number(match[6] ?? 0),
  };
  const wallClockUtc = Date.UTC(
    wanted.year,
    wanted.month - 1,
    wanted.day,
    wanted.hour,
    wanted.minute,
    wanted.second,
  );
  let candidate = new Date(wallClockUtc);

  for (let attempt = 0; attempt < 4; attempt += 1) {
    const observed = dateParts(candidate, timeZone);
    const observedUtc = Date.UTC(
      observed.year,
      observed.month - 1,
      observed.day,
      observed.hour,
      observed.minute,
      observed.second,
    );
    const adjustment = wallClockUtc - observedUtc;
    if (adjustment === 0) break;
    candidate = new Date(candidate.getTime() + adjustment);
  }

  const finalParts = dateParts(candidate, timeZone);
  if (
    finalParts.year !== wanted.year ||
    finalParts.month !== wanted.month ||
    finalParts.day !== wanted.day ||
    finalParts.hour !== wanted.hour ||
    finalParts.minute !== wanted.minute
  ) {
    throw new RangeError(
      "The local time does not exist in the selected time zone.",
    );
  }

  return candidate;
}
