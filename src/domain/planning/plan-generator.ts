import {
  calculateTaskPriority,
  priorityLabel,
} from "./task-priority.ts";
import { fitDailyCapacity } from "./daily-capacity.ts";
import { localDateKey } from "../../lib/timezone.ts";

export interface PlanCourse {
  id: string;
  courseCode: string | null;
  courseName: string;
}

export interface PlanAssessment {
  id: string;
  courseId: string;
  courseName: string;
  title: string;
  dueAt: string | null;
  weightPercent: number | null;
  estimatedMinutes: number | null;
}

export interface GeneratedStudyTask {
  courseId: string;
  assessmentId: string | null;
  title: string;
  description: string;
  completionCriteria: string;
  reason: string;
  taskType: "review" | "assessment";
  priority: "low" | "medium" | "high" | "critical";
  priorityScore: number;
  estimatedMinutes: number;
  scheduledFor: string;
  dueAt: string | null;
}

export interface GeneratedPlan {
  tasks: GeneratedStudyTask[];
  estimatedMinutes: number;
  overload: boolean;
}

export function generateDailyPlan(input: {
  courses: PlanCourse[];
  assessments: PlanAssessment[];
  dailyStudyMinutes: number;
  timezone: string;
  language: "zh-CN" | "en";
  now?: Date;
}): GeneratedPlan {
  const now = input.now ?? new Date();
  const scheduledFor = localDateKey(now, input.timezone);
  const isChinese = input.language === "zh-CN";
  const candidates: GeneratedStudyTask[] = [];

  for (const assessment of input.assessments) {
    const estimatedMinutes = Math.min(
      90,
      Math.max(15, assessment.estimatedMinutes ?? 30),
    );
    const breakdown = calculateTaskPriority({
      now,
      dueAt: assessment.dueAt ? new Date(assessment.dueAt) : null,
      weightPercent: assessment.weightPercent,
      estimatedMinutes,
    });
    const daysUntilDue = assessment.dueAt
      ? Math.ceil(
          (new Date(assessment.dueAt).getTime() - now.getTime()) / 86_400_000,
        )
      : null;
    const dueReason =
      daysUntilDue === null
        ? isChinese
          ? "这项评估尚未设置截止时间"
          : "This assessment has no due time yet"
        : daysUntilDue < 0
          ? isChinese
            ? "这项评估已经逾期，需要明确处理"
            : "This assessment is overdue and needs an explicit decision"
          : isChinese
            ? `距离截止还有 ${daysUntilDue} 天`
            : `It is due in ${daysUntilDue} day${daysUntilDue === 1 ? "" : "s"}`;

    candidates.push({
      courseId: assessment.courseId,
      assessmentId: assessment.id,
      title: isChinese
        ? `推进：${assessment.title}`
        : `Advance: ${assessment.title}`,
      description: isChinese
        ? `为 ${assessment.courseName} 完成一个明确、可检查的小步骤。`
        : `Complete one concrete, checkable step for ${assessment.courseName}.`,
      completionCriteria: isChinese
        ? "完成一个可独立检查的最小交付物，记录仍不确定的一点，并写下下一步。"
        : "Finish one independently checkable deliverable, record one uncertainty, and write down the next step.",
      reason:
        assessment.weightPercent !== null
          ? isChinese
            ? `${dueReason}；该评估占 ${assessment.weightPercent}%。`
            : `${dueReason}; it is worth ${assessment.weightPercent}%.`
          : `${dueReason}。`,
      taskType: "assessment",
      priority: priorityLabel(breakdown.total),
      priorityScore: breakdown.total,
      estimatedMinutes,
      scheduledFor,
      dueAt: assessment.dueAt,
    });
  }

  for (const course of input.courses) {
    const breakdown = calculateTaskPriority({
      now,
      dueAt: null,
      weightPercent: null,
      estimatedMinutes: 20,
      userPriority: 5,
    });
    const label = [course.courseCode, course.courseName]
      .filter(Boolean)
      .join(" · ");
    candidates.push({
      courseId: course.id,
      assessmentId: null,
      title: isChinese ? `建立 ${label} 的下一步` : `Set the next step for ${label}`,
      description: isChinese
        ? "快速确认当前主题、已有理解和下一个可执行动作。"
        : "Quickly identify the current topic, what you understand, and the next executable action.",
      completionCriteria: isChinese
        ? "不看资料写出 3 个关键概念，检查后修正，并完成 1 个最小练习或示例。"
        : "Write three key ideas from memory, correct them after checking, and complete one small practice item or example.",
      reason: isChinese
        ? "新课程需要先建立可执行的学习起点。"
        : "A new course needs a concrete starting point.",
      taskType: "review",
      priority: priorityLabel(breakdown.total),
      priorityScore: breakdown.total,
      estimatedMinutes: 20,
      scheduledFor,
      dueAt: null,
    });
  }

  const fitted = fitDailyCapacity(candidates, input.dailyStudyMinutes, 3);
  return {
    tasks: fitted.scheduled,
    estimatedMinutes: fitted.scheduled.reduce(
      (total, task) => total + task.estimatedMinutes,
      0,
    ),
    overload: fitted.overload,
  };
}
