import type { D1DatabaseLike } from "./types.ts";

export interface AdminMetrics {
  totalUsers: number;
  newUsers7d: number;
  onboardingCompletedUsers: number;
  activeUsers7d: number;
  activeUsers28d: number;
  paidUsers: number;
  revenueMinorAud: number;
  aiCalls: number;
  aiCostMinorUsd: number;
  aiFailures: number;
  paymentWebhookFailures: number;
  scheduledJobFailures: number;
  completedTasks7d: number;
  completedPractice7d: number;
  completedReviews7d: number;
  dueRetestTasks7d: number;
  paidActiveUsers7d: number;
  refundedPurchases: number;
  completedPurchases: number;
}

export class AdminRepository {
  private readonly db: D1DatabaseLike;

  constructor(db: D1DatabaseLike) {
    this.db = db;
  }

  private async scalar(query: string, ...values: unknown[]): Promise<number> {
    const row = await this.db
      .prepare(query)
      .bind(...values)
      .first<{ value: number }>();
    return Number(row?.value ?? 0);
  }

  async metrics(now = new Date()): Promise<AdminMetrics> {
    const nowIso = now.toISOString();
    const sevenDays = new Date(
      now.getTime() - 7 * 86_400_000,
    ).toISOString();
    const twentyEightDays = new Date(
      now.getTime() - 28 * 86_400_000,
    ).toISOString();
    const [
      totalUsers,
      newUsers7d,
      onboardingCompletedUsers,
      activeUsers7d,
      activeUsers28d,
      paidUsers,
      revenueMinorAud,
      aiCalls,
      aiCostMinorUsd,
      aiFailures,
      paymentWebhookFailures,
      scheduledJobFailures,
      completedTasks7d,
      completedPractice7d,
      completedReviews7d,
      dueRetestTasks7d,
      paidActiveUsers7d,
      refundedPurchases,
      completedPurchases,
    ] = await Promise.all([
      this.scalar(
        "SELECT count(*) AS value FROM users WHERE deleted_at IS NULL",
      ),
      this.scalar(
        `SELECT count(*) AS value FROM users
         WHERE deleted_at IS NULL AND created_at >= ?`,
        sevenDays,
      ),
      this.scalar(
        `SELECT count(*) AS value FROM users
         WHERE deleted_at IS NULL AND onboarding_completed_at IS NOT NULL`,
      ),
      this.scalar(
        `SELECT count(DISTINCT user_id) AS value FROM usage_events
         WHERE user_id IS NOT NULL AND created_at >= ?`,
        sevenDays,
      ),
      this.scalar(
        `SELECT count(DISTINCT user_id) AS value FROM usage_events
         WHERE user_id IS NOT NULL AND created_at >= ?`,
        twentyEightDays,
      ),
      this.scalar(
        `SELECT count(DISTINCT user_id) AS value
         FROM (
           SELECT user_id FROM purchases
           WHERE status = 'active'
             AND (access_end_at IS NULL OR access_end_at > ?)
           UNION
           SELECT user_id FROM subscriptions
           WHERE status = 'active'
             AND (current_period_end IS NULL OR current_period_end > ?)
         )`,
        nowIso,
        nowIso,
      ),
      this.scalar(
        `SELECT coalesce(sum(amount_minor), 0) AS value
         FROM purchases WHERE status = 'active' AND currency = 'aud'`,
      ),
      this.scalar(
        `SELECT count(*) AS value FROM ai_usage_logs WHERE success = 1`,
      ),
      this.scalar(
        `SELECT coalesce(sum(estimated_cost_minor_usd), 0) AS value
         FROM ai_usage_logs WHERE success = 1`,
      ),
      this.scalar(
        `SELECT count(*) AS value FROM ai_usage_logs WHERE success = 0`,
      ),
      this.scalar(
        `SELECT count(*) AS value FROM payment_webhook_events
         WHERE status = 'failed'`,
      ),
      this.scalar(
        `SELECT count(*) AS value FROM scheduled_job_runs
         WHERE status = 'failed'`,
      ),
      this.scalar(
        `SELECT count(*) AS value FROM usage_events
         WHERE event_name = 'study_task_completed' AND created_at >= ?`,
        sevenDays,
      ),
      this.scalar(
        `SELECT count(*) AS value FROM usage_events
         WHERE event_name = 'practice_completed' AND created_at >= ?`,
        sevenDays,
      ),
      this.scalar(
        `SELECT count(*) AS value FROM usage_events
         WHERE event_name = 'review_completed' AND created_at >= ?`,
        sevenDays,
      ),
      this.scalar(
        `SELECT count(*) AS value FROM study_tasks
         WHERE task_type = 'retest' AND due_at IS NOT NULL
           AND due_at >= ? AND due_at < ?`,
        sevenDays,
        nowIso,
      ),
      this.scalar(
        `SELECT count(DISTINCT event.user_id) AS value
         FROM usage_events event
         WHERE event.created_at >= ? AND event.user_id IS NOT NULL
           AND (
             EXISTS (
               SELECT 1 FROM purchases p
               WHERE p.user_id = event.user_id AND p.status = 'active'
                 AND (p.access_end_at IS NULL OR p.access_end_at > ?)
             )
             OR EXISTS (
               SELECT 1 FROM subscriptions s
               WHERE s.user_id = event.user_id AND s.status = 'active'
                 AND (
                   s.current_period_end IS NULL
                   OR s.current_period_end > ?
                 )
             )
           )`,
        sevenDays,
        nowIso,
        nowIso,
      ),
      this.scalar(
        `SELECT count(*) AS value FROM purchases
         WHERE status = 'refunded'`,
      ),
      this.scalar(
        `SELECT count(*) AS value FROM purchases
         WHERE status IN ('active', 'refunded')`,
      ),
    ]);
    return {
      totalUsers,
      newUsers7d,
      onboardingCompletedUsers,
      activeUsers7d,
      activeUsers28d,
      paidUsers,
      revenueMinorAud,
      aiCalls,
      aiCostMinorUsd,
      aiFailures,
      paymentWebhookFailures,
      scheduledJobFailures,
      completedTasks7d,
      completedPractice7d,
      completedReviews7d,
      dueRetestTasks7d,
      paidActiveUsers7d,
      refundedPurchases,
      completedPurchases,
    };
  }

