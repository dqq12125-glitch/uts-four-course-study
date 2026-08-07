import type { D1DatabaseLike } from "./types.ts";

export interface NotificationUser {
  id: string;
  email: string;
  preferredLanguage: "zh-CN" | "en";
  timezone: string;
  role: "student" | "admin";
  reminderEnabled: number | boolean;
  preferredStudyStartTime: string | null;
  tomorrowClasses: number | boolean;
  deadlineApproaching: number | boolean;
  dailyPlan: number | boolean;
  reviewDue: number | boolean;
  weeklyReport: number | boolean;
}

export interface PendingEmailDelivery {
  id: string;
  notificationId: string;
  userId: string;
  email: string;
  preferredLanguage: "zh-CN" | "en";
  title: string;
  body: string;
  actionUrl: string | null;
  attempts: number;
}

export class NotificationRepository {
  private readonly db: D1DatabaseLike;

  constructor(db: D1DatabaseLike) {
    this.db = db;
  }

  async activeUsers(): Promise<NotificationUser[]> {
    const result = await this.db
      .prepare(
        `SELECT
           u.id, u.email, u.preferred_language AS preferredLanguage,
           u.timezone, u.role,
           s.reminder_enabled AS reminderEnabled,
           s.preferred_study_start_time AS preferredStudyStartTime,
           coalesce(p.tomorrow_classes, 1) AS tomorrowClasses,
           coalesce(p.deadline_approaching, 1) AS deadlineApproaching,
           coalesce(p.daily_plan, 1) AS dailyPlan,
           coalesce(p.review_due, 1) AS reviewDue,
           coalesce(p.weekly_report, 1) AS weeklyReport
         FROM users u
         INNER JOIN user_settings s ON s.user_id = u.id
         LEFT JOIN notification_preferences p ON p.user_id = u.id
         WHERE u.status = 'active' AND u.deleted_at IS NULL
           AND u.onboarding_completed_at IS NOT NULL`,
      )
      .all<NotificationUser>();
    return result.results ?? [];
  }

  async dailyTaskCount(
    userId: string,
    localDate: string,
  ): Promise<number> {
    const row = await this.db
      .prepare(
        `SELECT count(*) AS count FROM study_tasks
         WHERE user_id = ? AND scheduled_for = ?
           AND status IN ('queued', 'active', 'overdue')`,
      )
      .bind(userId, localDate)
      .first<{ count: number }>();
    return Number(row?.count ?? 0);
  }

  async deadlineCount(
    userId: string,
    from: string,
    to: string,
  ): Promise<number> {
    const row = await this.db
      .prepare(
        `SELECT count(*) AS count FROM assessments
         WHERE user_id = ? AND due_at >= ? AND due_at < ?
           AND status NOT IN ('submitted', 'completed')`,
      )
      .bind(userId, from, to)
      .first<{ count: number }>();
    return Number(row?.count ?? 0);
  }

  async dueReviewCount(userId: string, now: string): Promise<number> {
    const row = await this.db
      .prepare(
        `SELECT count(*) AS count FROM mastery_records
         WHERE user_id = ? AND next_review_at IS NOT NULL
           AND next_review_at <= ?`,
      )
      .bind(userId, now)
      .first<{ count: number }>();
    return Number(row?.count ?? 0);
  }

  async tomorrowClassCount(
    userId: string,
    dayOfWeek: number,
    date: string,
  ): Promise<number> {
    const row = await this.db
      .prepare(
        `SELECT count(*) AS count
         FROM class_sessions cs
         INNER JOIN courses c
           ON c.id = cs.course_id AND c.user_id = cs.user_id
           AND c.archived_at IS NULL
         WHERE cs.user_id = ? AND cs.day_of_week = ?
           AND (cs.start_date IS NULL OR cs.start_date <= ?)
           AND (cs.end_date IS NULL OR cs.end_date >= ?)`,
      )
      .bind(userId, dayOfWeek, date, date)
      .first<{ count: number }>();
    return Number(row?.count ?? 0);
  }

  async weeklyCompletedCount(
    userId: string,
    from: string,
    to: string,
  ): Promise<number> {
    const row = await this.db
      .prepare(
        `SELECT count(*) AS count FROM study_tasks
         WHERE user_id = ? AND completed_at >= ? AND completed_at < ?`,
      )
      .bind(userId, from, to)
      .first<{ count: number }>();
    return Number(row?.count ?? 0);
  }

