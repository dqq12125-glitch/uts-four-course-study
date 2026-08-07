import type { D1DatabaseLike, D1ResultLike } from "./types.ts";

export interface OwnedTaskRecord {
  id: string;
  courseId: string | null;
  topicId: string | null;
  title: string;
  taskType: string;
  status: "queued" | "active" | "completed" | "skipped" | "overdue";
  priority: "low" | "medium" | "high" | "critical";
  priorityScore: number;
  estimatedMinutes: number;
  scheduledFor: string;
  dueAt: string | null;
}

export interface FocusSessionRecord {
  id: string;
  studyTaskId: string | null;
  plannedMinutes: number;
  actualSeconds: number | null;
  startedAt: string;
  endedAt: string | null;
  completionStatus: "active" | "completed" | "partial" | "abandoned";
  difficulty: number | null;
  needsMorePractice: number;
  confidenceAfter: number | null;
}

export interface PracticeCourseRecord {
  id: string;
  courseCode: string | null;
  courseName: string;
  colourKey: string;
  questionCount: number;
  dueReviewCount: number;
}

export interface TopicRecord {
  id: string;
  courseId: string;
  title: string;
}

export interface PracticeQuestionRecord {
  id: string;
  courseId: string;
  courseCode: string | null;
  courseName: string;
  topicId: string;
  topicTitle: string;
  questionType:
    | "single_choice"
    | "multiple_choice"
    | "short_answer"
    | "numeric";
  difficulty: number;
  prompt: string;
  optionsJson: string | null;
  solution: string;
  hint1: string | null;
  hint2: string | null;
  hint3: string | null;
  explanation: string;
  language: "zh-CN" | "en";
  sourceType: "original" | "ai_generated" | "user_generated";
}

export interface PracticeSessionRecord extends PracticeQuestionRecord {
  sessionId: string;
  studyTaskId: string | null;
  sessionStatus: "active" | "completed" | "abandoned";
  hintsUsed: number;
  incorrectAttempts: number;
  confidenceBefore: number | null;
  startedAt: string;
  completedAt: string | null;
}

export interface MasteryRecord {
  id: string;
  courseId: string;
  topicId: string;
  masteryScore: number;
  confidenceScore: number;
  lastAttemptAt: string | null;
  lastCorrectAt: string | null;
  nextReviewAt: string | null;
  reviewIntervalHours: number;
  consecutiveCorrect: number;
  consecutiveIncorrect: number;
}

export interface MasterySummaryRecord extends MasteryRecord {
  courseCode: string | null;
  courseName: string;
  colourKey: string;
  topicTitle: string;
  attemptCount: number;
  lastErrorType: string | null;
  reviewTaskId: string | null;
}

export interface PracticeAttemptRecord {
  id: string;
  topicId: string;
  confidenceAfter: number | null;
  errorType: string;
}

export interface RebalanceTaskRecord {
  id: string;
  scheduledFor: string;
  dueAt: string | null;
  priority: "low" | "medium" | "high" | "critical";
  priorityScore: number;
  estimatedMinutes: number;
  status: "queued" | "active" | "overdue";
}

export interface AttemptAndMasteryWrite {
  attempt: {
    id: string;
    userId: string;
    practiceQuestionId: string;
    topicId: string;
    practiceSessionId: string;
    studyTaskId: string | null;
    answer: string;
    isCorrect: boolean;
    score: number;
    confidenceBefore: number | null;
    hintsUsed: number;
    incorrectAttempts: number;
    timeSpentSeconds: number;
    isDelayedReview: boolean;
    attemptedAt: string;
  };
  mastery: MasteryRecord & {
    userId: string;
    createdAt: string;
    updatedAt: string;
  };
  reviewTask:
    | {
        mode: "insert";
        id: string;
        title: string;
        description: string;
        completionCriteria: string;
        reason: string;
        priority: "medium" | "high";
        priorityScore: number;
        estimatedMinutes: number;
        scheduledFor: string;
        dueAt: string;
      }
    | {
        mode: "update";
        id: string;
        title: string;
        reason: string;
        priority: "medium" | "high";
        priorityScore: number;
        scheduledFor: string;
        dueAt: string;
      };
}

function changed(result: D1ResultLike): boolean {
  return Number(result.meta.changes ?? 0) > 0;
}

export class LearningLoopRepository {
  private readonly db: D1DatabaseLike;

  constructor(db: D1DatabaseLike) {
    this.db = db;
  }

