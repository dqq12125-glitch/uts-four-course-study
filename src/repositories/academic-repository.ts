import type { D1DatabaseLike } from "./types.ts";

export interface ClassSessionRecord {
  id: string;
  courseId: string;
  courseCode: string | null;
  courseName: string;
  sessionType: string;
  title: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  location: string | null;
  mapUrl: string | null;
  startDate: string | null;
  endDate: string | null;
  recurrenceRule: string | null;
}

export interface TopicRecord {
  id: string;
  courseId: string;
  title: string;
  description: string | null;
  weekNumber: number | null;
  sequenceNumber: number;
  masteryScore: number | null;
  nextReviewAt: string | null;
  attemptCount: number;
}

export interface PlanTaskRecord {
  id: string;
  courseId: string | null;
  courseCode: string | null;
  courseName: string | null;
  colourKey: string | null;
  topicId: string | null;
  assessmentId: string | null;
  title: string;
  description: string | null;
  completionCriteria: string;
  reason: string;
  taskType: string;
  priority: string;
  priorityScore: number;
  sortOrder: number;
  estimatedMinutes: number;
  scheduledFor: string;
  dueAt: string | null;
  status: string;
  generatedBy: string;
  completedAt: string | null;
}

export interface WeeklyCourseRecord {
  courseId: string;
  courseCode: string | null;
  courseName: string;
  colourKey: string;
  completedTasks: number;
  focusMinutes: number;
  practiceAttempts: number;
  correctAttempts: number;
  reviewsCompleted: number;
}

function changed(result: { meta: Record<string, unknown> }): boolean {
  return Number(result.meta.changes ?? 0) > 0;
}

export class AcademicRepository {
  private readonly db: D1DatabaseLike;

  constructor(db: D1DatabaseLike) {
    this.db = db;
  }

  async listClassSessions(
    userId: string,
    courseId?: string,
  ): Promise<ClassSessionRecord[]> {
    const result = await this.db
      .prepare(
        `SELECT
           cs.id, cs.course_id AS courseId,
           c.course_code AS courseCode, c.course_name AS courseName,
           cs.session_type AS sessionType, cs.title,
           cs.day_of_week AS dayOfWeek, cs.start_time AS startTime,
           cs.end_time AS endTime, cs.location, cs.map_url AS mapUrl,
           cs.start_date AS startDate, cs.end_date AS endDate,
           cs.recurrence_rule AS recurrenceRule
         FROM class_sessions cs
         INNER JOIN courses c
           ON c.id = cs.course_id
             AND c.user_id = cs.user_id
             AND c.archived_at IS NULL
         INNER JOIN user_semesters us
           ON us.id = c.user_semester_id
             AND us.user_id = cs.user_id
             AND us.status = 'active'
         WHERE cs.user_id = ?
           AND (? IS NULL OR cs.course_id = ?)
         ORDER BY cs.day_of_week, cs.start_time, cs.title`,
      )
      .bind(userId, courseId ?? null, courseId ?? null)
      .all<ClassSessionRecord>();
    return result.results ?? [];
  }

  async createClassSession(input: {
    id: string;
    userId: string;
    courseId: string;
    sessionType: string;
    title: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    location: string | null;
    mapUrl: string | null;
    startDate: string | null;
    endDate: string | null;
    recurrenceRule: string | null;
    now: string;
  }): Promise<boolean> {
    const result = await this.db
      .prepare(
        `INSERT INTO class_sessions (
           id, course_id, user_id, session_type, title, day_of_week,
           start_time, end_time, location, map_url, start_date, end_date,
           recurrence_rule, created_at, updated_at
         )
         SELECT ?, c.id, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
         FROM courses c
         INNER JOIN user_semesters us
           ON us.id = c.user_semester_id
             AND us.user_id = ?
             AND us.status = 'active'
         WHERE c.id = ? AND c.user_id = ? AND c.archived_at IS NULL`,
      )
      .bind(
        input.id,
        input.userId,
        input.sessionType,
        input.title,
        input.dayOfWeek,
        input.startTime,
        input.endTime,
        input.location,
        input.mapUrl,
        input.startDate,
        input.endDate,
        input.recurrenceRule,
        input.now,
        input.now,
        input.userId,
        input.courseId,
        input.userId,
      )
      .run();
    return changed(result);
  }

