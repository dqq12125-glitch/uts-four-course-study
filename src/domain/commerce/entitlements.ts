import type { ProductKey } from "./products.ts";

export interface EntitlementSnapshot {
  planKey: ProductKey;
  activeProducts: ProductKey[];
  isFoundingUser: boolean;
  courseLimit: number;
  activeSemesterLimit: number;
  dailyAiMessageLimit: number;
  weeklyPracticeGenerationLimit: number;
  aiContextCharacterLimit: number;
  monthlyAiCostLimitMinorUsd: number;
  canUseAiTutor: boolean;
  canGeneratePractice: boolean;
  canUploadResource: boolean;
  canViewAdvancedMastery: boolean;
  canAccessWeeklyReport: boolean;
}

const FREE: EntitlementSnapshot = {
  planKey: "free",
  activeProducts: ["free"],
  isFoundingUser: false,
  courseLimit: 1,
  activeSemesterLimit: 1,
  dailyAiMessageLimit: 3,
  weeklyPracticeGenerationLimit: 5,
  aiContextCharacterLimit: 8_000,
  monthlyAiCostLimitMinorUsd: 150,
  canUseAiTutor: true,
  canGeneratePractice: true,
  canUploadResource: false,
  canViewAdvancedMastery: false,
  canAccessWeeklyReport: false,
};

const PAID: EntitlementSnapshot = {
  planKey: "semester_pass",
  activeProducts: ["semester_pass"],
  isFoundingUser: false,
  courseLimit: 4,
  activeSemesterLimit: 1,
  dailyAiMessageLimit: 30,
  weeklyPracticeGenerationLimit: 100,
  aiContextCharacterLimit: 50_000,
  monthlyAiCostLimitMinorUsd: 1_500,
  canUseAiTutor: true,
  canGeneratePractice: true,
  canUploadResource: true,
  canViewAdvancedMastery: true,
  canAccessWeeklyReport: true,
};

export function resolveEntitlements(
  activeProducts: ProductKey[],
  isAdmin = false,
): EntitlementSnapshot {
  if (isAdmin) {
    return {
      ...PAID,
      planKey: "semester_pass",
      activeProducts: ["semester_pass"],
      courseLimit: 1_000,
      activeSemesterLimit: 100,
      dailyAiMessageLimit: 1_000,
      weeklyPracticeGenerationLimit: 10_000,
      aiContextCharacterLimit: 100_000,
      monthlyAiCostLimitMinorUsd: 100_000,
    };
  }

  const unique = [...new Set(activeProducts.filter((key) => key !== "free"))];
  if (unique.length === 0) return { ...FREE, activeProducts: ["free"] };

  const founding = unique.includes("founding_pass");
  const planKey: ProductKey = unique.includes("semester_pass")
    ? "semester_pass"
    : founding
      ? "founding_pass"
      : "exam_sprint";
  return {
    ...PAID,
    planKey,
    activeProducts: unique,
    isFoundingUser: founding,
  };
}

export function canCreateCourse(
  entitlement: EntitlementSnapshot,
  activeCourseCount: number,
): boolean {
  return activeCourseCount < entitlement.courseLimit;
}

export function canUseAiTutor(
  entitlement: EntitlementSnapshot,
  messagesUsedToday: number,
): boolean {
  return (
    entitlement.canUseAiTutor &&
    messagesUsedToday < entitlement.dailyAiMessageLimit
  );
}

export function canGeneratePractice(
  entitlement: EntitlementSnapshot,
  generatedThisWeek: number,
): boolean {
  return (
    entitlement.canGeneratePractice &&
    generatedThisWeek < entitlement.weeklyPracticeGenerationLimit
  );
}

export function canUploadResource(
  entitlement: EntitlementSnapshot,
): boolean {
  return entitlement.canUploadResource;
}

export function canViewAdvancedMastery(
  entitlement: EntitlementSnapshot,
): boolean {
  return entitlement.canViewAdvancedMastery;
}

export function canAccessWeeklyReport(
  entitlement: EntitlementSnapshot,
): boolean {
  return entitlement.canAccessWeeklyReport;
}
