import type {
  ExtractedAssessment,
  ExtractedClassSession,
} from "../ai/types.ts";
import {
  isValidTimeZone,
  zonedDateTimeToUtc,
} from "../../lib/timezone.ts";

export interface IcsExtraction {
  assessments: ExtractedAssessment[];
  classSessions: ExtractedClassSession[];
  topics: string[];
  warnings: string[];
}

interface CalendarProperty {
  value: string;
  parameters: Record<string, string>;
}

interface CalendarEvent {
  uid: string | null;
  summary: string;
  location: string | null;
  description: string | null;
  url: string | null;
  start: CalendarProperty;
  end: CalendarProperty | null;
  duration: string | null;
  rrule: string | null;
  recurrenceId: string | null;
  status: string | null;
}

interface LocalParts {
  date: string;
  time: string;
  dayOfWeek: number;
  allDay: boolean;
  instant: Date | null;
}

const DAY_CODES: Record<string, number> = {
  SU: 0,
  MO: 1,
  TU: 2,
  WE: 3,
  TH: 4,
  FR: 5,
  SA: 6,
};

function unescapeIcs(value: string): string {
  return value
    .replace(/\\n/gi, "\n")
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .replace(/\\\\/g, "\\")
    .trim();
}

function calendarValue(line: string): {
  name: string;
  property: CalendarProperty;
} | null {
  const separator = line.indexOf(":");
  if (separator < 1) return null;
  const left = line.slice(0, separator);
  const [rawName = "", ...rawParameters] = left.split(";");
  const parameters: Record<string, string> = {};
  for (const parameter of rawParameters) {
    const equals = parameter.indexOf("=");
    if (equals < 1) continue;
    const key = parameter.slice(0, equals).trim().toUpperCase();
    const value = parameter
      .slice(equals + 1)
      .trim()
      .replace(/^"|"$/g, "");
    if (key && value) parameters[key] = value;
  }
  return {
    name: rawName.toUpperCase(),
    property: {
      parameters,
      value: line.slice(separator + 1),
    },
  };
}

function formattedInstant(instant: Date, timezone: string): LocalParts {
  const pieces = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      weekday: "short",
      hourCycle: "h23",
    })
      .formatToParts(instant)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );
  return {
    date: `${pieces.year}-${pieces.month}-${pieces.day}`,
    time: `${pieces.hour}:${pieces.minute}`,
    dayOfWeek: [
      "Sun",
      "Mon",
      "Tue",
      "Wed",
      "Thu",
      "Fri",
      "Sat",
    ].indexOf(pieces.weekday ?? ""),
    allDay: false,
    instant,
  };
}

function localParts(
  property: CalendarProperty,
  targetTimezone: string,
  warnings: string[],
): LocalParts | null {
  const compact =
    /^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?(Z)?)?$/.exec(
      property.value.trim(),
    );
  if (!compact) return null;
  const [, year, month, day, hour, minute, second, utc] = compact;
  if (
    !hour ||
    !minute ||
    property.parameters.VALUE?.toUpperCase() === "DATE"
  ) {
    return {
      date: `${year}-${month}-${day}`,
      time: "23:59",
      dayOfWeek: new Date(
        Date.UTC(Number(year), Number(month) - 1, Number(day)),
      ).getUTCDay(),
      allDay: true,
      instant: null,
    };
  }
  try {
    const instant = utc
      ? new Date(
          Date.UTC(
            Number(year),
            Number(month) - 1,
            Number(day),
            Number(hour),
            Number(minute),
            Number(second ?? 0),
          ),
        )
      : zonedDateTimeToUtc(
          `${year}-${month}-${day}T${hour}:${minute}:${second ?? "00"}`,
          property.parameters.TZID &&
            isValidTimeZone(property.parameters.TZID)
            ? property.parameters.TZID
            : targetTimezone,
        );
    if (
      property.parameters.TZID &&
      !isValidTimeZone(property.parameters.TZID)
    ) {
      warnings.push(
        `Calendar timezone "${property.parameters.TZID}" was not recognised; ${targetTimezone} was used.`,
      );
    }
    return formattedInstant(instant, targetTimezone);
  } catch {
    warnings.push(
      `A calendar date-time could not be converted safely: ${property.value.slice(0, 32)}.`,
    );
    return null;
  }
}