  async updateClassSession(input: {
    id: string;
    userId: string;
    sessionType: string;
    title: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    location: string | null;
    mapUrl: string | null;
    startDate: string | null;
    endDate: string | null;
    recurrenceRule: string | null;
    now: string;
  }): Promise<boolean> {
    const result = await this.db
      .prepare(
        `UPDATE class_sessions
         SET session_type = ?, title = ?, day_of_week = ?,
             start_time = ?, end_time = ?, location = ?, map_url = ?,
             start_date = ?, end_date = ?, recurrence_rule = ?,
             updated_at = ?
         WHERE id = ? AND user_id = ?
           AND EXISTS (
             SELECT 1 FROM courses c
             WHERE c.id = class_sessions.course_id
               AND c.user_id = ? AND c.archived_at IS NULL
           )`,
      )
      .bind(
        input.sessionType,
        input.title,
        input.dayOfWeek,
        input.startTime,
        input.endTime,
        input.location,
        input.mapUrl,
        input.startDate,
        input.endDate,
        input.recurrenceRule,
        input.now,
        input.id,
        input.userId,
        input.userId,
      )
      .run();
    return changed(result);
  }

  async deleteClassSession(
    userId: string,
    classSessionId: string,
  ): Promise<boolean> {
    const result = await this.db
      .prepare(
        `DELETE FROM class_sessions
         WHERE id = ? AND user_id = ?
           AND EXISTS (
             SELECT 1 FROM courses c
             WHERE c.id = class_sessions.course_id AND c.user_id = ?
           )`,
      )
      .bind(classSessionId, userId, userId)
      .run();
    return changed(result);
  }

  async listTopics(
    userId: string,
    courseId: string,
  ): Promise<TopicRecord[]> {
    const result = await this.db
      .prepare(
        `SELECT
           t.id, t.course_id AS courseId, t.title, t.description,
           t.week_number AS weekNumber, t.sequence_number AS sequenceNumber,
           mr.mastery_score AS masteryScore,
           mr.next_review_at AS nextReviewAt,
           (
             SELECT count(*) FROM practice_attempts pa
             WHERE pa.user_id = ? AND pa.topic_id = t.id
           ) AS attemptCount
         FROM topics t
         INNER JOIN courses c
           ON c.id = t.course_id
             AND c.user_id = t.user_id
             AND c.archived_at IS NULL
         LEFT JOIN mastery_records mr
           ON mr.topic_id = t.id AND mr.user_id = t.user_id
         WHERE t.user_id = ? AND t.course_id = ?
         ORDER BY t.sequence_number, t.week_number, t.title`,
      )
      .bind(userId, userId, courseId)
      .all<TopicRecord>();
    return result.results ?? [];
  }

  async createTopic(input: {
    id: string;
    userId: string;
    courseId: string;
    title: string;
    description: string | null;
    weekNumber: number | null;
    sequenceNumber: number;
    now: string;
  }): Promise<boolean> {
    const result = await this.db
      .prepare(
        `INSERT INTO topics (
           id, course_id, user_id, title, description, week_number,
           sequence_number, created_at, updated_at
         )
         SELECT ?, c.id, ?, ?, ?, ?, ?, ?, ?
         FROM courses c
         WHERE c.id = ? AND c.user_id = ? AND c.archived_at IS NULL`,
      )
      .bind(
        input.id,
        input.userId,
        input.title,
        input.description,
        input.weekNumber,
        input.sequenceNumber,
        input.now,
        input.now,
        input.courseId,
        input.userId,
      )
      .run();
    return changed(result);
  }

