import type { AnalyticsRepository } from "../repositories/analytics-repository.ts";
import { ApiError } from "../lib/api-errors.ts";
import { createId } from "../lib/ids.ts";

export const PRODUCT_EVENTS = [
  "user_signed_up",
  "email_verified",
  "onboarding_started",
  "onboarding_completed",
  "course_created",
  "assessment_created",
  "first_plan_generated",
  "study_task_started",
  "study_task_completed",
  "focus_session_completed",
  "practice_started",
  "practice_completed",
  "review_completed",
  "ai_tutor_used",
  "paywall_viewed",
  "checkout_started",
  "purchase_completed",
  "purchase_failed",
  "account_deleted",
] as const;

type ProductEvent = (typeof PRODUCT_EVENTS)[number];

const CLIENT_EVENTS = new Set<ProductEvent>([
  "onboarding_started",
  "paywall_viewed",
]);

const CATEGORIES: Record<ProductEvent, string> = {
  user_signed_up: "acquisition",
  email_verified: "activation",
  onboarding_started: "activation",
  onboarding_completed: "activation",
  course_created: "learning",
  assessment_created: "learning",
  first_plan_generated: "activation",
  study_task_started: "learning",
  study_task_completed: "learning",
  focus_session_completed: "learning",
  practice_started: "learning",
  practice_completed: "learning",
  review_completed: "learning",
  ai_tutor_used: "learning",
  paywall_viewed: "commerce",
  checkout_started: "commerce",
  purchase_completed: "commerce",
  purchase_failed: "commerce",
  account_deleted: "privacy",
};

const ALLOWED_PROPERTY_KEYS = new Set([
  "source",
  "courseCount",
  "taskCount",
  "taskType",
  "completionStatus",
  "correct",
  "hintsUsed",
  "isReview",
  "safetyMode",
  "modelKey",
  "productKey",
  "provider",
  "status",
]);

function safeProperties(
  properties: Record<string, unknown>,
): Record<string, string | number | boolean | null> {
  const result: Record<string, string | number | boolean | null> = {};
  for (const [key, value] of Object.entries(properties).slice(0, 20)) {
    if (
      !ALLOWED_PROPERTY_KEYS.has(key) ||
      !(
        value === null ||
        typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean"
      )
    ) {
      continue;
    }
    result[key] =
      typeof value === "string" ? value.slice(0, 120) : value;
  }
  return result;
}

export class AnalyticsService {
  private readonly repository: AnalyticsRepository;

  constructor(repository: AnalyticsRepository) {
    this.repository = repository;
  }

  async record(
    userId: string | null,
    eventName: ProductEvent,
    properties: Record<string, unknown> = {},
    now = new Date(),
  ): Promise<void> {
    await this.repository.record({
      id: createId("event"),
      userId,
      eventName,
      category: CATEGORIES[eventName],
      properties: safeProperties(properties),
      now: now.toISOString(),
    });
  }

  async recordBestEffort(
    userId: string | null,
    eventName: ProductEvent,
    properties: Record<string, unknown> = {},
    now = new Date(),
  ): Promise<void> {
    try {
      await this.record(userId, eventName, properties, now);
    } catch {
      console.warn(
        JSON.stringify({
          level: "warn",
          event: "analytics_event_dropped",
          eventName,
        }),
      );
    }
  }

  async recordClient(
    userId: string,
    eventName: string,
    properties: Record<string, unknown>,
  ): Promise<void> {
    if (!CLIENT_EVENTS.has(eventName as ProductEvent)) {
      throw new ApiError(
        "ANALYTICS_EVENT_NOT_ALLOWED",
        400,
        "That client event is not allowed.",
      );
    }
    await this.record(
      userId,
      eventName as ProductEvent,
      properties,
    );
  }
}