  async recentUsers(limit = 25) {
    const result = await this.db
      .prepare(
        `SELECT
           u.id, u.email, u.display_name AS displayName, u.role, u.status,
           u.onboarding_completed_at AS onboardingCompletedAt,
           u.created_at AS createdAt,
           CASE WHEN EXISTS (
             SELECT 1 FROM purchases p
             WHERE p.user_id = u.id AND p.status = 'active'
           ) OR EXISTS (
             SELECT 1 FROM subscriptions s
             WHERE s.user_id = u.id AND s.status = 'active'
           ) THEN 1 ELSE 0 END AS isPaid
         FROM users u
         WHERE u.deleted_at IS NULL
         ORDER BY u.created_at DESC
         LIMIT ?`,
      )
      .bind(limit)
      .all<{
        id: string;
        email: string;
        displayName: string | null;
        role: string;
        status: string;
        onboardingCompletedAt: string | null;
        createdAt: string;
        isPaid: number | boolean;
      }>();
    return result.results ?? [];
  }

  async updateUserStatus(input: {
    targetUserId: string;
    status: "active" | "suspended";
    actorUserId: string;
    auditId: string;
    now: string;
  }): Promise<boolean> {
    const result = await this.db
      .prepare(
        `UPDATE users SET status = ?, updated_at = ?
         WHERE id = ? AND role = 'student' AND deleted_at IS NULL`,
      )
      .bind(input.status, input.now, input.targetUserId)
      .run();
    if (Number(result.meta.changes ?? 0) < 1) return false;
    await this.db.batch([
      this.db
        .prepare(
          `UPDATE auth_sessions SET revoked_at = ?
           WHERE user_id = ? AND revoked_at IS NULL AND ? = 'suspended'`,
        )
        .bind(input.now, input.targetUserId, input.status),
      this.db
        .prepare(
          `INSERT INTO audit_logs (
             id, actor_user_id, action, entity_type, entity_id,
             metadata_json, created_at
           ) VALUES (?, ?, 'user_status_changed', 'user', ?, ?, ?)`,
        )
        .bind(
          input.auditId,
          input.actorUserId,
          input.targetUserId,
          JSON.stringify({ status: input.status }),
          input.now,
        ),
    ]);
    return true;
  }