  async updateTopic(input: {
    id: string;
    userId: string;
    title: string;
    description: string | null;
    weekNumber: number | null;
    sequenceNumber: number;
    now: string;
  }): Promise<boolean> {
    const result = await this.db
      .prepare(
        `UPDATE topics
         SET title = ?, description = ?, week_number = ?,
             sequence_number = ?, updated_at = ?
         WHERE id = ? AND user_id = ?
           AND EXISTS (
             SELECT 1 FROM courses c
             WHERE c.id = topics.course_id
               AND c.user_id = ? AND c.archived_at IS NULL
           )`,
      )
      .bind(
        input.title,
        input.description,
        input.weekNumber,
        input.sequenceNumber,
        input.now,
        input.id,
        input.userId,
        input.userId,
      )
      .run();
    return changed(result);
  }

  async deleteTopic(userId: string, topicId: string): Promise<boolean> {
    const result = await this.db
      .prepare(
        `DELETE FROM topics
         WHERE id = ? AND user_id = ?
           AND NOT EXISTS (
             SELECT 1 FROM practice_attempts pa
             WHERE pa.topic_id = topics.id AND pa.user_id = ?
           )`,
      )
      .bind(topicId, userId, userId)
      .run();
    return changed(result);
  }

  async listPlan(input: {
    userId: string;
    startDate: string;
    endDate: string;
    courseId?: string | null;
  }): Promise<PlanTaskRecord[]> {
    const result = await this.db
      .prepare(
        `SELECT
           t.id, t.course_id AS courseId,
           c.course_code AS courseCode, c.course_name AS courseName,
           c.colour_key AS colourKey, t.topic_id AS topicId,
           t.assessment_id AS assessmentId, t.title, t.description,
           t.completion_criteria AS completionCriteria, t.reason,
           t.task_type AS taskType, t.priority,
           t.priority_score AS priorityScore, t.sort_order AS sortOrder,
           t.estimated_minutes AS estimatedMinutes,
           t.scheduled_for AS scheduledFor, t.due_at AS dueAt,
           t.status, t.generated_by AS generatedBy,
           t.completed_at AS completedAt
         FROM study_tasks t
         LEFT JOIN courses c
           ON c.id = t.course_id
             AND c.user_id = t.user_id
             AND c.archived_at IS NULL
         LEFT JOIN user_semesters us
           ON us.id = c.user_semester_id
             AND us.user_id = t.user_id
             AND us.status = 'active'
         WHERE t.user_id = ?
           AND t.scheduled_for BETWEEN ? AND ?
           AND (? IS NULL OR t.course_id = ?)
           AND (t.course_id IS NULL OR us.id IS NOT NULL)
         ORDER BY t.scheduled_for, t.sort_order, t.priority_score DESC,
           t.created_at`,
      )
      .bind(
        input.userId,
        input.startDate,
        input.endDate,
        input.courseId ?? null,
        input.courseId ?? null,
      )
      .all<PlanTaskRecord>();
    return result.results ?? [];
  }

  async createCustomTask(input: {
    id: string;
    userId: string;
    courseId: string | null;
    topicId: string | null;
    assessmentId: string | null;
    title: string;
    description: string | null;
    completionCriteria: string;
    taskType: string;
    priority: string;
    priorityScore: number;
    estimatedMinutes: number;
    scheduledFor: string;
    dueAt: string | null;
    now: string;
  }): Promise<boolean> {
    const result = await this.db
      .prepare(
        `INSERT INTO study_tasks (
           id, user_id, course_id, topic_id, assessment_id, title,
           description, completion_criteria, reason, task_type, priority,
           priority_score, sort_order, estimated_minutes, scheduled_for,
           due_at, status, generated_by, created_at, updated_at
         )
         SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?,
           'queued', 'user', ?, ?
         WHERE (
           ? IS NULL OR EXISTS (
             SELECT 1 FROM courses c
             INNER JOIN user_semesters us
               ON us.id = c.user_semester_id
                 AND us.user_id = ?
                 AND us.status = 'active'
             WHERE c.id = ? AND c.user_id = ? AND c.archived_at IS NULL
           )
         )
         AND (
           ? IS NULL OR EXISTS (
             SELECT 1 FROM topics t
             WHERE t.id = ? AND t.user_id = ?
               AND (? IS NULL OR t.course_id = ?)
           )
         )
         AND (
           ? IS NULL OR EXISTS (
             SELECT 1 FROM assessments a
             WHERE a.id = ? AND a.user_id = ?
               AND (? IS NULL OR a.course_id = ?)
           )
         )`,
      )
      .bind(
        input.id,
        input.userId,
        input.courseId,
        input.topicId,
        input.assessmentId,
        input.title,
        input.description,
        input.completionCriteria,
        "User-created task.",
        input.taskType,
        input.priority,
        input.priorityScore,
        input.estimatedMinutes,
        input.scheduledFor,
        input.dueAt,
        input.now,
        input.now,
        input.courseId,
        input.userId,
        input.courseId,
        input.userId,
        input.topicId,
        input.topicId,
        input.userId,
        input.courseId,
        input.courseId,
        input.assessmentId,
        input.assessmentId,
        input.userId,
        input.courseId,
        input.courseId,
      )
      .run();
    return changed(result);
  }

