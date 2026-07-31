import type { AppEnvironment } from "./runtime.ts";
import type { AdminRepository } from "../repositories/admin-repository.ts";
import type { FeatureFlagRepository } from "../repositories/feature-flag-repository.ts";
import type { FeatureFlagService } from "./feature-flag-service.ts";
import {
  FEATURE_FLAG_KEYS,
  type FeatureFlagKey,
} from "./feature-flag-service.ts";
import { ApiError } from "../lib/api-errors.ts";
import { createId } from "../lib/ids.ts";

export class AdminService {
  private readonly repository: AdminRepository;
  private readonly flagRepository: FeatureFlagRepository;
  private readonly flags: FeatureFlagService;
  private readonly environment: AppEnvironment;

  constructor(
    repository: AdminRepository,
    flagRepository: FeatureFlagRepository,
    flags: FeatureFlagService,
    environment: AppEnvironment,
  ) {
    this.repository = repository;
    this.flagRepository = flagRepository;
    this.flags = flags;
    this.environment = environment;
  }

  async dashboard(now = new Date()) {
    const [
      metrics,
      users,
      featureFlags,
      courseTemplates,
      questions,
      payments,
      errors,
    ] = await Promise.all([
      this.repository.metrics(now),
      this.repository.recentUsers(),
      this.flags.list(),
      this.repository.courseTemplates(),
      this.repository.publicPracticeQuestions(),
      this.repository.recentPayments(),
      this.repository.errorSummary(),
    ]);
    return {
      metrics: {
        ...metrics,
        onboardingRate:
          metrics.totalUsers > 0
            ? metrics.onboardingCompletedUsers / metrics.totalUsers
            : 0,
        freeToPaidRate:
          metrics.totalUsers > 0
            ? metrics.paidUsers / metrics.totalUsers
            : 0,
        reviewCompletionRate:
          metrics.dueRetestTasks7d > 0
            ? metrics.completedReviews7d / metrics.dueRetestTasks7d
            : 0,
        paidActiveRate:
          metrics.paidUsers > 0
            ? metrics.paidActiveUsers7d / metrics.paidUsers
            : 0,
        aiCostPerActiveUserMinorUsd:
          metrics.activeUsers28d > 0
            ? metrics.aiCostMinorUsd / metrics.activeUsers28d
            : 0,
        refundRate:
          metrics.completedPurchases > 0
            ? metrics.refundedPurchases / metrics.completedPurchases
            : 0,
      },
      users,
      featureFlags,
      courseTemplates,
      questions,
      payments,
      errors,
    };
  }

  async setFeatureFlag(input: {
    actorUserId: string;
    key: string;
    enabled: boolean;
    now?: Date;
  }): Promise<void> {
    if (!FEATURE_FLAG_KEYS.includes(input.key as FeatureFlagKey)) {
      throw new ApiError(
        "FEATURE_FLAG_NOT_FOUND",
        404,
        "The feature flag was not found.",
      );
    }
    const now = input.now ?? new Date();
    await this.flagRepository.set({
      id: createId("flag"),
      environment: this.environment,
      flagKey: input.key,
      enabled: input.enabled,
      adminUserId: input.actorUserId,
      now: now.toISOString(),
    });
    await this.repository.audit({
      id: createId("audit"),
      actorUserId: input.actorUserId,
      action: "feature_flag_updated",
      entityType: "feature_flag",
      entityId: input.key,
      metadata: {
        environment: this.environment,
        enabled: input.enabled,
      },
      now: now.toISOString(),
    });
  }

  async updateUserStatus(input: {
    actorUserId: string;
    targetUserId: string;
    status: "active" | "suspended";
    now?: Date;
  }): Promise<void> {
    if (input.actorUserId === input.targetUserId) {
      throw new ApiError(
        "ADMIN_SELF_SUSPEND_FORBIDDEN",
        400,
        "Administrators cannot change their own status here.",
      );
    }
    const updated = await this.repository.updateUserStatus({
      ...input,
      auditId: createId("audit"),
      now: (input.now ?? new Date()).toISOString(),
    });
    if (!updated) {
      throw new ApiError(
        "USER_NOT_FOUND",
        404,
        "The student account was not found.",
      );
    }
  }

  async updateCourseTemplate(input: {
    actorUserId: string;
    id: string;
    courseCode: string | null;
    courseName: string;
    description: string | null;
    defaultLanguage: "zh-CN" | "en";
    isActive: boolean;
    now?: Date;
  }): Promise<void> {
    const updated = await this.repository.updateCourseTemplate({
      ...input,
      auditId: createId("audit"),
      now: (input.now ?? new Date()).toISOString(),
    });
    if (!updated) {
      throw new ApiError(
        "COURSE_TEMPLATE_NOT_FOUND",
        404,
        "The course template was not found.",
      );
    }
  }

  async createCourseTemplate(input: {
    actorUserId: string;
    institutionId: string | null;
    courseCode: string | null;
    courseName: string;
    description: string | null;
    defaultLanguage: "zh-CN" | "en";
    colourKey: string;
    now?: Date;
  }): Promise<string> {
    const id = createId("template");
    const now = input.now ?? new Date();
    const created = await this.repository.createCourseTemplate({
      ...input,
      id,
      auditId: createId("audit"),
      now: now.toISOString(),
    });
    if (!created) {
      throw new ApiError(
        "INSTITUTION_NOT_FOUND",
        404,
        "The selected institution was not found.",
      );
    }
    return id;
  }

  async updateQuestionReview(input: {
    actorUserId: string;
    id: string;
    reviewStatus: "draft" | "reviewed" | "rejected";
    now?: Date;
  }): Promise<void> {
    const updated = await this.repository.updateQuestionReview({
      ...input,
      auditId: createId("audit"),
      now: (input.now ?? new Date()).toISOString(),
    });
    if (!updated) {
      throw new ApiError(
        "PRACTICE_QUESTION_NOT_FOUND",
        404,
        "The public practice question was not found.",
      );
    }
  }

  async createPublicQuestion(input: {
    actorUserId: string;
    courseTemplateId: string;
    questionType: string;
    difficulty: number;
    prompt: string;
    options: string[];
    solution: string;
    hint1: string | null;
    hint2: string | null;
    hint3: string | null;
    explanation: string;
    language: "zh-CN" | "en";
    now?: Date;
  }): Promise<string> {
    const id = createId("question");
    const created = await this.repository.createPublicQuestion({
      ...input,
      id,
      optionsJson: input.options.length
        ? JSON.stringify(input.options)
        : null,
      auditId: createId("audit"),
      now: (input.now ?? new Date()).toISOString(),
    });
    if (!created) {
      throw new ApiError(
        "COURSE_TEMPLATE_NOT_FOUND",
        404,
        "The selected course template was not found.",
      );
    }
    return id;
  }
}
