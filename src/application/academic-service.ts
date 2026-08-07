import type { EntitlementService } from "./entitlement-service.ts";
import type { AcademicRepository } from "../repositories/academic-repository.ts";
import { ApiError } from "../lib/api-errors.ts";
import { createId } from "../lib/ids.ts";

function dateDistance(start: string, end: string): number {
  return Math.floor(
    (Date.parse(`${end}T12:00:00.000Z`) -
      Date.parse(`${start}T12:00:00.000Z`)) /
      86_400_000,
  );
}

const PRIORITY_SCORE = {
  low: 10,
  medium: 30,
  high: 60,
  critical: 100,
} as const;

export class AcademicService {
  private readonly repository: AcademicRepository;
  private readonly entitlements: EntitlementService;

  constructor(
    repository: AcademicRepository,
    entitlements: EntitlementService,
  ) {
    this.repository = repository;
    this.entitlements = entitlements;
  }

  async plan(input: {
    userId: string;
    startDate: string;
    endDate: string;
    courseId?: string | null;
  }) {
    const distance = dateDistance(input.startDate, input.endDate);
    if (distance < 0 || distance > 31) {
      throw new ApiError(
        "PLAN_RANGE_INVALID",
        400,
        "Plan range must cover between one and 32 days.",
      );
    }
    return this.repository.listPlan(input);
  }

  async createTask(input: {
    userId: string;
    courseId: string | null;
    topicId: string | null;
    assessmentId: string | null;
    title: string;
    description: string | null;
    completionCriteria: string;
    taskType: string;
    priority: keyof typeof PRIORITY_SCORE;
    estimatedMinutes: number;
    scheduledFor: string;
    dueAt: string | null;
    now?: Date;
  }): Promise<string> {
    const id = createId("task");
    const created = await this.repository.createCustomTask({
      ...input,
      id,
      priorityScore: PRIORITY_SCORE[input.priority],
      now: (input.now ?? new Date()).toISOString(),
    });
    if (!created) {
      throw new ApiError(
        "TASK_CONTEXT_NOT_FOUND",
        404,
        "The selected course, topic, or assessment was not found.",
      );
    }
    return id;
  }

  async reschedule(input: {
    userId: string;
    taskId: string;
    scheduledFor: string;
    now?: Date;
  }): Promise<void> {
    if (
      !(await this.repository.rescheduleTask({
        ...input,
        now: (input.now ?? new Date()).toISOString(),
      }))
    ) {
      throw new ApiError(
        "STUDY_TASK_NOT_FOUND",
        404,
        "Study task not found or no longer reschedulable.",
      );
    }
  }

  async reorder(input: {
    userId: string;
    scheduledFor: string;
    taskIds: string[];
    now?: Date;
  }): Promise<void> {
    const updated = await this.repository.reorderTasks({
      ...input,
      now: (input.now ?? new Date()).toISOString(),
    });
    if (updated !== input.taskIds.length) {
      throw new ApiError(
        "TASK_ORDER_CONFLICT",
        409,
        "One or more tasks changed before the new order was saved.",
      );
    }
  }

  async weeklyReport(input: {
    userId: string;
    role: "student" | "admin";
    now?: Date;
  }) {
    const now = input.now ?? new Date();
    const entitlement = await this.entitlements.snapshot(
      input.userId,
      input.role,
      now,
    );
    this.entitlements.assertCanAccessWeeklyReport(entitlement);
    return {
      from: new Date(now.getTime() - 7 * 86_400_000).toISOString(),
      to: now.toISOString(),
      ...(await this.repository.weeklyReport({
        userId: input.userId,
        from: new Date(now.getTime() - 7 * 86_400_000).toISOString(),
        to: now.toISOString(),
        now: now.toISOString(),
      })),
    };
  }
}
