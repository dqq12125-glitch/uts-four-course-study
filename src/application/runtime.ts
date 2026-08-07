import { getD1 } from "@/db";
import { AuthService } from "@/src/application/auth-service";
import { AuthRepository } from "@/src/repositories/auth-repository";
import { LearningRepository } from "@/src/repositories/learning-repository";
import { LearningLoopRepository } from "@/src/repositories/learning-loop-repository";
import { LearningLoopService } from "@/src/application/learning-loop-service";
import { PlanRebalanceService } from "@/src/application/plan-rebalance-service";
import {
  DevelopmentEmailSender,
  type EmailSender,
} from "@/src/services/email/email-sender";
import { ResendEmailSender } from "@/src/services/email/resend-sender";
import { getRuntimeEnvironment } from "@/src/infrastructure/environment";
import { CommerceRepository } from "@/src/repositories/commerce-repository";
import { FeatureFlagRepository } from "@/src/repositories/feature-flag-repository";
import { FeatureFlagService } from "@/src/application/feature-flag-service";
import { EntitlementService } from "@/src/application/entitlement-service";
import { BillingService } from "@/src/application/billing-service";
import {
  HttpStripeGateway,
  MockStripeGateway,
  UnavailableStripeGateway,
  type StripeGateway,
} from "@/src/services/payments/stripe-gateway";
import { AiRepository } from "@/src/repositories/ai-repository";
import { AiUsageService } from "@/src/services/usage/ai-usage-service";
import { AiTutorService } from "@/src/application/ai-tutor-service";
import type { AiProvider } from "@/src/services/ai/types";
import { MockAiProvider } from "@/src/services/ai/mock-ai-provider";
import { UnavailableAiProvider } from "@/src/services/ai/unavailable-ai-provider";
import { OpenAiCompatibleProvider } from "@/src/services/ai/openai-compatible-provider";
import { ResourceRepository } from "@/src/repositories/resource-repository";
import { ResourceService } from "@/src/application/resource-service";
import {
  InMemoryPrivateObjectStorage,
  R2PrivateObjectStorage,
  UnavailablePrivateObjectStorage,
  type PrivateObjectStorage,
} from "@/src/services/storage/private-object-storage";
import { AiPracticeService } from "@/src/application/ai-practice-service";
import { AccountRepository } from "@/src/repositories/account-repository";
import { AccountService } from "@/src/application/account-service";
import { NotificationRepository } from "@/src/repositories/notification-repository";
import { NotificationService } from "@/src/application/notification-service";
import { ScheduledJobService } from "@/src/application/scheduled-job-service";
import { AnalyticsRepository } from "@/src/repositories/analytics-repository";
import { AnalyticsService } from "@/src/application/analytics-service";
import { AdminRepository } from "@/src/repositories/admin-repository";
import { AdminService } from "@/src/application/admin-service";
import { AcademicRepository } from "@/src/repositories/academic-repository";
import { AcademicService } from "@/src/application/academic-service";
import { TurnstileVerifier } from "@/src/services/security/turnstile-verifier";
import {
  OpenAICompatibleAIProvider,
  StaticModelPolicy,
} from "@deepstudy/ai";
import { DocumentIngestionPipeline } from "@deepstudy/ingestion";
import type { AIProvider as AdaptiveAIProvider } from "@deepstudy/shared-types";
import { ResourceIngestionRepository } from "@/src/repositories/resource-ingestion-repository";
import { ResourceIngestionService } from "@/src/application/resource-ingestion-service";
import { ConnectorSyncRepository } from "@/src/repositories/connector-sync-repository";
import { CourseSyncService } from "@/src/application/course-sync-service";
import { createCourseConnector } from "@/src/infrastructure/connector-factory";

export type AppEnvironment =
  | "development"
  | "preview"
  | "production"
  | "test";

export function appEnvironment(): AppEnvironment {
  const env = getRuntimeEnvironment();
  return env.APP_ENV ?? "production";
}

export function getEmailSender(): EmailSender {
  const env = getRuntimeEnvironment();
  if (
    appEnvironment() === "development" &&
    (!env.EMAIL_API_KEY || !env.EMAIL_FROM)
  ) {
    return new DevelopmentEmailSender();
  }

  if (!env.EMAIL_API_KEY || !env.EMAIL_FROM) {
    throw new Error(
      "EMAIL_API_KEY and EMAIL_FROM are required outside development.",
    );
  }
  return new ResendEmailSender(env.EMAIL_API_KEY, env.EMAIL_FROM);
}