  async findOwnedTask(
    userId: string,
    taskId: string,
  ): Promise<OwnedTaskRecord | null> {
    return this.db
      .prepare(
        `SELECT
           t.id,
           t.course_id AS courseId,
           t.topic_id AS topicId,
           t.title,
           t.task_type AS taskType,
           t.status,
           t.priority,
           t.priority_score AS priorityScore,
           t.estimated_minutes AS estimatedMinutes,
           t.scheduled_for AS scheduledFor,
           t.due_at AS dueAt
         FROM study_tasks t
         WHERE t.id = ?
           AND t.user_id = ?
           AND (
             t.course_id IS NULL
             OR EXISTS (
               SELECT 1 FROM courses c
               WHERE c.id = t.course_id
                 AND c.user_id = ?
                 AND c.archived_at IS NULL
             )
           )`,
      )
      .bind(taskId, userId, userId)
      .first<OwnedTaskRecord>();
  }

  async findActiveFocusSession(
    userId: string,
    taskId?: string | null,
  ): Promise<FocusSessionRecord | null> {
    const taskClause = taskId ? "AND fs.study_task_id = ?" : "";
    const statement = this.db
      .prepare(
        `SELECT
           fs.id,
           fs.study_task_id AS studyTaskId,
           fs.planned_minutes AS plannedMinutes,
           fs.actual_seconds AS actualSeconds,
           fs.started_at AS startedAt,
           fs.ended_at AS endedAt,
           fs.completion_status AS completionStatus,
           fs.difficulty,
           fs.needs_more_practice AS needsMorePractice,
           fs.confidence_after AS confidenceAfter
         FROM focus_sessions fs
         WHERE fs.user_id = ?
           AND fs.completion_status = 'active'
           AND fs.ended_at IS NULL
           ${taskClause}
         ORDER BY fs.started_at DESC
         LIMIT 1`,
      );
    return (taskId ? statement.bind(userId, taskId) : statement.bind(userId))
      .first<FocusSessionRecord>();
  }

  async findFocusSession(
    userId: string,
    sessionId: string,
  ): Promise<FocusSessionRecord | null> {
    return this.db
      .prepare(
        `SELECT
           fs.id,
           fs.study_task_id AS studyTaskId,
           fs.planned_minutes AS plannedMinutes,
           fs.actual_seconds AS actualSeconds,
           fs.started_at AS startedAt,
           fs.ended_at AS endedAt,
           fs.completion_status AS completionStatus,
           fs.difficulty,
           fs.needs_more_practice AS needsMorePractice,
           fs.confidence_after AS confidenceAfter
         FROM focus_sessions fs
         WHERE fs.id = ? AND fs.user_id = ?`,
      )
      .bind(sessionId, userId)
      .first<FocusSessionRecord>();
  }

  async createFocusSession(input: {
    id: string;
    userId: string;
    taskId: string;
    plannedMinutes: number;
    startedAt: string;
  }): Promise<void> {
    await this.db.batch([
      this.db
        .prepare(
          `INSERT INTO focus_sessions (
             id, user_id, study_task_id, planned_minutes, started_at,
             completion_status, created_at
           ) VALUES (?, ?, ?, ?, ?, 'active', ?)`,
        )
        .bind(
          input.id,
          input.userId,
          input.taskId,
          input.plannedMinutes,
          input.startedAt,
          input.startedAt,
        ),
      this.db
        .prepare(
          `UPDATE study_tasks
           SET status = CASE WHEN status = 'queued' THEN 'active' ELSE status END,
               updated_at = ?
           WHERE id = ? AND user_id = ?
             AND status IN ('queued', 'active', 'overdue')`,
        )
        .bind(input.startedAt, input.taskId, input.userId),
    ]);
  }

