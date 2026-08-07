import type { D1DatabaseLike } from "./types.ts";

export interface AccountSettingsRecord {
  id: string;
  email: string;
  displayName: string | null;
  preferredLanguage: "zh-CN" | "en";
  timezone: string;
  createdAt: string;
  dailyStudyMinutes: number;
  preferredStudyStartTime: string | null;
  weekStartsOn: number;
  reminderEnabled: number | boolean;
  academicIntegrityMode: number | boolean;
  aiExplanationLanguage: "zh-CN" | "en";
}

export interface NotificationPreferenceRecord {
  tomorrowClasses: number | boolean;
  deadlineApproaching: number | boolean;
  dailyPlan: number | boolean;
  reviewDue: number | boolean;
  weeklyReport: number | boolean;
  marketing: number | boolean;
  unsubscribedAt: string | null;
}

export class AccountRepository {
  private readonly db: D1DatabaseLike;

  constructor(db: D1DatabaseLike) {
    this.db = db;
  }

  async settings(userId: string): Promise<AccountSettingsRecord | null> {
    return this.db
      .prepare(
        `SELECT
           u.id, u.email, u.display_name AS displayName,
           u.preferred_language AS preferredLanguage, u.timezone,
           u.created_at AS createdAt,
           s.daily_study_minutes AS dailyStudyMinutes,
           s.preferred_study_start_time AS preferredStudyStartTime,
           s.week_starts_on AS weekStartsOn,
           s.reminder_enabled AS reminderEnabled,
           s.academic_integrity_mode AS academicIntegrityMode,
           s.ai_explanation_language AS aiExplanationLanguage
         FROM users u
         INNER JOIN user_settings s ON s.user_id = u.id
         WHERE u.id = ? AND u.deleted_at IS NULL`,
      )
      .bind(userId)
      .first<AccountSettingsRecord>();
  }

  async updateProfile(input: {
    userId: string;
    displayName: string | null;
    preferredLanguage: "zh-CN" | "en";
    timezone: string;
    now: string;
  }): Promise<boolean> {
    const result = await this.db
      .prepare(
        `UPDATE users
         SET display_name = ?, preferred_language = ?, timezone = ?,
             updated_at = ?
         WHERE id = ? AND deleted_at IS NULL AND status = 'active'`,
      )
      .bind(
        input.displayName,
        input.preferredLanguage,
        input.timezone,
        input.now,
        input.userId,
      )
      .run();
    return Number(result.meta.changes ?? 0) > 0;
  }

  async updateStudySettings(input: {
    userId: string;
    dailyStudyMinutes: number;
    preferredStudyStartTime: string | null;
    weekStartsOn: number;
    reminderEnabled: boolean;
    academicIntegrityMode: boolean;
    aiExplanationLanguage: "zh-CN" | "en";
    now: string;
  }): Promise<boolean> {
    const result = await this.db
      .prepare(
        `UPDATE user_settings
         SET daily_study_minutes = ?,
             preferred_study_start_time = ?,
             week_starts_on = ?,
             reminder_enabled = ?,
             academic_integrity_mode = ?,
             ai_explanation_language = ?,
             updated_at = ?
         WHERE user_id = ?`,
      )
      .bind(
        input.dailyStudyMinutes,
        input.preferredStudyStartTime,
        input.weekStartsOn,
        input.reminderEnabled ? 1 : 0,
        input.academicIntegrityMode ? 1 : 0,
        input.aiExplanationLanguage,
        input.now,
        input.userId,
      )
      .run();
    return Number(result.meta.changes ?? 0) > 0;
  }

  async notificationPreferences(
    userId: string,
    now: string,
  ): Promise<NotificationPreferenceRecord> {
    await this.db
      .prepare(
        `INSERT OR IGNORE INTO notification_preferences (
           id, user_id, tomorrow_classes, deadline_approaching,
           daily_plan, review_due, weekly_report, marketing,
           created_at, updated_at
         ) VALUES (?, ?, 1, 1, 1, 1, 1, 0, ?, ?)`,
      )
      .bind(
        `notification_preferences_${userId}`,
        userId,
        now,
        now,
      )
      .run();
    const row = await this.db
      .prepare(
        `SELECT
           tomorrow_classes AS tomorrowClasses,
           deadline_approaching AS deadlineApproaching,
           daily_plan AS dailyPlan,
           review_due AS reviewDue,
           weekly_report AS weeklyReport,
           marketing,
           unsubscribed_at AS unsubscribedAt
         FROM notification_preferences
         WHERE user_id = ?`,
      )
      .bind(userId)
      .first<NotificationPreferenceRecord>();
    if (!row) throw new Error("Notification preferences could not be read.");
    return row;
  }