  async rescheduleTask(input: {
    userId: string;
    taskId: string;
    scheduledFor: string;
    now: string;
  }): Promise<boolean> {
    const result = await this.db
      .prepare(
        `UPDATE study_tasks
         SET scheduled_for = ?,
             status = CASE WHEN status = 'overdue' THEN 'queued' ELSE status END,
             sort_order = 0, updated_at = ?
         WHERE id = ? AND user_id = ?
           AND status IN ('queued', 'active', 'overdue')`,
      )
      .bind(input.scheduledFor, input.now, input.taskId, input.userId)
      .run();
    return changed(result);
  }

  async reorderTasks(input: {
    userId: string;
    scheduledFor: string;
    taskIds: string[];
    now: string;
  }): Promise<number> {
    const results = await this.db.batch(
      input.taskIds.map((taskId, index) =>
        this.db
          .prepare(
            `UPDATE study_tasks SET sort_order = ?, updated_at = ?
             WHERE id = ? AND user_id = ?
               AND scheduled_for = ?
               AND status IN ('queued', 'active', 'overdue')`,
          )
          .bind(
            index,
            input.now,
            taskId,
            input.userId,
            input.scheduledFor,
          ),
      ),
    );
    return results.reduce(
      (total, result) => total + Number(result.meta.changes ?? 0),
      0,
    );
  }

  async courseTaskSummary(userId: string, courseId: string) {
    const result = await this.db
      .prepare(
        `SELECT id, title, completion_criteria AS completionCriteria,
           task_type AS taskType, priority, estimated_minutes AS estimatedMinutes,
           scheduled_for AS scheduledFor, status
         FROM study_tasks
         WHERE user_id = ? AND course_id = ?
         ORDER BY
           CASE status WHEN 'active' THEN 0 WHEN 'queued' THEN 1 ELSE 2 END,
           scheduled_for, priority_score DESC
         LIMIT 20`,
      )
      .bind(userId, courseId)
      .all<Record<string, unknown>>();
    return result.results ?? [];
  }

  async courseResourceSummary(userId: string, courseId: string) {
    const result = await this.db
      .prepare(
        `SELECT id, file_name AS fileName, resource_type AS resourceType,
           processing_status AS processingStatus, created_at AS createdAt
         FROM learning_resources
         WHERE user_id = ? AND course_id = ? AND deleted_at IS NULL
         ORDER BY created_at DESC LIMIT 20`,
      )
      .bind(userId, courseId)
      .all<Record<string, unknown>>();
    return result.results ?? [];
  }

  async courseAttemptSummary(userId: string, courseId: string) {
    const result = await this.db
      .prepare(
        `SELECT pa.id, pa.is_correct AS isCorrect, pa.hints_used AS hintsUsed,
           pa.error_type AS errorType, pa.attempted_at AS attemptedAt,
           t.title AS topicTitle
         FROM practice_attempts pa
         INNER JOIN topics t
           ON t.id = pa.topic_id AND t.user_id = pa.user_id
         WHERE pa.user_id = ? AND t.course_id = ?
         ORDER BY pa.attempted_at DESC LIMIT 10`,
      )
      .bind(userId, courseId)
      .all<Record<string, unknown>>();
    return result.results ?? [];
  }