  async completeFocusSession(input: {
    userId: string;
    sessionId: string;
    actualSeconds: number;
    endedAt: string;
    completionStatus: "completed" | "partial" | "abandoned";
    difficulty: number | null;
    needsMorePractice: boolean;
    confidenceAfter: number | null;
    taskId: string | null;
  }): Promise<boolean> {
    const statements = [
      this.db
        .prepare(
          `UPDATE focus_sessions
           SET actual_seconds = ?,
               ended_at = ?,
               completion_status = ?,
               difficulty = ?,
               needs_more_practice = ?,
               confidence_after = ?
           WHERE id = ? AND user_id = ?
             AND completion_status = 'active'
             AND ended_at IS NULL`,
        )
        .bind(
          input.actualSeconds,
          input.endedAt,
          input.completionStatus,
          input.difficulty,
          input.needsMorePractice ? 1 : 0,
          input.confidenceAfter,
          input.sessionId,
          input.userId,
        ),
    ];

    if (input.taskId) {
      statements.push(
        this.db
          .prepare(
            `UPDATE study_tasks
             SET status = ?,
                 completed_at = CASE WHEN ? = 'completed' THEN ? ELSE NULL END,
                 updated_at = ?
             WHERE id = ? AND user_id = ?
               AND status IN ('queued', 'active', 'overdue')`,
          )
          .bind(
            input.completionStatus === "completed" ? "completed" : "active",
            input.completionStatus,
            input.endedAt,
            input.endedAt,
            input.taskId,
            input.userId,
          ),
      );
    }

    const [result] = await this.db.batch(statements);
    return changed(result);
  }

  async listPracticeCourses(
    userId: string,
    now = new Date().toISOString(),
  ): Promise<PracticeCourseRecord[]> {
    const result = await this.db
      .prepare(
        `SELECT
           c.id,
           c.course_code AS courseCode,
           c.course_name AS courseName,
           c.colour_key AS colourKey,
           COUNT(DISTINCT pq.id) AS questionCount,
           COUNT(DISTINCT CASE
             WHEN mr.next_review_at IS NOT NULL
               AND mr.next_review_at <= ?
             THEN mr.id
           END) AS dueReviewCount
         FROM courses c
         INNER JOIN user_semesters us
           ON us.id = c.user_semester_id
             AND us.user_id = ?
             AND us.status = 'active'
         LEFT JOIN practice_questions pq
           ON (
             pq.owner_user_id = ?
             AND pq.course_id = c.id
           ) OR (
             pq.owner_user_id IS NULL
             AND pq.source_type = 'original'
             AND pq.review_status = 'reviewed'
             AND pq.course_template_id = c.course_template_id
           )
         LEFT JOIN mastery_records mr
           ON mr.user_id = ?
             AND mr.course_id = c.id
         WHERE c.user_id = ?
           AND c.archived_at IS NULL
         GROUP BY c.id
         ORDER BY c.created_at`,
      )
      .bind(now, userId, userId, userId, userId)
      .all<PracticeCourseRecord>();
    return result.results ?? [];
  }

  async findTopicByTitle(
    userId: string,
    courseId: string,
    title: string,
  ): Promise<TopicRecord | null> {
    return this.db
      .prepare(
        `SELECT t.id, t.course_id AS courseId, t.title
         FROM topics t
         INNER JOIN courses c
           ON c.id = t.course_id
             AND c.user_id = ?
             AND c.archived_at IS NULL
         WHERE t.user_id = ?
           AND t.course_id = ?
           AND lower(t.title) = lower(?)
         LIMIT 1`,
      )
      .bind(userId, userId, courseId, title)
      .first<TopicRecord>();
  }

  async createTopic(input: {
    id: string;
    userId: string;
    courseId: string;
    title: string;
    now: string;
  }): Promise<boolean> {
    const result = await this.db
      .prepare(
        `INSERT INTO topics (
           id, course_id, user_id, title, sequence_number, created_at, updated_at
         )
         SELECT ?, c.id, ?, ?, 0, ?, ?
         FROM courses c
         INNER JOIN user_semesters us
           ON us.id = c.user_semester_id
             AND us.user_id = ?
             AND us.status = 'active'
         WHERE c.id = ?
           AND c.user_id = ?
           AND c.archived_at IS NULL`,
      )
      .bind(
        input.id,
        input.userId,
        input.title,
        input.now,
        input.now,
        input.userId,
        input.courseId,
        input.userId,
      )
      .run();
    return changed(result);
  }