  async updateNotificationPreferences(input: {
    userId: string;
    tomorrowClasses: boolean;
    deadlineApproaching: boolean;
    dailyPlan: boolean;
    reviewDue: boolean;
    weeklyReport: boolean;
    marketing: boolean;
    now: string;
  }): Promise<void> {
    await this.notificationPreferences(input.userId, input.now);
    const allTransactionalDisabled =
      !input.tomorrowClasses &&
      !input.deadlineApproaching &&
      !input.dailyPlan &&
      !input.reviewDue &&
      !input.weeklyReport;
    await this.db
      .prepare(
        `UPDATE notification_preferences
         SET tomorrow_classes = ?, deadline_approaching = ?,
             daily_plan = ?, review_due = ?, weekly_report = ?,
             marketing = ?,
             unsubscribed_at = CASE WHEN ? THEN ? ELSE NULL END,
             updated_at = ?
         WHERE user_id = ?`,
      )
      .bind(
        input.tomorrowClasses ? 1 : 0,
        input.deadlineApproaching ? 1 : 0,
        input.dailyPlan ? 1 : 0,
        input.reviewDue ? 1 : 0,
        input.weeklyReport ? 1 : 0,
        input.marketing ? 1 : 0,
        allTransactionalDisabled ? 1 : 0,
        input.now,
        input.now,
        input.userId,
      )
      .run();
  }

  async unsubscribeEmailReminders(
    userId: string,
    now: string,
  ): Promise<boolean> {
    const result = await this.db
      .prepare(
        `UPDATE user_settings
         SET reminder_enabled = 0, updated_at = ?
         WHERE user_id = ?
           AND EXISTS (
             SELECT 1 FROM users
             WHERE users.id = user_settings.user_id
               AND users.status = 'active'
               AND users.deleted_at IS NULL
           )`,
      )
      .bind(now, userId)
      .run();
    return Number(result.meta.changes ?? 0) > 0;
  }

  async resourceStorageKeys(
    userId: string,
  ): Promise<Array<{ id: string; storageKey: string }>> {
    const result = await this.db
      .prepare(
        `SELECT id, storageKey FROM (
           SELECT id, storage_key AS storageKey
           FROM learning_resources
           WHERE user_id = ? AND storage_key != ''
           UNION
           SELECT id, storage_key AS storageKey
           FROM resource_versions
           WHERE user_id = ? AND storage_key != ''
             AND storage_key NOT LIKE '__deleted__/%'
         )
         GROUP BY storageKey`,
      )
      .bind(userId, userId)
      .all<{ id: string; storageKey: string }>();
    return result.results ?? [];
  }

  private async rows(
    query: string,
    userId: string,
  ): Promise<Array<Record<string, unknown>>> {
    const result = await this.db
      .prepare(query)
      .bind(userId)
      .all<Record<string, unknown>>();
    return result.results ?? [];
  }

