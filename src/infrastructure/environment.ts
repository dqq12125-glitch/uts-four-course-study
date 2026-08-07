import type { R2BucketLike } from "../services/storage/private-object-storage.ts";
import { validateProductionConfiguration } from "./production-config.ts";

export interface RuntimeEnvironment {
  DB?: D1Database;
  UPLOADS?: R2BucketLike;
  APP_ENV?: "development" | "preview" | "production" | "test";
  APP_BASE_URL?: string;
  MOBILE_APP_SCHEME?: string;
  MOBILE_APP_LINK_BASE_URL?: string;
  EMAIL_PROVIDER?: string;
  EMAIL_API_KEY?: string;
  EMAIL_FROM?: string;
  UNSUBSCRIBE_TOKEN_SECRET?: string;
  IP_HASH_SECRET?: string;
  CONNECTOR_TOKEN_ACTIVE_KEY_ID?: string;
  CONNECTOR_TOKEN_KEYS?: string;
  PERSONAL_OWNER_EMAIL?: string;
  PERSONAL_DEPLOYMENT?: string;
  DEEPSEEK_API_KEY?: string;
  AI_PROVIDER?: string;
  AI_API_KEY?: string;
  AI_BASE_URL?: string;
  AI_TUTOR_MODEL?: string;
  AI_EXTRACTION_MODEL?: string;
  AI_LOW_COST_MODEL?: string;
  AI_MEDIUM_MODEL?: string;
  AI_HIGH_CAPABILITY_MODEL?: string;
  AI_EMBEDDING_MODEL?: string;
  AI_EMBEDDING_VERSION?: string;
  AI_MOCK_ENABLED?: string;
  AI_INPUT_COST_PER_MILLION_MINOR_USD?: string;
  AI_OUTPUT_COST_PER_MILLION_MINOR_USD?: string;
  UPLOADS_MOCK_ENABLED?: string;
  DEVELOPMENT_FULL_ACCESS?: string;
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  STRIPE_FOUNDING_PASS_PRICE_ID?: string;
  STRIPE_SEMESTER_PASS_PRICE_ID?: string;
  STRIPE_EXAM_SPRINT_PRICE_ID?: string;
  PUBLIC_STRIPE_PUBLISHABLE_KEY?: string;
  PAYMENTS_MOCK_ENABLED?: string;
  FOUNDING_PASS_ACCESS_END_AT?: string;
  PUBLIC_TURNSTILE_SITE_KEY?: string;
  TURNSTILE_SECRET_KEY?: string;
  TURNSTILE_REQUIRED?: string;
  APPLE_TEAM_ID?: string;
  ANDROID_APP_LINK_SHA256_CERT_FINGERPRINTS?: string;
  [key: string]: unknown;
}

const environmentSlot = globalThis as typeof globalThis & {
  __DEEPSTUDY_RUNTIME_ENV__?: RuntimeEnvironment;
};

export function setRuntimeEnvironment(environment: RuntimeEnvironment): void {
  validateProductionConfiguration(environment);
  environmentSlot.__DEEPSTUDY_RUNTIME_ENV__ = environment;
}

export function getRuntimeEnvironment(): RuntimeEnvironment {
  const environment = environmentSlot.__DEEPSTUDY_RUNTIME_ENV__;
  if (!environment) {
    throw new Error("DeepStudy runtime environment is unavailable.");
  }
  return environment;
}