  async createPrivateQuestion(input: {
    id: string;
    userId: string;
    courseId: string;
    topicId: string;
    difficulty: number;
    prompt: string;
    optionsJson: string;
    solution: string;
    hint1: string | null;
    hint2: string | null;
    hint3: string | null;
    explanation: string;
    language: "zh-CN" | "en";
    sourceType: "user_generated" | "ai_generated";
    now: string;
  }): Promise<boolean> {
    const result = await this.db
      .prepare(
        `INSERT INTO practice_questions (
           id, course_id, topic_id, owner_user_id, question_type,
           difficulty, prompt, options_json, solution, hint_1, hint_2,
           hint_3, explanation, language, source_type, review_status,
           created_at, updated_at
         )
         SELECT
           ?, c.id, t.id, ?, 'single_choice', ?, ?, ?, ?, ?, ?, ?, ?,
           ?, ?, 'draft', ?, ?
         FROM topics t
         INNER JOIN courses c
           ON c.id = t.course_id
             AND c.user_id = ?
             AND c.archived_at IS NULL
         WHERE t.id = ?
           AND t.user_id = ?
           AND c.id = ?`,
      )
      .bind(
        input.id,
        input.userId,
        input.difficulty,
        input.prompt,
        input.optionsJson,
        input.solution,
        input.hint1,
        input.hint2,
        input.hint3,
        input.explanation,
        input.language,
        input.sourceType,
        input.now,
        input.now,
        input.userId,
        input.topicId,
        input.userId,
        input.courseId,
      )
      .run();
    return changed(result);
  }

  async selectPracticeQuestion(
    userId: string,
    courseId: string,
    topicId: string | null,
    now: string,
  ): Promise<PracticeQuestionRecord | null> {
    return this.db
      .prepare(
        `SELECT
           pq.id,
           c.id AS courseId,
           c.course_code AS courseCode,
           c.course_name AS courseName,
           t.id AS topicId,
           t.title AS topicTitle,
           pq.question_type AS questionType,
           pq.difficulty,
           pq.prompt,
           pq.options_json AS optionsJson,
           pq.solution,
           pq.hint_1 AS hint1,
           pq.hint_2 AS hint2,
           pq.hint_3 AS hint3,
           pq.explanation,
           pq.language,
           pq.source_type AS sourceType
         FROM practice_questions pq
         INNER JOIN topics t
           ON t.id = pq.topic_id
             AND t.user_id = ?
         INNER JOIN courses c
           ON c.id = t.course_id
             AND c.user_id = ?
             AND c.archived_at IS NULL
         INNER JOIN user_semesters us
           ON us.id = c.user_semester_id
             AND us.user_id = ?
             AND us.status = 'active'
         LEFT JOIN mastery_records mr
           ON mr.user_id = ?
             AND mr.topic_id = t.id
         LEFT JOIN (
           SELECT practice_question_id, MAX(attempted_at) AS last_attempted_at
           FROM practice_attempts
           WHERE user_id = ?
           GROUP BY practice_question_id
         ) recent ON recent.practice_question_id = pq.id
         WHERE c.id = ?
           AND (? IS NULL OR t.id = ?)
           AND (
             (pq.owner_user_id = ? AND pq.course_id = c.id)
             OR (
               pq.owner_user_id IS NULL
               AND pq.source_type = 'original'
               AND pq.review_status = 'reviewed'
               AND pq.course_template_id = c.course_template_id
             )
           )
         ORDER BY
           CASE
             WHEN mr.next_review_at IS NOT NULL
               AND mr.next_review_at <= ?
             THEN 0
             WHEN mr.id IS NULL THEN 1
             ELSE 2
           END,
           COALESCE(mr.mastery_score, 0),
           recent.last_attempted_at IS NOT NULL,
           recent.last_attempted_at,
           pq.difficulty
         LIMIT 1`,
      )
      .bind(
        userId,
        userId,
        userId,
        userId,
        userId,
        courseId,
        topicId,
        topicId,
        userId,
        now,
      )
      .first<PracticeQuestionRecord>();
  }

  async createPracticeSession(input: {
    id: string;
    userId: string;
    question: PracticeQuestionRecord;
    studyTaskId: string | null;
    confidenceBefore: number | null;
    now: string;
  }): Promise<void> {
    await this.db
      .prepare(
        `INSERT INTO practice_sessions (
           id, user_id, course_id, topic_id, practice_question_id,
           study_task_id, status, hints_used, confidence_before,
           started_at, created_at
         ) VALUES (?, ?, ?, ?, ?, ?, 'active', 0, ?, ?, ?)`,
      )
      .bind(
        input.id,
        input.userId,
        input.question.courseId,
        input.question.topicId,
        input.question.id,
        input.studyTaskId,
        input.confidenceBefore,
        input.now,
        input.now,
      )
      .run();
  }

  async findActivePracticeSession(
    userId: string,
  ): Promise<PracticeSessionRecord | null> {
    const row = await this.db
      .prepare(
        `SELECT id
         FROM practice_sessions
         WHERE user_id = ? AND status = 'active'
         ORDER BY started_at DESC
         LIMIT 1`,
      )
      .bind(userId)
      .first<{ id: string }>();
    return row ? this.findPracticeSession(userId, row.id) : null;
  }

