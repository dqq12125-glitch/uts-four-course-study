import type { ExtractedClassSession } from "../ai/types.ts";

export interface TimetableTextExtraction {
  classSessions: ExtractedClassSession[];
  warnings: string[];
}

const ENGLISH_DAYS: Array<[RegExp, number]> = [
  [/\b(?:sun(?:day)?)\b/i, 0],
  [/\b(?:mon(?:day)?)\b/i, 1],
  [/\b(?:tue(?:s|sday)?)\b/i, 2],
  [/\b(?:wed(?:nesday)?)\b/i, 3],
  [/\b(?:thu(?:r|rs|rsday)?)\b/i, 4],
  [/\b(?:fri(?:day)?)\b/i, 5],
  [/\b(?:sat(?:urday)?)\b/i, 6],
];

const CHINESE_DAYS: Record<string, number> = {
  日: 0,
  天: 0,
  一: 1,
  二: 2,
  三: 3,
  四: 4,
  五: 5,
  六: 6,
};

const TIME_RANGE =
  /(?:^|[\s|,;])(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s*(?:-|–|—|−|to|至|到)\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?(?:\b|(?=\s|[|,;]))/i;

const SESSION_PATTERN =
  /\b(lecture|lec|tutorial|tute|tut|workshop|lab(?:oratory)?|practical|seminar|class)\b|讲座|讲课|辅导课?|教程|工作坊|实验课?|实践课?|课堂/i;

function dayOfWeek(line: string): number | null {
  const chinese = /(?:周|星期)([日天一二三四五六])/.exec(line);
  if (chinese?.[1]) return CHINESE_DAYS[chinese[1]] ?? null;
  for (const [pattern, day] of ENGLISH_DAYS) {
    if (pattern.test(line)) return day;
  }
  return null;
}

function clockTime(
  hourValue: string,
  minuteValue: string | undefined,
  periodValue: string | undefined,
): string | null {
  let hour = Number(hourValue);
  const minute = Number(minuteValue ?? "0");
  const period = periodValue?.toLowerCase();
  if (!Number.isInteger(hour) || !Number.isInteger(minute) || minute > 59) {
    return null;
  }
  if (period) {
    if (hour < 1 || hour > 12) return null;
    if (period === "am") hour = hour === 12 ? 0 : hour;
    if (period === "pm") hour = hour === 12 ? 12 : hour + 12;
  } else if (hour > 23) {
    return null;
  }
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function timeRange(line: string): {
  startTime: string;
  endTime: string;
  matched: string;
} | null {
  const match = TIME_RANGE.exec(` ${line}`);
  if (!match) return null;
  let startPeriod = match[3];
  const endPeriod = match[6];
  if (!startPeriod && endPeriod) {
    const startHour = Number(match[1]);
    const endHour = Number(match[4]);
    startPeriod =
      endPeriod.toLowerCase() === "pm" && startHour > endHour
        ? "am"
        : endPeriod;
  }
  const startTime = clockTime(match[1] ?? "", match[2], startPeriod);
  const endTime = clockTime(match[4] ?? "", match[5], endPeriod);
  if (!startTime || !endTime || endTime <= startTime) return null;
  return {
    startTime,
    endTime,
    matched: match[0].trim(),
  };
}

function sessionType(
  line: string,
): ExtractedClassSession["sessionType"] {
  if (/lecture|\blec\b|讲座|讲课/i.test(line)) return "lecture";
  if (/tutorial|\btute?\b|\btut\b|辅导|教程/i.test(line)) {
    return "tutorial";
  }
  if (/workshop|工作坊/i.test(line)) return "workshop";
  if (/lab(?:oratory)?|实验/i.test(line)) return "lab";
  if (/practical|实践/i.test(line)) return "practical";
  return "other";
}

function normaliseDate(
  year: string,
  month: string,
  day: string,
): string | null {
  const candidate = new Date(
    Date.UTC(Number(year), Number(month) - 1, Number(day)),
  );
  if (
    candidate.getUTCFullYear() !== Number(year) ||
    candidate.getUTCMonth() !== Number(month) - 1 ||
    candidate.getUTCDate() !== Number(day)
  ) {
    return null;
  }
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function datesInLine(line: string): string[] {
  const dates: string[] = [];
  for (const match of line.matchAll(/\b(\d{4})-(\d{1,2})-(\d{1,2})\b/g)) {
    const date = normaliseDate(match[1] ?? "", match[2] ?? "", match[3] ?? "");
    if (date) dates.push(date);
  }
  for (const match of line.matchAll(/\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/g)) {
    const date = normaliseDate(match[3] ?? "", match[2] ?? "", match[1] ?? "");
    if (date) dates.push(date);
  }
  return [...new Set(dates)].slice(0, 2);
}

function mapUrl(line: string): string | null {
  const value = /https?:\/\/[^\s<>"']+/i.exec(line)?.[0];
  if (!value) return null;
  try {
    const url = new URL(value.replace(/[),.;]+$/g, ""));
    return url.toString().slice(0, 500);
  } catch {
    return null;
  }
}

function location(line: string): string | null {
  const labelled =
    /(?:room|location|building|campus|教室|地点|校区)\s*[:：-]?\s*([^|;]{1,100})/i.exec(
      line,
    )?.[1];
  if (labelled) return labelled.trim().slice(0, 160);
  const segments = line
    .split(/[|;]/)
    .map((segment) => segment.trim())
    .filter(Boolean);
  const likely = segments.find((segment) =>
    /\b(?:room|building|campus|online|zoom|teams|CB\d|BLD)\b|教室|校区|线上/i.test(
      segment,
    ),
  );
  return likely?.slice(0, 160) ?? null;
}

function title(line: string, type: ExtractedClassSession["sessionType"]): string {
  const explicit = SESSION_PATTERN.exec(line)?.[0]?.trim();
  if (explicit) return explicit.slice(0, 120);
  const typeTitle: Record<ExtractedClassSession["sessionType"], string> = {
    lecture: "Lecture",
    tutorial: "Tutorial",
    workshop: "Workshop",
    lab: "Lab",
    practical: "Practical",
    other: "Class",
  };
  return typeTitle[type];
}

function stableTextUid(session: ExtractedClassSession): string {
  return [
    "text",
    session.dayOfWeek,
    session.startTime,
    session.endTime,
    session.title.trim().toLocaleLowerCase(),
  ]
    .join(":")
    .slice(0, 240);
}

export function extractTimetableText(
  text: string,
): TimetableTextExtraction {
  const sessions = new Map<string, ExtractedClassSession>();
  const warnings: string[] = [];
  const lines = text
    .replace(/\u00a0/g, " ")
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .slice(0, 5_000);

  let timetableLikeLines = 0;
  for (const line of lines) {
    const day = dayOfWeek(line);
    const range = timeRange(line);
    if (day === null && !range) continue;
    timetableLikeLines += 1;
    if (day === null || !range) continue;
    const type = sessionType(line);
    const dates = datesInLine(line);
    const session: ExtractedClassSession = {
      sessionType: type,
      title: title(line, type),
      dayOfWeek: day,
      startTime: range.startTime,
      endTime: range.endTime,
      location: location(line),
      mapUrl: mapUrl(line),
      startDate: dates[0] ?? null,
      endDate: dates[1] ?? dates[0] ?? null,
      recurrenceRule: /fortnight|biweekly|every\s+2\s+weeks|隔周|双周/i.test(
        line,
      )
        ? "RRULE:FREQ=WEEKLY;INTERVAL=2"
        : "RRULE:FREQ=WEEKLY",
      sourceUid: null,
    };
    session.sourceUid = stableTextUid(session);
    sessions.set(session.sourceUid, session);
    if (sessions.size >= 40) break;
  }

  if (timetableLikeLines > 0 && sessions.size === 0) {
    warnings.push(
      "Some timetable-like lines were found, but their weekday or time range could not be read. Check the original text.",
    );
  }
  if (sessions.size >= 40) {
    warnings.push(
      "Only the first 40 timetable items were proposed. Split larger timetables by course before importing.",
    );
  }
  return { classSessions: [...sessions.values()], warnings };
}
