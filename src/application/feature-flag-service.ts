import { ApiError } from "../lib/api-errors.ts";
import type { AppEnvironment } from "./runtime.ts";
import type { FeatureFlagRepository } from "../repositories/feature-flag-repository.ts";

export const FEATURE_FLAG_KEYS = [
  "payments_enabled",
  "file_upload_enabled",
  "ai_tutor_enabled",
  "practice_generation_enabled",
  "weekly_report_enabled",
  "exam_sprint_enabled",
  "semester_pass_enabled",
  "admin_dashboard_enabled",
] as const;

export type FeatureFlagKey = (typeof FEATURE_FLAG_KEYS)[number];

const BASE_DEFAULTS: Record<FeatureFlagKey, boolean> = {
  payments_enabled: false,
  file_upload_enabled: false,
  ai_tutor_enabled: false,
  practice_generation_enabled: true,
  weekly_report_enabled: false,
  exam_sprint_enabled: false,
  semester_pass_enabled: false,
  admin_dashboard_enabled: false,
};

function environmentDefaults(
  environment: AppEnvironment,
): Record<FeatureFlagKey, boolean> {
  if (environment === "development" || environment === "test") {
    return {
      ...BASE_DEFAULTS,
      payments_enabled: true,
      file_upload_enabled: true,
      ai_tutor_enabled: true,
      weekly_report_enabled: true,
      admin_dashboard_enabled: true,
    };
  }
  return BASE_DEFAULTS;
}

export class FeatureFlagService {
  private readonly repository: FeatureFlagRepository;
  private readonly environment: AppEnvironment;

  constructor(
    repository: FeatureFlagRepository,
    environment: AppEnvironment,
  ) {
    this.repository = repository;
    this.environment = environment;
  }

  async enabled(flagKey: FeatureFlagKey): Promise<boolean> {
    const override = await this.repository.find(this.environment, flagKey);
    return override ?? environmentDefaults(this.environment)[flagKey];
  }

  async require(flagKey: FeatureFlagKey): Promise<void> {
    if (!(await this.enabled(flagKey))) {
      throw new ApiError(
        "FEATURE_DISABLED",
        404,
        "This feature is not available in the current environment.",
      );
    }
  }

  async list(): Promise<
    Array<{
      key: FeatureFlagKey;
      enabled: boolean;
      source: "default" | "override";
    }>
  > {
    const overrides = new Map(
      (await this.repository.list(this.environment)).map((row) => [
        row.flagKey,
        Boolean(row.enabled),
      ]),
    );
    const defaults = environmentDefaults(this.environment);
    return FEATURE_FLAG_KEYS.map((key) => ({
      key,
      enabled: overrides.get(key) ?? defaults[key],
      source: overrides.has(key) ? "override" : "default",
    }));
  }
}