  async findPracticeSession(
    userId: string,
    sessionId: string,
  ): Promise<PracticeSessionRecord | null> {
    return this.db
      .prepare(
        `SELECT
           ps.id AS sessionId,
           ps.study_task_id AS studyTaskId,
           ps.status AS sessionStatus,
           ps.hints_used AS hintsUsed,
           ps.incorrect_attempts AS incorrectAttempts,
           ps.confidence_before AS confidenceBefore,
           ps.started_at AS startedAt,
           ps.completed_at AS completedAt,
           pq.id,
           c.id AS courseId,
           c.course_code AS courseCode,
           c.course_name AS courseName,
           t.id AS topicId,
           t.title AS topicTitle,
           pq.question_type AS questionType,
           pq.difficulty,
           pq.prompt,
           pq.options_json AS optionsJson,
           pq.solution,
           pq.hint_1 AS hint1,
           pq.hint_2 AS hint2,
           pq.hint_3 AS hint3,
           pq.explanation,
           pq.language,
           pq.source_type AS sourceType
         FROM practice_sessions ps
         INNER JOIN practice_questions pq
           ON pq.id = ps.practice_question_id
         INNER JOIN topics t
           ON t.id = ps.topic_id
             AND t.user_id = ?
         INNER JOIN courses c
           ON c.id = ps.course_id
             AND c.id = t.course_id
             AND c.user_id = ?
             AND c.archived_at IS NULL
         WHERE ps.id = ?
           AND ps.user_id = ?
           AND (
             pq.owner_user_id = ?
             OR (
               pq.owner_user_id IS NULL
               AND pq.source_type = 'original'
               AND pq.review_status = 'reviewed'
             )
           )`,
      )
      .bind(userId, userId, sessionId, userId, userId)
      .first<PracticeSessionRecord>();
  }

  async incrementHintsUsed(
    userId: string,
    sessionId: string,
  ): Promise<boolean> {
    const result = await this.db
      .prepare(
        `UPDATE practice_sessions
         SET hints_used = hints_used + 1
         WHERE id = ? AND user_id = ?
           AND status = 'active'
           AND hints_used < 3`,
      )
      .bind(sessionId, userId)
      .run();
    return changed(result);
  }

  async recordIncorrectAttempt(
    userId: string,
    sessionId: string,
    expectedAttempts: number,
  ): Promise<boolean> {
    const result = await this.db
      .prepare(
        `UPDATE practice_sessions
         SET incorrect_attempts = incorrect_attempts + 1
         WHERE id = ? AND user_id = ?
           AND status = 'active'
           AND incorrect_attempts = ?
           AND incorrect_attempts < 3`,
      )
      .bind(sessionId, userId, expectedAttempts)
      .run();
    return changed(result);
  }

  async findMastery(
    userId: string,
    topicId: string,
  ): Promise<MasteryRecord | null> {
    return this.db
      .prepare(
        `SELECT
           mr.id,
           mr.course_id AS courseId,
           mr.topic_id AS topicId,
           mr.mastery_score AS masteryScore,
           mr.confidence_score AS confidenceScore,
           mr.last_attempt_at AS lastAttemptAt,
           mr.last_correct_at AS lastCorrectAt,
           mr.next_review_at AS nextReviewAt,
           mr.review_interval_hours AS reviewIntervalHours,
           mr.consecutive_correct AS consecutiveCorrect,
           mr.consecutive_incorrect AS consecutiveIncorrect
         FROM mastery_records mr
         INNER JOIN topics t
           ON t.id = mr.topic_id
             AND t.user_id = ?
         INNER JOIN courses c
           ON c.id = mr.course_id
             AND c.id = t.course_id
             AND c.user_id = ?
         WHERE mr.user_id = ?
           AND mr.topic_id = ?`,
      )
      .bind(userId, userId, userId, topicId)
      .first<MasteryRecord>();
  }