export function getAuthService(): AuthService {
  const env = getRuntimeEnvironment();
  const baseUrl = env.APP_BASE_URL;
  if (!baseUrl) {
    throw new Error("APP_BASE_URL is required.");
  }
  if (!env.IP_HASH_SECRET && appEnvironment() !== "development") {
    throw new Error("IP_HASH_SECRET is required outside development.");
  }
  const mobileAppScheme = env.MOBILE_APP_SCHEME ?? "deepstudy";
  if (!/^[a-z][a-z0-9+.-]{1,31}$/i.test(mobileAppScheme)) {
    throw new Error("MOBILE_APP_SCHEME is invalid.");
  }

  return new AuthService(new AuthRepository(getD1()), getEmailSender(), {
    baseUrl,
    mobileAppScheme,
    mobileAppLinkBaseUrl: env.MOBILE_APP_LINK_BASE_URL,
    ipHashSecret: env.IP_HASH_SECRET ?? "development-only",
    environment: appEnvironment(),
  });
}

export function getLearningRepository(): LearningRepository {
  return new LearningRepository(getD1());
}

export function getLearningLoopRepository(): LearningLoopRepository {
  return new LearningLoopRepository(getD1());
}

export function getLearningLoopService(): LearningLoopService {
  return new LearningLoopService(getLearningLoopRepository());
}

export function getPlanRebalanceService(): PlanRebalanceService {
  return new PlanRebalanceService(getLearningLoopRepository());
}

export function getCommerceRepository(): CommerceRepository {
  return new CommerceRepository(getD1());
}

export function getFeatureFlagService(): FeatureFlagService {
  return new FeatureFlagService(
    new FeatureFlagRepository(getD1()),
    appEnvironment(),
  );
}

export function getEntitlementService(): EntitlementService {
  const env = getRuntimeEnvironment();
  return new EntitlementService(
    getCommerceRepository(),
    getLearningRepository(),
    appEnvironment() !== "production" &&
      env.DEVELOPMENT_FULL_ACCESS === "true",
  );
}

function stripeGateway(): StripeGateway {
  const env = getRuntimeEnvironment();
  if (
    env.PAYMENTS_MOCK_ENABLED === "true" &&
    appEnvironment() !== "production"
  ) {
    return new MockStripeGateway();
  }
  if (!env.STRIPE_SECRET_KEY) return new UnavailableStripeGateway();
  return new HttpStripeGateway(env.STRIPE_SECRET_KEY);
}

export function getBillingService(): BillingService {
  const env = getRuntimeEnvironment();
  if (!env.APP_BASE_URL) {
    throw new Error("APP_BASE_URL is required.");
  }
  return new BillingService(
    getCommerceRepository(),
    getLearningRepository(),
    getEntitlementService(),
    getFeatureFlagService(),
    stripeGateway(),
    {
      appBaseUrl: env.APP_BASE_URL,
      foundingPassEndAt:
        env.FOUNDING_PASS_ACCESS_END_AT ??
        "2026-12-01T00:00:00+11:00",
      priceIds: {
        founding_pass: env.STRIPE_FOUNDING_PASS_PRICE_ID,
        semester_pass: env.STRIPE_SEMESTER_PASS_PRICE_ID,
        exam_sprint: env.STRIPE_EXAM_SPRINT_PRICE_ID,
      },
    },
  );
}

export function getAiRepository(): AiRepository {
  return new AiRepository(getD1());
}