  async weeklyReport(input: {
    userId: string;
    from: string;
    to: string;
    now: string;
  }): Promise<{
    completedTasks: number;
    focusMinutes: number;
    practiceAttempts: number;
    correctAttempts: number;
    reviewsCompleted: number;
    dueReviews: number;
    courses: WeeklyCourseRecord[];
    weakTopics: Array<{
      courseName: string;
      topicTitle: string;
      masteryScore: number;
      nextReviewAt: string | null;
      lastErrorType: string | null;
    }>;
  }> {
    const [totals, courses, weakTopics] = await Promise.all([
      this.db
        .prepare(
          `SELECT
             (
               SELECT count(*) FROM study_tasks
               WHERE user_id = ? AND completed_at >= ? AND completed_at < ?
             ) AS completedTasks,
             (
               SELECT coalesce(sum(actual_seconds), 0) / 60
               FROM focus_sessions
               WHERE user_id = ? AND ended_at >= ? AND ended_at < ?
                 AND completion_status IN ('completed', 'partial')
             ) AS focusMinutes,
             (
               SELECT count(*) FROM practice_attempts
               WHERE user_id = ? AND attempted_at >= ? AND attempted_at < ?
             ) AS practiceAttempts,
             (
               SELECT count(*) FROM practice_attempts
               WHERE user_id = ? AND attempted_at >= ? AND attempted_at < ?
                 AND is_correct = 1
             ) AS correctAttempts,
             (
               SELECT count(*) FROM usage_events
               WHERE user_id = ? AND event_name = 'review_completed'
                 AND created_at >= ? AND created_at < ?
             ) AS reviewsCompleted,
             (
               SELECT count(*) FROM mastery_records
               WHERE user_id = ? AND next_review_at IS NOT NULL
                 AND next_review_at <= ?
             ) AS dueReviews`,
        )
        .bind(
          input.userId,
          input.from,
          input.to,
          input.userId,
          input.from,
          input.to,
          input.userId,
          input.from,
          input.to,
          input.userId,
          input.from,
          input.to,
          input.userId,
          input.from,
          input.to,
          input.userId,
          input.now,
        )
        .first<{
          completedTasks: number;
          focusMinutes: number;
          practiceAttempts: number;
          correctAttempts: number;
          reviewsCompleted: number;
          dueReviews: number;
        }>(),
      this.db
        .prepare(
          `SELECT
             c.id AS courseId, c.course_code AS courseCode,
             c.course_name AS courseName, c.colour_key AS colourKey,
             (
               SELECT count(*) FROM study_tasks task
               WHERE task.user_id = ? AND task.course_id = c.id
                 AND task.completed_at >= ? AND task.completed_at < ?
             ) AS completedTasks,
             (
               SELECT coalesce(sum(fs.actual_seconds), 0) / 60
               FROM focus_sessions fs
               INNER JOIN study_tasks task ON task.id = fs.study_task_id
               WHERE fs.user_id = ? AND task.course_id = c.id
                 AND fs.ended_at >= ? AND fs.ended_at < ?
                 AND fs.completion_status IN ('completed', 'partial')
             ) AS focusMinutes,
             (
               SELECT count(*) FROM practice_attempts pa
               INNER JOIN topics practice_topic
                 ON practice_topic.id = pa.topic_id
                   AND practice_topic.user_id = pa.user_id
               WHERE pa.user_id = ? AND practice_topic.course_id = c.id
                 AND pa.attempted_at >= ? AND pa.attempted_at < ?
             ) AS practiceAttempts,
             (
               SELECT count(*) FROM practice_attempts pa
               INNER JOIN topics correct_topic
                 ON correct_topic.id = pa.topic_id
                   AND correct_topic.user_id = pa.user_id
               WHERE pa.user_id = ? AND correct_topic.course_id = c.id
                 AND pa.attempted_at >= ? AND pa.attempted_at < ?
                 AND pa.is_correct = 1
             ) AS correctAttempts,
             (
               SELECT count(*) FROM practice_attempts pa
               INNER JOIN topics review_topic
                 ON review_topic.id = pa.topic_id
                   AND review_topic.user_id = pa.user_id
               INNER JOIN study_tasks review_task
                 ON review_task.id = pa.study_task_id
                   AND review_task.user_id = pa.user_id
                   AND review_task.task_type = 'retest'
               WHERE pa.user_id = ? AND review_topic.course_id = c.id
                 AND pa.attempted_at >= ? AND pa.attempted_at < ?
             ) AS reviewsCompleted
           FROM courses c
           INNER JOIN user_semesters us
             ON us.id = c.user_semester_id
               AND us.user_id = c.user_id
               AND us.status = 'active'
           WHERE c.user_id = ? AND c.archived_at IS NULL
           ORDER BY c.course_name`,
        )
        .bind(
          input.userId,
          input.from,
          input.to,
          input.userId,
          input.from,
          input.to,
          input.userId,
          input.from,
          input.to,
          input.userId,
          input.from,
          input.to,
          input.userId,
          input.from,
          input.to,
          input.userId,
        )
        .all<WeeklyCourseRecord>(),
      this.db
        .prepare(
          `SELECT c.course_name AS courseName, t.title AS topicTitle,
             mr.mastery_score AS masteryScore,
             mr.next_review_at AS nextReviewAt,
             (
               SELECT pa.error_type FROM practice_attempts pa
               WHERE pa.user_id = ? AND pa.topic_id = t.id
               ORDER BY pa.attempted_at DESC LIMIT 1
             ) AS lastErrorType
           FROM mastery_records mr
           INNER JOIN topics t
             ON t.id = mr.topic_id AND t.user_id = mr.user_id
           INNER JOIN courses c
             ON c.id = mr.course_id AND c.user_id = mr.user_id
             AND c.archived_at IS NULL
           WHERE mr.user_id = ?
           ORDER BY
             CASE WHEN mr.next_review_at <= ? THEN 0 ELSE 1 END,
             mr.mastery_score, mr.next_review_at
           LIMIT 5`,
        )
        .bind(input.userId, input.userId, input.now)
        .all<{
          courseName: string;
          topicTitle: string;
          masteryScore: number;
          nextReviewAt: string | null;
          lastErrorType: string | null;
        }>(),
    ]);
    return {
      completedTasks: Number(totals?.completedTasks ?? 0),
      focusMinutes: Math.floor(Number(totals?.focusMinutes ?? 0)),
      practiceAttempts: Number(totals?.practiceAttempts ?? 0),
      correctAttempts: Number(totals?.correctAttempts ?? 0),
      reviewsCompleted: Number(totals?.reviewsCompleted ?? 0),
      dueReviews: Number(totals?.dueReviews ?? 0),
      courses: courses.results ?? [],
      weakTopics: weakTopics.results ?? [],
    };
  }

  async recentActivityInstants(
    userId: string,
    since: string,
  ): Promise<string[]> {
    const result = await this.db
      .prepare(
        `SELECT happenedAt FROM (
           SELECT completed_at AS happenedAt
           FROM study_tasks
           WHERE user_id = ? AND completed_at >= ?
           UNION ALL
           SELECT ended_at AS happenedAt
           FROM focus_sessions
           WHERE user_id = ? AND ended_at >= ?
             AND completion_status IN ('completed', 'partial')
           UNION ALL
           SELECT attempted_at AS happenedAt
           FROM practice_attempts
           WHERE user_id = ? AND attempted_at >= ?
         )
         WHERE happenedAt IS NOT NULL
         ORDER BY happenedAt DESC`,
      )
      .bind(userId, since, userId, since, userId, since)
      .all<{ happenedAt: string }>();
    return (result.results ?? []).map((row) => row.happenedAt);
  }
}
