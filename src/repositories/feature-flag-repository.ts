import type { AppEnvironment } from "../application/runtime.ts";
import type { D1DatabaseLike } from "./types.ts";

export interface FeatureFlagRecord {
  flagKey: string;
  enabled: number | boolean;
  updatedAt: string;
}

export class FeatureFlagRepository {
  private readonly db: D1DatabaseLike;

  constructor(db: D1DatabaseLike) {
    this.db = db;
  }

  async list(environment: AppEnvironment): Promise<FeatureFlagRecord[]> {
    const result = await this.db
      .prepare(
        `SELECT
           flag_key AS flagKey,
           enabled,
           updated_at AS updatedAt
         FROM feature_flags
         WHERE environment = ?
         ORDER BY flag_key`,
      )
      .bind(environment)
      .all<FeatureFlagRecord>();
    return result.results ?? [];
  }

  async find(
    environment: AppEnvironment,
    flagKey: string,
  ): Promise<boolean | null> {
    const row = await this.db
      .prepare(
        `SELECT enabled
         FROM feature_flags
         WHERE environment = ? AND flag_key = ?`,
      )
      .bind(environment, flagKey)
      .first<{ enabled: number | boolean }>();
    return row === null ? null : Boolean(row.enabled);
  }

  async set(input: {
    id: string;
    environment: AppEnvironment;
    flagKey: string;
    enabled: boolean;
    adminUserId: string;
    now: string;
  }): Promise<void> {
    await this.db
      .prepare(
        `INSERT INTO feature_flags (
           id, environment, flag_key, enabled, updated_by_user_id,
           created_at, updated_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(environment, flag_key) DO UPDATE SET
           enabled = excluded.enabled,
           updated_by_user_id = excluded.updated_by_user_id,
           updated_at = excluded.updated_at`,
      )
      .bind(
        input.id,
        input.environment,
        input.flagKey,
        input.enabled ? 1 : 0,
        input.adminUserId,
        input.now,
        input.now,
      )
      .run();
  }
}