function durationMinutes(value: string | null): number | null {
  if (!value) return null;
  const match =
    /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/i.exec(value);
  if (!match) return null;
  return (
    Number(match[1] ?? 0) * 24 * 60 +
    Number(match[2] ?? 0) * 60 +
    Number(match[3] ?? 0) +
    Math.ceil(Number(match[4] ?? 0) / 60)
  );
}

function addMinutes(
  parts: LocalParts,
  minutes: number,
  timezone: string,
): LocalParts {
  if (parts.instant) {
    return formattedInstant(
      new Date(parts.instant.getTime() + minutes * 60_000),
      timezone,
    );
  }
  const [hour = 0, minute = 0] = parts.time.split(":").map(Number);
  const total = hour * 60 + minute + minutes;
  return {
    ...parts,
    time: `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(
      total % 60,
    ).padStart(2, "0")}`,
  };
}

function sessionType(
  summary: string,
): ExtractedClassSession["sessionType"] {
  if (/lecture|\blec\b|讲座|讲课/i.test(summary)) return "lecture";
  if (/tutorial|\btut\b|辅导|教程/i.test(summary)) return "tutorial";
  if (/workshop|工作坊/i.test(summary)) return "workshop";
  if (/lab(?:oratory)?|实验/i.test(summary)) return "lab";
  if (/practical|实践/i.test(summary)) return "practical";
  return "other";
}

function assessmentType(
  summary: string,
): ExtractedAssessment["assessmentType"] {
  if (/quiz|测验/i.test(summary)) return "quiz";
  if (/assignment|作业/i.test(summary)) return "assignment";
  if (/skills?\s*test|技能测试/i.test(summary)) return "skills_test";
  if (/exam|考试/i.test(summary)) return "exam";
  if (/lab|实验/i.test(summary)) return "lab";
  if (/project|项目/i.test(summary)) return "project";
  if (/presentation|演讲|展示/i.test(summary)) return "presentation";
  return "other";
}

function ruleParts(rule: string | null): Record<string, string> {
  if (!rule) return {};
  return Object.fromEntries(
    rule
      .split(";")
      .flatMap((part) => {
        const equals = part.indexOf("=");
        return equals < 1
          ? []
          : [[
              part.slice(0, equals).toUpperCase(),
              part.slice(equals + 1),
            ]];
      }),
  );
}

function recurrenceDays(
  event: CalendarEvent,
  start: LocalParts,
): Array<{ code: string; dayOfWeek: number }> {
  const byDay = ruleParts(event.rrule).BYDAY;
  if (!byDay) {
    return [
      {
        code: Object.entries(DAY_CODES).find(
          ([, value]) => value === start.dayOfWeek,
        )?.[0] ?? String(start.dayOfWeek),
        dayOfWeek: start.dayOfWeek,
      },
    ];
  }
  const days = byDay
    .split(",")
    .map((value) => value.toUpperCase().replace(/^[+-]?\d+/, ""))
    .flatMap((code) =>
      DAY_CODES[code] === undefined
        ? []
        : [{ code, dayOfWeek: DAY_CODES[code] }],
    );
  return days.length
    ? days
    : [{ code: String(start.dayOfWeek), dayOfWeek: start.dayOfWeek }];
}

function recurrenceEndDate(
  event: CalendarEvent,
  timezone: string,
  warnings: string[],
): string | null {
  const until = ruleParts(event.rrule).UNTIL;
  if (!until) return null;
  return localParts(
    {
      value: until,
      parameters: {
        ...(event.start.parameters.TZID
          ? { TZID: event.start.parameters.TZID }
          : {}),
      },
    },
    timezone,
    warnings,
  )?.date ?? null;
}

function safeUrl(value: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(unescapeIcs(value));
    return ["http:", "https:"].includes(url.protocol)
      ? url.toString().slice(0, 500)
      : null;
  } catch {
    return null;
  }
}

function sourceUid(event: CalendarEvent, suffix = ""): string | null {
  if (!event.uid) return null;
  return [event.uid, event.recurrenceId, suffix]
    .filter(Boolean)
    .join("#")
    .slice(0, 240);
}