  async findOpenRetestTask(
    userId: string,
    topicId: string,
  ): Promise<OwnedTaskRecord | null> {
    return this.db
      .prepare(
        `SELECT
           t.id,
           t.course_id AS courseId,
           t.topic_id AS topicId,
           t.title,
           t.task_type AS taskType,
           t.status,
           t.priority,
           t.priority_score AS priorityScore,
           t.estimated_minutes AS estimatedMinutes,
           t.scheduled_for AS scheduledFor,
           t.due_at AS dueAt
         FROM study_tasks t
         INNER JOIN topics topic
           ON topic.id = t.topic_id
             AND topic.user_id = ?
         WHERE t.user_id = ?
           AND t.topic_id = ?
           AND t.task_type = 'retest'
           AND t.status IN ('queued', 'active', 'overdue')
         LIMIT 1`,
      )
      .bind(userId, userId, topicId)
      .first<OwnedTaskRecord>();
  }

  async saveAttemptAndMastery(
    input: AttemptAndMasteryWrite,
  ): Promise<void> {
    const statements = [
      this.db
        .prepare(
          `INSERT INTO practice_attempts (
             id, user_id, practice_question_id, topic_id,
             practice_session_id, study_task_id, answer, is_correct,
             score, confidence_before, hints_used, time_spent_seconds,
             incorrect_attempts, error_type, attempted_at
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'unknown', ?)`,
        )
        .bind(
          input.attempt.id,
          input.attempt.userId,
          input.attempt.practiceQuestionId,
          input.attempt.topicId,
          input.attempt.practiceSessionId,
          input.attempt.studyTaskId,
          input.attempt.answer,
          input.attempt.isCorrect ? 1 : 0,
          input.attempt.score,
          input.attempt.confidenceBefore,
          input.attempt.hintsUsed,
          input.attempt.timeSpentSeconds,
          input.attempt.incorrectAttempts,
          input.attempt.attemptedAt,
        ),
      this.db
        .prepare(
          `INSERT INTO mastery_records (
             id, user_id, course_id, topic_id, mastery_score,
             confidence_score, last_attempt_at, last_correct_at,
             next_review_at, review_interval_hours, consecutive_correct,
             consecutive_incorrect, created_at, updated_at
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(user_id, topic_id) DO UPDATE SET
             mastery_score = excluded.mastery_score,
             confidence_score = excluded.confidence_score,
             last_attempt_at = excluded.last_attempt_at,
             last_correct_at = excluded.last_correct_at,
             next_review_at = excluded.next_review_at,
             review_interval_hours = excluded.review_interval_hours,
             consecutive_correct = excluded.consecutive_correct,
             consecutive_incorrect = excluded.consecutive_incorrect,
             updated_at = excluded.updated_at`,
        )
        .bind(
          input.mastery.id,
          input.mastery.userId,
          input.mastery.courseId,
          input.mastery.topicId,
          input.mastery.masteryScore,
          input.mastery.confidenceScore,
          input.mastery.lastAttemptAt,
          input.mastery.lastCorrectAt,
          input.mastery.nextReviewAt,
          input.mastery.reviewIntervalHours,
          input.mastery.consecutiveCorrect,
          input.mastery.consecutiveIncorrect,
          input.mastery.createdAt,
          input.mastery.updatedAt,
        ),
      this.db
        .prepare(
          `UPDATE practice_sessions
           SET status = 'completed', completed_at = ?
           WHERE id = ? AND user_id = ? AND status = 'active'`,
        )
        .bind(
          input.attempt.attemptedAt,
          input.attempt.practiceSessionId,
          input.attempt.userId,
        ),
    ];

    if (input.attempt.studyTaskId) {
      statements.push(
        this.db
          .prepare(
            `UPDATE study_tasks
             SET status = 'completed',
                 completed_at = ?,
                 updated_at = ?
             WHERE id = ? AND user_id = ?
               AND status IN ('queued', 'active', 'overdue')`,
          )
          .bind(
            input.attempt.attemptedAt,
            input.attempt.attemptedAt,
            input.attempt.studyTaskId,
            input.attempt.userId,
          ),
      );
    }

    if (input.reviewTask.mode === "update") {
      statements.push(
        this.db
          .prepare(
            `UPDATE study_tasks
             SET title = ?,
                 reason = ?,
                 priority = ?,
                 priority_score = ?,
                 scheduled_for = ?,
                 due_at = ?,
                 status = 'queued',
                 completed_at = NULL,
                 updated_at = ?
             WHERE id = ? AND user_id = ?
               AND topic_id = ?
               AND task_type = 'retest'
               AND status IN ('queued', 'active', 'overdue')`,
          )
          .bind(
            input.reviewTask.title,
            input.reviewTask.reason,
            input.reviewTask.priority,
            input.reviewTask.priorityScore,
            input.reviewTask.scheduledFor,
            input.reviewTask.dueAt,
            input.attempt.attemptedAt,
            input.reviewTask.id,
            input.attempt.userId,
            input.attempt.topicId,
          ),
      );
    } else {
      statements.push(
        this.db
          .prepare(
            `INSERT INTO study_tasks (
               id, user_id, course_id, topic_id, title, description,
               completion_criteria, reason, task_type, priority,
               priority_score, estimated_minutes, scheduled_for, due_at,
               status, generated_by, created_at, updated_at
             ) VALUES (
               ?, ?, ?, ?, ?, ?, ?, ?, 'retest', ?, ?, ?, ?, ?,
               'queued', 'rule', ?, ?
             )`,
          )
          .bind(
            input.reviewTask.id,
            input.attempt.userId,
            input.mastery.courseId,
            input.mastery.topicId,
            input.reviewTask.title,
            input.reviewTask.description,
            input.reviewTask.completionCriteria,
            input.reviewTask.reason,
            input.reviewTask.priority,
            input.reviewTask.priorityScore,
            input.reviewTask.estimatedMinutes,
            input.reviewTask.scheduledFor,
            input.reviewTask.dueAt,
            input.attempt.attemptedAt,
            input.attempt.attemptedAt,
          ),
      );
    }

    statements.push(
      this.db
        .prepare(
          `INSERT INTO usage_events (
             id, user_id, event_name, event_category, properties_json, created_at
           ) VALUES (?, ?, 'practice_completed', 'learning', ?, ?)`,
        )
        .bind(
          `event_${input.attempt.id}`,
          input.attempt.userId,
          JSON.stringify({
            correct: input.attempt.isCorrect,
            hintsUsed: input.attempt.hintsUsed,
            isReview: input.attempt.isDelayedReview,
          }),
          input.attempt.attemptedAt,
        ),
    );
    if (input.attempt.isDelayedReview) {
      statements.push(
        this.db
          .prepare(
            `INSERT INTO usage_events (
               id, user_id, event_name, event_category, properties_json,
               created_at
             ) VALUES (?, ?, 'review_completed', 'learning', ?, ?)`,
          )
          .bind(
            `event_review_${input.attempt.id}`,
            input.attempt.userId,
            JSON.stringify({
              correct: input.attempt.isCorrect,
              hintsUsed: input.attempt.hintsUsed,
              isReview: true,
            }),
            input.attempt.attemptedAt,
          ),
      );
    }

    await this.db.batch(statements);
  }

