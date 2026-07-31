import type { D1DatabaseLike } from "./types.ts";

export interface AuthUser {
  id: string;
  email: string;
  emailVerifiedAt: string | null;
  displayName: string | null;
  preferredLanguage: "zh-CN" | "en";
  timezone: string;
  role: "student" | "admin";
  status: "active" | "suspended" | "deleted";
  onboardingCompletedAt: string | null;
}

interface MagicLinkRow {
  id: string;
  email: string;
  expires_at: string;
  consumed_at: string | null;
}

function changed(meta: Record<string, unknown>): boolean {
  return Number(meta.changes ?? 0) > 0;
}

export class AuthRepository {
  private readonly db: D1DatabaseLike;

  constructor(db: D1DatabaseLike) {
    this.db = db;
  }

  async takeRateLimit(
    key: string,
    limit: number,
    windowSeconds: number,
    now: Date,
  ): Promise<boolean> {
    const nowIso = now.toISOString();
    const expiresAt = new Date(now.getTime() + windowSeconds * 1000);
    const result = await this.db
      .prepare(
        `INSERT INTO auth_rate_limits (
           key, count, window_started_at, expires_at
         ) VALUES (?, 1, ?, ?)
         ON CONFLICT(key) DO UPDATE SET
           count = CASE
             WHEN auth_rate_limits.expires_at <= ? THEN 1
             ELSE auth_rate_limits.count + 1
           END,
           window_started_at = CASE
             WHEN auth_rate_limits.expires_at <= ?
               THEN excluded.window_started_at
             ELSE auth_rate_limits.window_started_at
           END,
           expires_at = CASE
             WHEN auth_rate_limits.expires_at <= ?
               THEN excluded.expires_at
             ELSE auth_rate_limits.expires_at
           END
         RETURNING count`,
      )
      .bind(
        key,
        nowIso,
        expiresAt.toISOString(),
        nowIso,
        nowIso,
        nowIso,
      )
      .first<{ count: number }>();
    return result !== null && Number(result.count) <= limit;
  }

  async findUserByEmail(email: string): Promise<AuthUser | null> {
    return this.db
      .prepare(
        `SELECT
           id,
           email,
           email_verified_at AS emailVerifiedAt,
           display_name AS displayName,
           preferred_language AS preferredLanguage,
           timezone,
           role,
           status,
           onboarding_completed_at AS onboardingCompletedAt
         FROM users
         WHERE email = ? AND deleted_at IS NULL`,
      )
      .bind(email)
      .first<AuthUser>();
  }