  async courseTemplates() {
    const result = await this.db
      .prepare(
        `SELECT id, institution_id AS institutionId,
           course_code AS courseCode, course_name AS courseName,
           description, default_language AS defaultLanguage,
           colour_key AS colourKey, is_active AS isActive,
           updated_at AS updatedAt
         FROM course_templates ORDER BY course_code, course_name`,
      )
      .all<Record<string, unknown>>();
    return result.results ?? [];
  }

  async updateCourseTemplate(input: {
    id: string;
    courseCode: string | null;
    courseName: string;
    description: string | null;
    defaultLanguage: "zh-CN" | "en";
    isActive: boolean;
    actorUserId: string;
    auditId: string;
    now: string;
  }): Promise<boolean> {
    const result = await this.db
      .prepare(
        `UPDATE course_templates
         SET course_code = ?, course_name = ?, description = ?,
             default_language = ?, is_active = ?, updated_at = ?
         WHERE id = ?`,
      )
      .bind(
        input.courseCode,
        input.courseName,
        input.description,
        input.defaultLanguage,
        input.isActive ? 1 : 0,
        input.now,
        input.id,
      )
      .run();
    if (Number(result.meta.changes ?? 0) < 1) return false;
    await this.audit({
      id: input.auditId,
      actorUserId: input.actorUserId,
      action: "course_template_updated",
      entityType: "course_template",
      entityId: input.id,
      metadata: { isActive: input.isActive },
      now: input.now,
    });
    return true;
  }

  async createCourseTemplate(input: {
    id: string;
    institutionId: string | null;
    courseCode: string | null;
    courseName: string;
    description: string | null;
    defaultLanguage: "zh-CN" | "en";
    colourKey: string;
    actorUserId: string;
    auditId: string;
    now: string;
  }): Promise<boolean> {
    const result = await this.db
      .prepare(
        `INSERT INTO course_templates (
           id, institution_id, course_code, course_name, description,
           default_language, colour_key, is_active, created_at, updated_at
         )
         SELECT ?, ?, ?, ?, ?, ?, ?, 1, ?, ?
         WHERE ? IS NULL OR EXISTS (
           SELECT 1 FROM institutions
           WHERE id = ? AND is_active = 1
         )`,
      )
      .bind(
        input.id,
        input.institutionId,
        input.courseCode,
        input.courseName,
        input.description,
        input.defaultLanguage,
        input.colourKey,
        input.now,
        input.now,
        input.institutionId,
        input.institutionId,
      )
      .run();
    if (Number(result.meta.changes ?? 0) < 1) return false;
    await this.audit({
      id: input.auditId,
      actorUserId: input.actorUserId,
      action: "course_template_created",
      entityType: "course_template",
      entityId: input.id,
      metadata: {
        institutionId: input.institutionId,
        courseCode: input.courseCode,
      },
      now: input.now,
    });
    return true;
  }

  async publicPracticeQuestions(limit = 50) {
    const result = await this.db
      .prepare(
        `SELECT id, course_template_id AS courseTemplateId,
           question_type AS questionType, difficulty, prompt, language,
           source_type AS sourceType, review_status AS reviewStatus,
           updated_at AS updatedAt
         FROM practice_questions
         WHERE owner_user_id IS NULL
         ORDER BY updated_at DESC LIMIT ?`,
      )
      .bind(limit)
      .all<Record<string, unknown>>();
    return result.results ?? [];
  }