function nonNegativeNumber(value: string | undefined): number {
  const parsed = Number(value ?? "0");
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

export function getAiProvider(): AiProvider {
  const env = getRuntimeEnvironment();
  if (
    env.AI_MOCK_ENABLED === "true" &&
    appEnvironment() !== "production"
  ) {
    return new MockAiProvider();
  }
  const apiKey = env.AI_API_KEY ?? env.DEEPSEEK_API_KEY;
  if (!apiKey || !env.AI_TUTOR_MODEL) {
    return new UnavailableAiProvider();
  }
  return new OpenAiCompatibleProvider({
    apiKey,
    baseUrl: env.AI_BASE_URL ?? "https://api.deepseek.com",
    tutorModel: env.AI_TUTOR_MODEL,
    extractionModel: env.AI_EXTRACTION_MODEL ?? env.AI_TUTOR_MODEL,
    inputCostPerMillionMinorUsd: nonNegativeNumber(
      env.AI_INPUT_COST_PER_MILLION_MINOR_USD,
    ),
    outputCostPerMillionMinorUsd: nonNegativeNumber(
      env.AI_OUTPUT_COST_PER_MILLION_MINOR_USD,
    ),
  });
}

export function getAiTutorService(): AiTutorService {
  const repository = getAiRepository();
  return new AiTutorService(
    repository,
    getAiProvider(),
    getEntitlementService(),
    getFeatureFlagService(),
    new AiUsageService(repository),
  );
}

let developmentObjectStorage: InMemoryPrivateObjectStorage | null = null;

export function getPrivateObjectStorage(): PrivateObjectStorage {
  const env = getRuntimeEnvironment();
  if (env.UPLOADS) {
    return new R2PrivateObjectStorage(env.UPLOADS);
  }
  if (
    env.UPLOADS_MOCK_ENABLED === "true" &&
    appEnvironment() !== "production"
  ) {
    developmentObjectStorage ??= new InMemoryPrivateObjectStorage();
    return developmentObjectStorage;
  }
  return new UnavailablePrivateObjectStorage();
}

export function getResourceRepository(): ResourceRepository {
  return new ResourceRepository(getD1());
}

function adaptiveEmbeddingProvider(): {
  provider: Pick<AdaptiveAIProvider, "embed">;
  version: string;
} | null {
  const env = getRuntimeEnvironment();
  const apiKey = env.AI_API_KEY ?? env.DEEPSEEK_API_KEY;
  const embeddingModel = env.AI_EMBEDDING_MODEL?.trim();
  if (!apiKey || !embeddingModel) return null;
  const fallbackModel =
    env.AI_TUTOR_MODEL ?? env.AI_EXTRACTION_MODEL ?? "unused-text-model";
  return {
    provider: new OpenAICompatibleAIProvider({
      apiKey,
      baseUrl: env.AI_BASE_URL ?? "https://api.deepseek.com",
      embeddingModel,
      modelPolicy: new StaticModelPolicy({
        low: env.AI_LOW_COST_MODEL ?? fallbackModel,
        medium: env.AI_MEDIUM_MODEL ?? fallbackModel,
        high: env.AI_HIGH_CAPABILITY_MODEL ?? fallbackModel,
      }),
    }),
    version: env.AI_EMBEDDING_VERSION?.trim() || embeddingModel,
  };
}

export function getResourceIngestionService(): ResourceIngestionService {
  const embedding = adaptiveEmbeddingProvider();
  return new ResourceIngestionService(
    new ResourceIngestionRepository(getD1()),
    new DocumentIngestionPipeline({
      embeddingProvider: embedding?.provider,
      embeddingVersion: embedding?.version,
    }),
    embedding?.version ?? null,
  );
}

export function getResourceService(): ResourceService {
  return new ResourceService(
    getResourceRepository(),
    getAiRepository(),
    getPrivateObjectStorage(),
    getAiProvider(),
    getEntitlementService(),
    getFeatureFlagService(),
    getResourceIngestionService(),
  );
}

export function getCourseSyncService(): CourseSyncService {
  return new CourseSyncService(
    new ConnectorSyncRepository(getD1()),
    createCourseConnector,
    getResourceService(),
  );
}

export function getAiPracticeService(): AiPracticeService {
  const repository = getAiRepository();
  return new AiPracticeService(
    repository,
    getAiProvider(),
    new AiUsageService(repository),
    getEntitlementService(),
    getFeatureFlagService(),
    getLearningLoopService(),
  );
}

export function getAccountRepository(): AccountRepository {
  return new AccountRepository(getD1());
}

export function getAccountService(): AccountService {
  return new AccountService(
    getAccountRepository(),
    getPrivateObjectStorage(),
  );
}

export function getNotificationRepository(): NotificationRepository {
  return new NotificationRepository(getD1());
}

export function getNotificationService(): NotificationService {
  const env = getRuntimeEnvironment();
  if (!env.APP_BASE_URL) throw new Error("APP_BASE_URL is required.");
  const unsubscribeSecret = env.UNSUBSCRIBE_TOKEN_SECRET?.trim();
  if (
    unsubscribeSecret &&
    new TextEncoder().encode(unsubscribeSecret).byteLength < 32
  ) {
    throw new Error("UNSUBSCRIBE_TOKEN_SECRET must be at least 32 bytes.");
  }
  if (
    (appEnvironment() === "production" ||
      appEnvironment() === "preview") &&
    !unsubscribeSecret
  ) {
    throw new Error(
      "UNSUBSCRIBE_TOKEN_SECRET is required outside development.",
    );
  }
  return new NotificationService(
    getNotificationRepository(),
    getEmailSender(),
    getFeatureFlagService(),
    getEntitlementService(),
    env.APP_BASE_URL,
    unsubscribeSecret,
  );
}

export function getScheduledJobService(): ScheduledJobService {
  return new ScheduledJobService(
    getNotificationRepository(),
    getNotificationService(),
    getResourceService(),
  );
}

export function getAnalyticsService(): AnalyticsService {
  return new AnalyticsService(new AnalyticsRepository(getD1()));
}

export function getAdminService(): AdminService {
  return new AdminService(
    new AdminRepository(getD1()),
    new FeatureFlagRepository(getD1()),
    getFeatureFlagService(),
    appEnvironment(),
  );
}

export function getAcademicRepository(): AcademicRepository {
  return new AcademicRepository(getD1());
}

export function getAcademicService(): AcademicService {
  return new AcademicService(
    getAcademicRepository(),
    getEntitlementService(),
  );
}

export function getTurnstileVerifier(): TurnstileVerifier {
  const env = getRuntimeEnvironment();
  return new TurnstileVerifier(
    env.TURNSTILE_SECRET_KEY,
    env.TURNSTILE_REQUIRED === "true",
  );
}