  async createMagicLink(input: {
    id: string;
    email: string;
    tokenHash: string;
    expiresAt: string;
    createdAt: string;
    requestedIpHash: string | null;
  }): Promise<void> {
    await this.db
      .prepare(
        `INSERT INTO magic_link_tokens (
           id, email, token_hash, expires_at, created_at, requested_ip_hash
         ) VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        input.id,
        input.email,
        input.tokenHash,
        input.expiresAt,
        input.createdAt,
        input.requestedIpHash,
      )
      .run();
  }

  async consumeMagicLink(
    tokenHash: string,
    now: Date,
  ): Promise<{ id: string; email: string } | null> {
    const nowIso = now.toISOString();
    const token = await this.db
      .prepare(
        `SELECT id, email, expires_at, consumed_at
         FROM magic_link_tokens
         WHERE token_hash = ?`,
      )
      .bind(tokenHash)
      .first<MagicLinkRow>();

    if (
      !token ||
      token.consumed_at !== null ||
      token.expires_at <= nowIso
    ) {
      return null;
    }

    const result = await this.db
      .prepare(
        `UPDATE magic_link_tokens
         SET consumed_at = ?
         WHERE id = ? AND consumed_at IS NULL AND expires_at > ?`,
      )
      .bind(nowIso, token.id, nowIso)
      .run();

    return changed(result.meta)
      ? { id: token.id, email: token.email }
      : null;
  }

  async getOrCreateVerifiedUser(input: {
    id: string;
    settingsId: string;
    email: string;
    now: string;
  }): Promise<AuthUser> {
    const inserted = await this.db
      .prepare(
        `INSERT OR IGNORE INTO users (
           id, email, email_verified_at, preferred_language, timezone,
           role, status, created_at, updated_at
         ) VALUES (?, ?, ?, 'zh-CN', 'Australia/Sydney',
           'student', 'active', ?, ?)`,
      )
      .bind(input.id, input.email, input.now, input.now, input.now)
      .run();
    await this.db
      .prepare(
        `UPDATE users
         SET email_verified_at = COALESCE(email_verified_at, ?),
             updated_at = ?
         WHERE email = ? AND deleted_at IS NULL`,
      )
      .bind(input.now, input.now, input.email)
      .run();

    const user = await this.findUserByEmail(input.email);
    if (!user || user.status !== "active") {
      throw new Error("Verified user is not active.");
    }

    const statements = [
      this.db
        .prepare(
          `INSERT OR IGNORE INTO user_settings (
             id, user_id, daily_study_minutes, week_starts_on,
             reminder_enabled, academic_integrity_mode,
             ai_explanation_language, created_at, updated_at
           ) VALUES (?, ?, 60, 1, 1, 1, 'zh-CN', ?, ?)`,
        )
        .bind(input.settingsId, user.id, input.now, input.now),
      this.db
        .prepare(
          `INSERT OR IGNORE INTO usage_events (
             id, user_id, event_name, event_category, properties_json,
             created_at
           ) VALUES (?, ?, 'email_verified', 'activation', '{}', ?)`,
        )
        .bind(`event_email_verified_${user.id}`, user.id, input.now),
    ];
    if (Number(inserted.meta.changes ?? 0) > 0) {
      statements.push(
        this.db
          .prepare(
            `INSERT OR IGNORE INTO usage_events (
               id, user_id, event_name, event_category, properties_json,
               created_at
             ) VALUES (?, ?, 'user_signed_up', 'acquisition', '{}', ?)`,
          )
          .bind(`event_user_signed_up_${user.id}`, user.id, input.now),
      );
    }
    await this.db.batch(statements);

    return user;
  }

  async createSession(input: {
    id: string;
    userId: string;
    tokenHash: string;
    expiresAt: string;
    now: string;
  }): Promise<void> {
    await this.db
      .prepare(
        `INSERT INTO auth_sessions (
           id, user_id, token_hash, expires_at, last_seen_at, created_at
         ) VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        input.id,
        input.userId,
        input.tokenHash,
        input.expiresAt,
        input.now,
        input.now,
      )
      .run();
  }

  async findUserBySessionHash(
    tokenHash: string,
    now: Date,
  ): Promise<AuthUser | null> {
    const nowIso = now.toISOString();
    const user = await this.db
      .prepare(
        `SELECT
           u.id,
           u.email,
           u.email_verified_at AS emailVerifiedAt,
           u.display_name AS displayName,
           u.preferred_language AS preferredLanguage,
           u.timezone,
           u.role,
           u.status,
           u.onboarding_completed_at AS onboardingCompletedAt
         FROM auth_sessions s
         INNER JOIN users u ON u.id = s.user_id
         WHERE s.token_hash = ?
           AND s.revoked_at IS NULL
           AND s.expires_at > ?
           AND u.status = 'active'
           AND u.deleted_at IS NULL`,
      )
      .bind(tokenHash, nowIso)
      .first<AuthUser>();

    if (user) {
      await this.db
        .prepare(
          `UPDATE auth_sessions
           SET last_seen_at = ?
           WHERE token_hash = ?`,
        )
        .bind(nowIso, tokenHash)
        .run();
    }
    return user;
  }

  async revokeSession(tokenHash: string, now: Date): Promise<void> {
    await this.db
      .prepare(
        `UPDATE auth_sessions
         SET revoked_at = ?
         WHERE token_hash = ? AND revoked_at IS NULL`,
      )
      .bind(now.toISOString(), tokenHash)
      .run();
  }
}