  async createNotification(input: {
    id: string;
    inAppDeliveryId: string;
    emailDeliveryId: string | null;
    userId: string;
    notificationType: string;
    title: string;
    body: string;
    actionUrl: string;
    dedupeKey: string;
    scheduledFor: string;
    sendEmail: boolean;
    now: string;
  }): Promise<boolean> {
    const inserted = await this.db
      .prepare(
        `INSERT OR IGNORE INTO notifications (
           id, user_id, notification_type, title, body, action_url,
           dedupe_key, scheduled_for, created_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        input.id,
        input.userId,
        input.notificationType,
        input.title,
        input.body,
        input.actionUrl,
        input.dedupeKey,
        input.scheduledFor,
        input.now,
      )
      .run();
    if (Number(inserted.meta.changes ?? 0) < 1) return false;
    const statements = [
      this.db
        .prepare(
          `INSERT INTO notification_deliveries (
             id, notification_id, user_id, channel, status, attempts,
             sent_at, created_at, updated_at
           ) VALUES (?, ?, ?, 'in_app', 'sent', 1, ?, ?, ?)`,
        )
        .bind(
          input.inAppDeliveryId,
          input.id,
          input.userId,
          input.now,
          input.now,
          input.now,
        ),
    ];
    if (input.sendEmail && input.emailDeliveryId) {
      statements.push(
        this.db
          .prepare(
            `INSERT INTO notification_deliveries (
               id, notification_id, user_id, channel, status, attempts,
               next_attempt_at, created_at, updated_at
             ) VALUES (?, ?, ?, 'email', 'pending', 0, ?, ?, ?)`,
          )
          .bind(
            input.emailDeliveryId,
            input.id,
            input.userId,
            input.now,
            input.now,
            input.now,
          ),
      );
    }
    await this.db.batch(statements);
    return true;
  }

  async pendingEmailDeliveries(
    now: string,
    limit = 100,
  ): Promise<PendingEmailDelivery[]> {
    const result = await this.db
      .prepare(
        `SELECT
           d.id, d.notification_id AS notificationId,
           d.user_id AS userId, u.email,
           u.preferred_language AS preferredLanguage,
           n.title, n.body, n.action_url AS actionUrl, d.attempts
         FROM notification_deliveries d
         INNER JOIN notifications n ON n.id = d.notification_id
         INNER JOIN users u ON u.id = d.user_id
         WHERE d.channel = 'email'
           AND d.status IN ('pending', 'failed')
           AND d.attempts < 3
           AND (d.next_attempt_at IS NULL OR d.next_attempt_at <= ?)
           AND u.status = 'active' AND u.deleted_at IS NULL
         ORDER BY d.created_at
         LIMIT ?`,
      )
      .bind(now, limit)
      .all<PendingEmailDelivery>();
    return result.results ?? [];
  }

  async claimDelivery(
    deliveryId: string,
    now: string,
  ): Promise<boolean> {
    const result = await this.db
      .prepare(
        `UPDATE notification_deliveries
         SET status = 'sending', attempts = attempts + 1, updated_at = ?
         WHERE id = ? AND status IN ('pending', 'failed') AND attempts < 3`,
      )
      .bind(now, deliveryId)
      .run();
    return Number(result.meta.changes ?? 0) > 0;
  }

  async completeDelivery(input: {
    deliveryId: string;
    providerMessageId: string | null;
    now: string;
  }): Promise<void> {
    await this.db
      .prepare(
        `UPDATE notification_deliveries
         SET status = 'sent', provider_message_id = ?, sent_at = ?,
             next_attempt_at = NULL, last_error = NULL, updated_at = ?
         WHERE id = ? AND status = 'sending'`,
      )
      .bind(
        input.providerMessageId,
        input.now,
        input.now,
        input.deliveryId,
      )
      .run();
  }

  async failDelivery(input: {
    deliveryId: string;
    errorCode: string;
    nextAttemptAt: string;
    now: string;
  }): Promise<void> {
    await this.db
      .prepare(
        `UPDATE notification_deliveries
         SET status = 'failed', last_error = ?, next_attempt_at = ?,
             updated_at = ?
         WHERE id = ? AND status = 'sending'`,
      )
      .bind(
        input.errorCode,
        input.nextAttemptAt,
        input.now,
        input.deliveryId,
      )
      .run();
  }

  async list(
    userId: string,
    limit = 50,
  ): Promise<
    Array<{
      id: string;
      notificationType: string;
      title: string;
      body: string;
      actionUrl: string | null;
      scheduledFor: string;
      readAt: string | null;
    }>
  > {
    const result = await this.db
      .prepare(
        `SELECT id, notification_type AS notificationType, title, body,
           action_url AS actionUrl, scheduled_for AS scheduledFor,
           read_at AS readAt
         FROM notifications
         WHERE user_id = ?
         ORDER BY scheduled_for DESC
         LIMIT ?`,
      )
      .bind(userId, limit)
      .all<{
        id: string;
        notificationType: string;
        title: string;
        body: string;
        actionUrl: string | null;
        scheduledFor: string;
        readAt: string | null;
      }>();
    return result.results ?? [];
  }

  async markRead(
    userId: string,
    notificationId: string,
    now: string,
  ): Promise<boolean> {
    const result = await this.db
      .prepare(
        `UPDATE notifications SET read_at = coalesce(read_at, ?)
         WHERE id = ? AND user_id = ?`,
      )
      .bind(now, notificationId, userId)
      .run();
    return Number(result.meta.changes ?? 0) > 0;
  }

  async beginJob(input: {
    id: string;
    jobName: string;
    scheduledAt: string;
    startedAt: string;
  }): Promise<boolean> {
    const result = await this.db
      .prepare(
        `INSERT OR IGNORE INTO scheduled_job_runs (
           id, job_name, scheduled_at, started_at, status,
           processed_count, failed_count
         ) VALUES (?, ?, ?, ?, 'running', 0, 0)`,
      )
      .bind(
        input.id,
        input.jobName,
        input.scheduledAt,
        input.startedAt,
      )
      .run();
    return Number(result.meta.changes ?? 0) > 0;
  }

  async completeJob(input: {
    id: string;
    status: "completed" | "failed";
    processedCount: number;
    failedCount: number;
    errorSummary: string | null;
    completedAt: string;
  }): Promise<void> {
    await this.db
      .prepare(
        `UPDATE scheduled_job_runs
         SET status = ?, processed_count = ?, failed_count = ?,
             error_summary = ?, completed_at = ?
         WHERE id = ?`,
      )
      .bind(
        input.status,
        input.processedCount,
        input.failedCount,
        input.errorSummary,
        input.completedAt,
        input.id,
      )
      .run();
  }
}