  async findAttempt(
    userId: string,
    attemptId: string,
  ): Promise<PracticeAttemptRecord | null> {
    return this.db
      .prepare(
        `SELECT
           pa.id,
           pa.topic_id AS topicId,
           pa.confidence_after AS confidenceAfter,
           pa.error_type AS errorType
         FROM practice_attempts pa
         INNER JOIN topics t
           ON t.id = pa.topic_id
             AND t.user_id = ?
         WHERE pa.id = ? AND pa.user_id = ?`,
      )
      .bind(userId, attemptId, userId)
      .first<PracticeAttemptRecord>();
  }

  async updateAttemptMetadata(input: {
    userId: string;
    attemptId: string;
    topicId: string;
    errorType: string;
    confidenceAfter: number;
    confidenceScore: number;
    now: string;
  }): Promise<boolean> {
    const [attemptResult] = await this.db.batch([
      this.db
        .prepare(
          `UPDATE practice_attempts
           SET error_type = ?, confidence_after = ?
           WHERE id = ? AND user_id = ? AND topic_id = ?`,
        )
        .bind(
          input.errorType,
          input.confidenceAfter,
          input.attemptId,
          input.userId,
          input.topicId,
        ),
      this.db
        .prepare(
          `UPDATE mastery_records
           SET confidence_score = ?, updated_at = ?
           WHERE user_id = ? AND topic_id = ?`,
        )
        .bind(
          input.confidenceScore,
          input.now,
          input.userId,
          input.topicId,
        ),
    ]);
    return changed(attemptResult);
  }