  async exportData(userId: string): Promise<Record<string, unknown>> {
    const user = await this.db
      .prepare(
        `SELECT id, email, email_verified_at, display_name,
           preferred_language, timezone, role, status,
           onboarding_completed_at, created_at, updated_at
         FROM users WHERE id = ? AND deleted_at IS NULL`,
      )
      .bind(userId)
      .first<Record<string, unknown>>();
    if (!user) return {};
    const queries: Array<[string, string]> = [
      ["userSettings", "SELECT * FROM user_settings WHERE user_id = ?"],
      ["semesters", "SELECT * FROM user_semesters WHERE user_id = ?"],
      ["courses", "SELECT * FROM courses WHERE user_id = ?"],
      ["classSessions", "SELECT * FROM class_sessions WHERE user_id = ?"],
      ["assessments", "SELECT * FROM assessments WHERE user_id = ?"],
      ["topics", "SELECT * FROM topics WHERE user_id = ?"],
      ["studyTasks", "SELECT * FROM study_tasks WHERE user_id = ?"],
      ["focusSessions", "SELECT * FROM focus_sessions WHERE user_id = ?"],
      [
        "learningResources",
        `SELECT id, course_id, file_name, mime_type, file_size,
           resource_type, processing_status, retention_until,
           created_at, updated_at, deleted_at
         FROM learning_resources WHERE user_id = ?`,
      ],
      [
        "resourceExtractions",
        `SELECT resource_id, extracted_text, proposed_data_json, status,
           failure_code, created_at, updated_at, confirmed_at
         FROM resource_extractions WHERE user_id = ?`,
      ],
      [
        "ingestedResources",
        `SELECT id, course_id, legacy_resource_id, source_type, source_id,
           source_url, source_updated_at, title, resource_type, mime_type,
           status, current_version_id, last_synced_at, created_at, updated_at,
           deleted_at
         FROM resources WHERE user_id = ?`,
      ],
      [
        "resourceVersions",
        `SELECT id, resource_id, version_number, file_name, mime_type,
           file_hash, content_hash, size_bytes, source_updated_at,
           last_synced_at, parser_version, embedding_version,
           processing_status, quality_status, quality_report_json,
           is_active, created_at, updated_at, deleted_at
         FROM resource_versions WHERE user_id = ?`,
      ],
      [
        "resourceChunks",
        `SELECT id, course_id, resource_id, resource_version_id,
           sequence_number, content, content_hash, page, slide, section,
           timestamp_start, timestamp_end, source_url, embedding_version,
           reused_from_chunk_id, created_at, updated_at, deleted_at
         FROM resource_chunks WHERE user_id = ?`,
      ],
      [
        "resourceProcessingJobs",
        `SELECT id, resource_version_id, job_type, status, attempt_count,
           max_attempts, error_code, error_summary, started_at, completed_at,
           created_at, updated_at
         FROM resource_processing_jobs WHERE user_id = ?`,
      ],
      [
        "resourceSyncRuns",
        `SELECT id, course_id, connection_id, connector_id, source_course_id,
           status, discovered_count, created_count, updated_count,
           skipped_count, tombstoned_count, failed_count, details_json,
           started_at, completed_at, created_at, updated_at
         FROM resource_sync_runs WHERE user_id = ?`,
      ],
      [
        "privatePracticeQuestions",
        "SELECT * FROM practice_questions WHERE owner_user_id = ?",
      ],
      ["practiceAttempts", "SELECT * FROM practice_attempts WHERE user_id = ?"],
      ["practiceSessions", "SELECT * FROM practice_sessions WHERE user_id = ?"],
      ["masteryRecords", "SELECT * FROM mastery_records WHERE user_id = ?"],
      ["aiConversations", "SELECT * FROM ai_conversations WHERE user_id = ?"],
      ["aiMessages", "SELECT * FROM ai_messages WHERE user_id = ?"],
      ["aiUsage", "SELECT * FROM ai_usage_logs WHERE user_id = ?"],
      ["subscriptions", "SELECT * FROM subscriptions WHERE user_id = ?"],
      ["purchases", "SELECT * FROM purchases WHERE user_id = ?"],
      ["notifications", "SELECT * FROM notifications WHERE user_id = ?"],
      [
        "notificationPreferences",
        "SELECT * FROM notification_preferences WHERE user_id = ?",
      ],
      ["usageEvents", "SELECT * FROM usage_events WHERE user_id = ?"],
      ["auditLogs", "SELECT * FROM audit_logs WHERE actor_user_id = ?"],
    ];
    const sections = await Promise.all(
      queries.map(
        async ([key, query]) =>
          [key, await this.rows(query, userId)] as const,
      ),
    );
    return { user, ...Object.fromEntries(sections) };
  }

  async deleteAccount(input: {
    userId: string;
    auditId: string;
    now: string;
  }): Promise<boolean> {
    const existing = await this.db
      .prepare(
        `SELECT id, email FROM users WHERE id = ? AND deleted_at IS NULL`,
      )
      .bind(input.userId)
      .first<{ id: string; email: string }>();
    if (!existing) return false;
    await this.db.batch([
      this.db
        .prepare(
          `INSERT INTO audit_logs (
             id, actor_user_id, action, entity_type, entity_id,
             metadata_json, created_at
           ) VALUES (?, ?, 'account_deleted', 'user', ?, ?, ?)`,
        )
        .bind(
          input.auditId,
          input.userId,
          input.userId,
          JSON.stringify({ requestedBy: "self_service" }),
          input.now,
        ),
      this.db
        .prepare("DELETE FROM magic_link_tokens WHERE email = ?")
        .bind(existing.email),
      this.db
        .prepare(
          `INSERT INTO usage_events (
             id, user_id, event_name, event_category, properties_json,
             created_at
           ) VALUES (?, NULL, 'account_deleted', 'privacy', ?, ?)`,
        )
        .bind(
          `${input.auditId}_event`,
          JSON.stringify({ status: "completed" }),
          input.now,
        ),
      this.db
        .prepare("DELETE FROM users WHERE id = ?")
        .bind(input.userId),
    ]);
    return true;
  }
}
