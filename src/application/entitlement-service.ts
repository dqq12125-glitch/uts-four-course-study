import {
  canAccessWeeklyReport,
  canCreateCourse,
  canGeneratePractice,
  canUploadResource,
  canUseAiTutor,
  canViewAdvancedMastery,
  resolveEntitlements,
  type EntitlementSnapshot,
} from "../domain/commerce/entitlements.ts";
import type { ProductKey } from "../domain/commerce/products.ts";
import { ApiError } from "../lib/api-errors.ts";
import type { CommerceRepository } from "../repositories/commerce-repository.ts";
import type { LearningRepository } from "../repositories/learning-repository.ts";

export class EntitlementService {
  private readonly commerce: CommerceRepository;
  private readonly learning: LearningRepository;
  private readonly developmentFullAccess: boolean;

  constructor(
    commerce: CommerceRepository,
    learning: LearningRepository,
    developmentFullAccess = false,
  ) {
    this.commerce = commerce;
    this.learning = learning;
    this.developmentFullAccess = developmentFullAccess;
  }

  async snapshot(
    userId: string,
    role: "student" | "admin" = "student",
    now = new Date(),
  ): Promise<EntitlementSnapshot> {
    const access = await this.commerce.listActiveAccess(
      userId,
      now.toISOString(),
    );
    return resolveEntitlements(
      access.map((item) => item.productKey as ProductKey),
      role === "admin" || this.developmentFullAccess,
    );
  }

  async assertCanCreateCourse(
    userId: string,
    role: "student" | "admin",
  ): Promise<EntitlementSnapshot> {
    const [entitlement, count] = await Promise.all([
      this.snapshot(userId, role),
      this.learning.activeCourseCount(userId),
    ]);
    if (!canCreateCourse(entitlement, count)) {
      throw new ApiError(
        "COURSE_LIMIT_REACHED",
        403,
        `Your current plan supports ${entitlement.courseLimit} active course${entitlement.courseLimit === 1 ? "" : "s"}.`,
      );
    }
    return entitlement;
  }

  assertCanUseAiTutor(
    entitlement: EntitlementSnapshot,
    messagesUsedToday: number,
  ): void {
    if (!canUseAiTutor(entitlement, messagesUsedToday)) {
      throw new ApiError(
        "AI_DAILY_LIMIT_REACHED",
        429,
        "You have reached today's AI tutor allowance.",
      );
    }
  }

  assertCanGeneratePractice(
    entitlement: EntitlementSnapshot,
    generatedThisWeek: number,
  ): void {
    if (!canGeneratePractice(entitlement, generatedThisWeek)) {
      throw new ApiError(
        "PRACTICE_WEEKLY_LIMIT_REACHED",
        429,
        "You have reached this week's practice-generation allowance.",
      );
    }
  }

  assertCanUploadResource(entitlement: EntitlementSnapshot): void {
    if (!canUploadResource(entitlement)) {
      throw new ApiError(
        "RESOURCE_UPLOAD_REQUIRES_PASS",
        403,
        "Resource upload requires a Semester or Founding Pass.",
      );
    }
  }

  assertCanViewAdvancedMastery(entitlement: EntitlementSnapshot): void {
    if (!canViewAdvancedMastery(entitlement)) {
      throw new ApiError(
        "ADVANCED_MASTERY_REQUIRES_PASS",
        403,
        "Advanced mastery insights require a Semester or Founding Pass.",
      );
    }
  }

  assertCanAccessWeeklyReport(entitlement: EntitlementSnapshot): void {
    if (!canAccessWeeklyReport(entitlement)) {
      throw new ApiError(
        "WEEKLY_REPORT_REQUIRES_PASS",
        403,
        "Weekly reports require a Semester or Founding Pass.",
      );
    }
  }
}
