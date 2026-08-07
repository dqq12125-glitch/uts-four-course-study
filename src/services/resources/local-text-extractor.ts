import type { ExtractionResult } from "../ai/types.ts";
import { extractTimetableText } from "./timetable-text-parser.ts";

function normaliseDate(
  year: string,
  month: string,
  day: string,
  hour = "23",
  minute = "59",
): string | null {
  const date = new Date(
    Date.UTC(Number(year), Number(month) - 1, Number(day)),
  );
  if (
    date.getUTCFullYear() !== Number(year) ||
    date.getUTCMonth() !== Number(month) - 1 ||
    date.getUTCDate() !== Number(day)
  ) {
    return null;
  }
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}T${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`;
}

export function extractLocalCourseData(text: string): ExtractionResult {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 5_000);
  const courseCode =
    /(?:subject|course|课程)\s*(?:code|代码)?\s*[:：-]\s*([A-Z]{1,8}\s?\d{2,8})/i.exec(
      text,
    )?.[1]?.trim() ?? null;
  const courseName =
    /(?:subject|course|课程)\s*(?:name|名称)?\s*[:：-]\s*([^\n]{2,160})/i.exec(
      text,
    )?.[1]?.trim() ?? null;
  const topics = lines
    .flatMap((line) => {
      const match = /^(?:topic|week\s*\d+\s*topic|主题)\s*[:：-]\s*(.+)$/i.exec(
        line,
      );
      return match?.[1] ? [match[1].slice(0, 160)] : [];
    })
    .slice(0, 80);
  const assessments = lines
    .flatMap((line) => {
      if (
        !/\b(due|deadline|assignment|quiz|exam|submission)\b|截止|作业|测验|考试|提交/i.test(
          line,
        )
      ) {
        return [];
      }
      const iso =
        /(\d{4})-(\d{1,2})-(\d{1,2})(?:[ T](\d{1,2}):(\d{2}))?/.exec(
          line,
        );
      const slash =
        /(\d{1,2})\/(\d{1,2})\/(\d{4})(?:[ T](\d{1,2}):(\d{2}))?/.exec(
          line,
        );
      const dueLocal = iso
        ? normaliseDate(
            iso[1] ?? "",
            iso[2] ?? "",
            iso[3] ?? "",
            iso[4],
            iso[5],
          )
        : slash
          ? normaliseDate(
              slash[3] ?? "",
              slash[2] ?? "",
              slash[1] ?? "",
              slash[4],
              slash[5],
            )
          : null;
      if (!dueLocal) return [];
      const title = line
        .replace(iso?.[0] ?? slash?.[0] ?? "", "")
        .replace(/\b(due|deadline)\b|截止/gi, "")
        .replace(/[:：-]+$/g, "")
        .trim()
        .slice(0, 160);
      return [
        {
          title: title || "Imported assessment",
          assessmentType: /quiz|测验/i.test(line)
            ? ("quiz" as const)
            : /exam|考试/i.test(line)
              ? ("exam" as const)
              : /assignment|作业/i.test(line)
                ? ("assignment" as const)
                : ("other" as const),
          dueLocal,
          weightPercent: null,
          estimatedMinutes: null,
          notes: null,
        },
      ];
    })
    .slice(0, 40);
  const timetable = extractTimetableText(text);
  return {
    modelKey: "local-structured-extractor-v1",
    tokenInput: 0,
    tokenOutput: 0,
    estimatedCostMinorUsd: 0,
    institutionName: null,
    courseCode,
    courseName,
    assessments,
    classSessions: timetable.classSessions,
    topics: [...new Set(topics)],
    warnings: timetable.warnings,
  };
}