export function parseIcs(raw: string, timezone: string): IcsExtraction {
  const warnings: string[] = [];
  const lines = raw
    .replace(/^\uFEFF/, "")
    .replace(/\r?\n[ \t]/g, "")
    .split(/\r?\n/);
  const events: CalendarEvent[] = [];
  let current: Record<string, CalendarProperty> | null = null;
  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    if (line.toUpperCase() === "BEGIN:VEVENT") {
      current = {};
      continue;
    }
    if (line.toUpperCase() === "END:VEVENT") {
      if (current?.SUMMARY && current.DTSTART && events.length < 500) {
        events.push({
          uid: current.UID?.value ? unescapeIcs(current.UID.value) : null,
          summary: unescapeIcs(current.SUMMARY.value).slice(0, 160),
          location: current.LOCATION?.value
            ? unescapeIcs(current.LOCATION.value).slice(0, 160)
            : null,
          description: current.DESCRIPTION?.value
            ? unescapeIcs(current.DESCRIPTION.value).slice(0, 1_000)
            : null,
          url: current.URL?.value ?? null,
          start: current.DTSTART,
          end: current.DTEND ?? null,
          duration: current.DURATION?.value ?? null,
          rrule: current.RRULE?.value ?? null,
          recurrenceId: current["RECURRENCE-ID"]?.value ?? null,
          status: current.STATUS?.value?.toUpperCase() ?? null,
        });
      }
      current = null;
      continue;
    }
    if (!current) continue;
    const parsed = calendarValue(line);
    if (!parsed) continue;
    if (
      [
        "UID",
        "SUMMARY",
        "LOCATION",
        "DESCRIPTION",
        "URL",
        "DTSTART",
        "DTEND",
        "DURATION",
        "RRULE",
        "RECURRENCE-ID",
        "STATUS",
      ].includes(parsed.name)
    ) {
      current[parsed.name] = parsed.property;
    }
  }
  if (events.length >= 500) {
    warnings.push(
      "Only the first 500 calendar events were inspected. Import one course calendar at a time.",
    );
  }

  const assessments = new Map<string, ExtractedAssessment>();
  const classSessions = new Map<string, ExtractedClassSession>();
  for (const event of events) {
    if (event.status === "CANCELLED") continue;
    const start = localParts(event.start, timezone, warnings);
    if (!start) continue;
    const end =
      (event.end ? localParts(event.end, timezone, warnings) : null) ??
      addMinutes(start, durationMinutes(event.duration) ?? 60, timezone);
    const recurring = Boolean(event.rrule);
    const looksAssessed =
      start.allDay ||
      (/\b(due|deadline|assignment|quiz|exam|submission|assessment)\b|截止|作业|测验|考试|提交|评估/i.test(
        event.summary,
      ) &&
        !recurring);

    if (looksAssessed) {
      const assessment: ExtractedAssessment = {
        title: event.summary,
        assessmentType: assessmentType(event.summary),
        dueLocal: `${start.date}T${start.time}`,
        weightPercent: null,
        estimatedMinutes: null,
        notes:
          [event.location, event.description].filter(Boolean).join("\n") ||
          null,
        sourceUid: sourceUid(event),
      };
      const key =
        assessment.sourceUid ??
        `${assessment.title.toLocaleLowerCase()}|${assessment.dueLocal}`;
      assessments.set(key, assessment);
      continue;
    }

    if (start.allDay) continue;
    if (end.date !== start.date && end.time <= start.time) {
      warnings.push(
        `"${event.summary}" crosses midnight and was not proposed as a weekly class. Add it manually if needed.`,
      );
      continue;
    }
    const days = recurrenceDays(event, start);
    for (const day of days) {
      const session: ExtractedClassSession = {
        sessionType: sessionType(event.summary),
        title: event.summary.slice(0, 120),
        dayOfWeek: day.dayOfWeek,
        startTime: start.time,
        endTime: end.time,
        location: event.location,
        mapUrl: safeUrl(event.url),
        startDate: start.date,
        endDate: recurring
          ? recurrenceEndDate(event, timezone, warnings)
          : start.date,
        recurrenceRule: event.rrule
          ? `RRULE:${event.rrule.slice(0, 490)}`
          : null,
        sourceUid: sourceUid(event, days.length > 1 ? day.code : ""),
      };
      const key =
        session.sourceUid ??
        [
          session.title.toLocaleLowerCase(),
          session.dayOfWeek,
          session.startTime,
          session.endTime,
        ].join("|");
      classSessions.set(key, session);
      if (classSessions.size >= 40) break;
    }
    if (classSessions.size >= 40) break;
  }
  if (classSessions.size >= 40) {
    warnings.push(
      "Only the first 40 timetable items were proposed. Import one course calendar at a time.",
    );
  }
  return {
    assessments: [...assessments.values()].slice(0, 40),
    classSessions: [...classSessions.values()].slice(0, 40),
    topics: [],
    warnings: [...new Set(warnings)].slice(0, 20),
  };
}