  async listMastery(userId: string): Promise<MasterySummaryRecord[]> {
    const result = await this.db
      .prepare(
        `SELECT
           mr.id,
           mr.course_id AS courseId,
           mr.topic_id AS topicId,
           mr.mastery_score AS masteryScore,
           mr.confidence_score AS confidenceScore,
           mr.last_attempt_at AS lastAttemptAt,
           mr.last_correct_at AS lastCorrectAt,
           mr.next_review_at AS nextReviewAt,
           mr.review_interval_hours AS reviewIntervalHours,
           mr.consecutive_correct AS consecutiveCorrect,
           mr.consecutive_incorrect AS consecutiveIncorrect,
           c.course_code AS courseCode,
           c.course_name AS courseName,
           c.colour_key AS colourKey,
           t.title AS topicTitle,
           (
             SELECT COUNT(*)
             FROM practice_attempts pa
             WHERE pa.user_id = ?
               AND pa.topic_id = mr.topic_id
           ) AS attemptCount,
           (
             SELECT pa.error_type
             FROM practice_attempts pa
             WHERE pa.user_id = ?
               AND pa.topic_id = mr.topic_id
             ORDER BY pa.attempted_at DESC
             LIMIT 1
           ) AS lastErrorType,
           (
             SELECT task.id
             FROM study_tasks task
             WHERE task.user_id = ?
               AND task.topic_id = mr.topic_id
               AND task.task_type = 'retest'
               AND task.status IN ('queued', 'active', 'overdue')
             LIMIT 1
           ) AS reviewTaskId
         FROM mastery_records mr
         INNER JOIN topics t
           ON t.id = mr.topic_id
             AND t.user_id = ?
         INNER JOIN courses c
           ON c.id = mr.course_id
             AND c.id = t.course_id
             AND c.user_id = ?
             AND c.archived_at IS NULL
         INNER JOIN user_semesters us
           ON us.id = c.user_semester_id
             AND us.user_id = ?
             AND us.status = 'active'
         WHERE mr.user_id = ?
         ORDER BY
           mr.next_review_at IS NULL,
           mr.next_review_at,
           mr.mastery_score,
           c.course_name,
           t.sequence_number`,
      )
      .bind(
        userId,
        userId,
        userId,
        userId,
        userId,
        userId,
        userId,
      )
      .all<MasterySummaryRecord>();
    return result.results ?? [];
  }

  async dueReviewCount(userId: string, now: string): Promise<number> {
    const row = await this.db
      .prepare(
        `SELECT COUNT(*) AS count
         FROM mastery_records mr
         INNER JOIN topics t
           ON t.id = mr.topic_id
             AND t.user_id = ?
         INNER JOIN courses c
           ON c.id = mr.course_id
             AND c.user_id = ?
             AND c.archived_at IS NULL
         WHERE mr.user_id = ?
           AND mr.next_review_at IS NOT NULL
           AND mr.next_review_at <= ?`,
      )
      .bind(userId, userId, userId, now)
      .first<{ count: number }>();
    return Number(row?.count ?? 0);
  }

  async listRebalanceTasks(
    userId: string,
  ): Promise<RebalanceTaskRecord[]> {
    const result = await this.db
      .prepare(
        `SELECT
           t.id,
           t.scheduled_for AS scheduledFor,
           t.due_at AS dueAt,
           t.priority,
           t.priority_score AS priorityScore,
           t.estimated_minutes AS estimatedMinutes,
           t.status
         FROM study_tasks t
         LEFT JOIN courses c
           ON c.id = t.course_id
             AND c.user_id = ?
             AND c.archived_at IS NULL
         LEFT JOIN user_semesters us
           ON us.id = c.user_semester_id
             AND us.user_id = ?
             AND us.status = 'active'
         WHERE t.user_id = ?
           AND t.status IN ('queued', 'active', 'overdue')
           AND (
             t.course_id IS NULL
             OR (c.id IS NOT NULL AND us.id IS NOT NULL)
           )
         ORDER BY t.scheduled_for, t.priority_score DESC`,
      )
      .bind(userId, userId, userId)
      .all<RebalanceTaskRecord>();
    return result.results ?? [];
  }

  async applyRebalanceChanges(
    userId: string,
    changes: Array<{ taskId: string; scheduledFor: string }>,
    now: string,
  ): Promise<number> {
    if (changes.length === 0) return 0;
    const results = await this.db.batch(
      changes.map((change) =>
        this.db
          .prepare(
            `UPDATE study_tasks
             SET scheduled_for = ?,
                 status = CASE WHEN status = 'overdue' THEN 'queued' ELSE status END,
                 updated_at = ?
             WHERE id = ? AND user_id = ?
               AND status IN ('queued', 'active', 'overdue')`,
          )
          .bind(change.scheduledFor, now, change.taskId, userId),
      ),
    );
    return results.reduce(
      (total, result) => total + Number(result.meta.changes ?? 0),
      0,
    );
  }
}