  async updateQuestionReview(input: {
    id: string;
    reviewStatus: "draft" | "reviewed" | "rejected";
    actorUserId: string;
    auditId: string;
    now: string;
  }): Promise<boolean> {
    const result = await this.db
      .prepare(
        `UPDATE practice_questions
         SET review_status = ?, updated_at = ?
         WHERE id = ? AND owner_user_id IS NULL`,
      )
      .bind(input.reviewStatus, input.now, input.id)
      .run();
    if (Number(result.meta.changes ?? 0) < 1) return false;
    await this.audit({
      id: input.auditId,
      actorUserId: input.actorUserId,
      action: "practice_question_reviewed",
      entityType: "practice_question",
      entityId: input.id,
      metadata: { reviewStatus: input.reviewStatus },
      now: input.now,
    });
    return true;
  }

  async createPublicQuestion(input: {
    id: string;
    courseTemplateId: string;
    questionType: string;
    difficulty: number;
    prompt: string;
    optionsJson: string | null;
    solution: string;
    hint1: string | null;
    hint2: string | null;
    hint3: string | null;
    explanation: string;
    language: "zh-CN" | "en";
    actorUserId: string;
    auditId: string;
    now: string;
  }): Promise<boolean> {
    const result = await this.db
      .prepare(
        `INSERT INTO practice_questions (
           id, course_template_id, question_type, difficulty, prompt,
           options_json, solution, hint_1, hint_2, hint_3, explanation,
           language, source_type, review_status, created_at, updated_at
         )
         SELECT ?, ct.id, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
           'original', 'draft', ?, ?
         FROM course_templates ct
         WHERE ct.id = ?`,
      )
      .bind(
        input.id,
        input.questionType,
        input.difficulty,
        input.prompt,
        input.optionsJson,
        input.solution,
        input.hint1,
        input.hint2,
        input.hint3,
        input.explanation,
        input.language,
        input.now,
        input.now,
        input.courseTemplateId,
      )
      .run();
    if (Number(result.meta.changes ?? 0) < 1) return false;
    await this.audit({
      id: input.auditId,
      actorUserId: input.actorUserId,
      action: "public_practice_question_created",
      entityType: "practice_question",
      entityId: input.id,
      metadata: {
        courseTemplateId: input.courseTemplateId,
        difficulty: input.difficulty,
      },
      now: input.now,
    });
    return true;
  }

  async recentPayments(limit = 50) {
    const result = await this.db
      .prepare(
        `SELECT p.id, u.email, p.product_key AS productKey,
           p.amount_minor AS amountMinor, p.currency, p.status,
           p.created_at AS createdAt, p.updated_at AS updatedAt
         FROM purchases p
         INNER JOIN users u ON u.id = p.user_id
         ORDER BY p.created_at DESC LIMIT ?`,
      )
      .bind(limit)
      .all<Record<string, unknown>>();
    return result.results ?? [];
  }

  async errorSummary(limit = 25) {
    const result = await this.db
      .prepare(
        `SELECT source, code, count(*) AS count, max(created_at) AS lastSeenAt
         FROM (
           SELECT 'ai' AS source,
             coalesce(error_code, 'UNKNOWN') AS code,
             created_at
           FROM ai_usage_logs WHERE success = 0
           UNION ALL
           SELECT 'stripe_webhook' AS source,
             coalesce(last_error, event_type) AS code,
             received_at AS created_at
           FROM payment_webhook_events WHERE status = 'failed'
           UNION ALL
           SELECT 'scheduled_job' AS source,
             coalesce(error_summary, job_name) AS code,
             started_at AS created_at
           FROM scheduled_job_runs WHERE status = 'failed'
         )
         GROUP BY source, code
         ORDER BY lastSeenAt DESC LIMIT ?`,
      )
      .bind(limit)
      .all<Record<string, unknown>>();
    return result.results ?? [];
  }

  async audit(input: {
    id: string;
    actorUserId: string;
    action: string;
    entityType: string;
    entityId: string | null;
    metadata: Record<string, unknown>;
    now: string;
  }): Promise<void> {
    await this.db
      .prepare(
        `INSERT INTO audit_logs (
           id, actor_user_id, action, entity_type, entity_id,
           metadata_json, created_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        input.id,
        input.actorUserId,
        input.action,
        input.entityType,
        input.entityId,
        JSON.stringify(input.metadata),
        input.now,
      )
      .run();
  }
}
