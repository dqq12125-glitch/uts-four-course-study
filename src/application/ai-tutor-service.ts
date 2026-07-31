import type { EntitlementService } from "./entitlement-service.ts";
import type { FeatureFlagService } from "./feature-flag-service.ts";
import type { AiProvider } from "../services/ai/types.ts";
import { academicIntegrityRisk } from "../services/ai/prompt-safety.ts";
import type { AiUsageService } from "../services/usage/ai-usage-service.ts";
import type { AiRepository } from "../repositories/ai-repository.ts";
import { ApiError } from "../lib/api-errors.ts";
import { createId } from "../lib/ids.ts";

export interface AiTutorRequest {
  courseId: string;
  topicId?: string | null;
  currentTaskId?: string | null;
  conversationId?: string | null;
  message: string;
  studentAttempt?: string | null;
  resourceIds?: string[];
  language: "zh-CN" | "en";
  suspectedAssessedWork?: boolean;
}

export class AiTutorService {
  private readonly repository: AiRepository;
  private readonly provider: AiProvider;
  private readonly entitlements: EntitlementService;
  private readonly flags: FeatureFlagService;
  private readonly usage: AiUsageService;

  constructor(
    repository: AiRepository,
    provider: AiProvider,
    entitlements: EntitlementService,
    flags: FeatureFlagService,
    usage: AiUsageService,
  ) {
    this.repository = repository;
    this.provider = provider;
    this.entitlements = entitlements;
    this.flags = flags;
    this.usage = usage;
  }

  async tutor(input: {
    userId: string;
    role: "student" | "admin";
    timezone: string;
    request: AiTutorRequest;
    now?: Date;
  }): Promise<{
    conversationId: string;
    reply: string;
    safetyMode: "hint_first" | "integrity_guidance";
    remainingToday: number;
  }> {
    await this.flags.require("ai_tutor_enabled");
    const now = input.now ?? new Date();
    const [entitlement, course] = await Promise.all([
      this.entitlements.snapshot(input.userId, input.role, now),
      this.repository.courseContext(
        input.userId,
        input.request.courseId,
        input.request.topicId ?? null,
        input.request.currentTaskId ?? null,
      ),
    ]);
    if (!course) {
      throw new ApiError(
        "COURSE_CONTEXT_NOT_FOUND",
        404,
        "The selected course context was not found.",
      );
    }
    const allowance = await this.usage.allowance({
      userId: input.userId,
      timezone: input.timezone,
      entitlement,
      now,
    });
    this.usage.assertAvailable(entitlement, allowance);

    let conversation = input.request.conversationId
      ? await this.repository.conversation(
          input.userId,
          input.request.conversationId,
        )
      : null;
    if (input.request.conversationId && !conversation) {
      throw new ApiError(
        "AI_CONVERSATION_NOT_FOUND",
        404,
        "The tutor conversation was not found.",
      );
    }
    if (conversation && conversation.courseId !== course.courseId) {
      throw new ApiError(
        "AI_CONVERSATION_COURSE_MISMATCH",
        409,
        "This conversation belongs to a different course.",
      );
    }
    const history = conversation
      ? await this.repository.history(input.userId, conversation.id, 8)
      : [];
    let resourceContext = await this.repository.resourceContext(
      input.userId,
      input.request.resourceIds ?? [],
    );
    if (resourceContext.length > entitlement.aiContextCharacterLimit) {
      resourceContext = resourceContext.slice(
        0,
        entitlement.aiContextCharacterLimit,
      );
    }
    const safetyMode = academicIntegrityRisk(
      `${input.request.message}\n${input.request.studentAttempt ?? ""}`,
      input.request.suspectedAssessedWork ?? false,
    )
      ? "integrity_guidance"
      : "hint_first";
    const startedAt = Date.now();
    let result: Awaited<ReturnType<AiProvider["tutor"]>>;
    try {
      result = await this.provider.tutor({
        language: input.request.language,
        courseName: course.courseName,
        courseCode: course.courseCode,
        topicTitle: course.topicTitle,
        currentTask: course.currentTask,
        userMessage: input.request.message,
        studentAttempt: input.request.studentAttempt?.trim() || null,
        history,
        untrustedResourceContext: resourceContext || null,
        safetyMode,
      });
      await this.repository.recordUsage({
        id: createId("aiusage"),
        userId: input.userId,
        feature: "tutor",
        modelKey: result.modelKey,
        tokenInput: result.tokenInput,
        tokenOutput: result.tokenOutput,
        latencyMs: Math.max(0, Date.now() - startedAt),
        success: true,
        errorCode: null,
        estimatedCostMinorUsd: result.estimatedCostMinorUsd,
        now: now.toISOString(),
      });
    } catch (error) {
      await this.repository.recordUsage({
        id: createId("aiusage"),
        userId: input.userId,
        feature: "tutor",
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

    if (!conversation) {
      conversation = {
        id: createId("conversation"),
        courseId: course.courseId,
        topicId: course.topicId,
        title: input.request.message.slice(0, 80),
        status: "active",
      };
      await this.repository.createConversation({
        ...conversation,
        userId: input.userId,
        courseId: course.courseId,
        now: now.toISOString(),
      });
    }
    await this.repository.saveExchange({
      userMessageId: createId("message"),
      assistantMessageId: createId("message"),
      conversationId: conversation.id,
      userId: input.userId,
      userMessage: input.request.message,
      assistantMessage: result.reply,
      tokenInput: result.tokenInput,
      tokenOutput: result.tokenOutput,
      modelKey: result.modelKey,
      safetyMode,
      now: now.toISOString(),
    });
    await this.repository.recordProductEvent({
      id: createId("event"),
      userId: input.userId,
      eventName: "ai_tutor_used",
      category: "learning",
      properties: {
        safetyMode,
        courseId: course.courseId,
        modelKey: result.modelKey,
      },
      now: now.toISOString(),
    });
    return {
      conversationId: conversation.id,
      reply: result.reply,
      safetyMode,
      remainingToday: Math.max(0, allowance.remainingToday - 1),
    };
  }
}
