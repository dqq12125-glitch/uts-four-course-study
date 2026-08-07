import type { AiProvider } from "../services/ai/types.ts";
import type { AiRepository } from "../repositories/ai-repository.ts";
import type { AiUsageService } from "../services/usage/ai-usage-service.ts";
import type { EntitlementService } from "./entitlement-service.ts";
import type { FeatureFlagService } from "./feature-flag-service.ts";
import type { LearningLoopService } from "./learning-loop-service.ts";
import { ApiError } from "../lib/api-errors.ts";
import { createId } from "../lib/ids.ts";

export class AiPracticeService {
  private readonly repository: AiRepository;
  private readonly provider: AiProvider;
  private readonly usage: AiUsageService;
  private readonly entitlements: EntitlementService;
  private readonly flags: FeatureFlagService;
  private readonly learningLoop: LearningLoopService;

  constructor(
    repository: AiRepository,
    provider: AiProvider,
    usage: AiUsageService,
    entitlements: EntitlementService,
    flags: FeatureFlagService,
    learningLoop: LearningLoopService,
  ) {
    this.repository = repository;
    this.provider = provider;
    this.usage = usage;
    this.entitlements = entitlements;
    this.flags = flags;
    this.learningLoop = learningLoop;
  }

  async generate(input: {
    userId: string;
    role: "student" | "admin";
    timezone: string;
    courseId: string;
    topicTitle: string;
    difficulty: number;
    resourceIds: string[];
    language: "zh-CN" | "en";
    now?: Date;
  }): Promise<{ questionId: string; topicId: string }> {
    await this.flags.require("practice_generation_enabled");
    const now = input.now ?? new Date();
    const [course, entitlement, generatedThisWeek] = await Promise.all([
      this.repository.courseContext(
        input.userId,
        input.courseId,
        null,
        null,
      ),
      this.entitlements.snapshot(input.userId, input.role, now),
      this.usage.generatedPracticeThisWeek({
        userId: input.userId,
        timezone: input.timezone,
        now,
      }),
    ]);
    if (!course) {
      throw new ApiError(
        "COURSE_NOT_FOUND",
        404,
        "The selected course was not found.",
      );
    }
    this.entitlements.assertCanGeneratePractice(
      entitlement,
      generatedThisWeek,
    );
    let context = await this.repository.resourceContext(
      input.userId,
      input.resourceIds,
    );
    context = context.slice(0, entitlement.aiContextCharacterLimit);
    const startedAt = Date.now();
    try {
      const generated = await this.provider.generatePractice({
        language: input.language,
        courseName: course.courseName,
        topicTitle: input.topicTitle,
        difficulty: input.difficulty,
        untrustedResourceContext: context || null,
      });
      const question = generated.questions[0];
      if (!question) {
        throw new ApiError(
          "AI_RESPONSE_INVALID",
          502,
          "No valid practice question was generated.",
        );
      }
      const created = await this.learningLoop.createPrivateQuestion(
        input.userId,
        {
          courseId: input.courseId,
          topicTitle: input.topicTitle,
          difficulty: input.difficulty,
          ...question,
          language: input.language,
          sourceType: "ai_generated",
        },
        now,
      );
      await this.repository.recordUsage({
        id: createId("aiusage"),
        userId: input.userId,
        feature: "practice_generation",
        modelKey: generated.modelKey,
        tokenInput: generated.tokenInput,
        tokenOutput: generated.tokenOutput,
        latencyMs: Math.max(0, Date.now() - startedAt),
        success: true,
        errorCode: null,
        estimatedCostMinorUsd: generated.estimatedCostMinorUsd,
        now: now.toISOString(),
      });
      await this.repository.recordProductEvent({
        id: createId("event"),
        userId: input.userId,
        eventName: "practice_generated",
        category: "learning",
        properties: {
          courseId: input.courseId,
          difficulty: input.difficulty,
          modelKey: generated.modelKey,
        },
        now: now.toISOString(),
      });
      return created;
    } catch (error) {
      await this.repository.recordUsage({
        id: createId("aiusage"),
        userId: input.userId,
        feature: "practice_generation",
        modelKey: "unavailable",
        tokenInput: 0,
        tokenOutput: 0,
        latencyMs: Math.max(0, Date.now() - startedAt),
        success: false,
        errorCode:
          error instanceof ApiError ? error.code : "AI_PROVIDER_ERROR",
        estimatedCostMinorUsd: 0,
        now: now.toISOString(),
      });
      throw error;
    }
  }
}
