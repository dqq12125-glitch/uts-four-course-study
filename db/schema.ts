import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

const timestamps = {
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
};

export const users = sqliteTable(
  "users",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    emailVerifiedAt: text("email_verified_at"),
    displayName: text("display_name"),
    preferredLanguage: text("preferred_language").notNull().default("zh-CN"),
    timezone: text("timezone").notNull().default("Australia/Sydney"),
    role: text("role").notNull().default("student"),
    status: text("status").notNull().default("active"),
    onboardingCompletedAt: text("onboarding_completed_at"),
    ...timestamps,
    deletedAt: text("deleted_at"),
  },
  (table) => [
    uniqueIndex("users_email_unique").on(table.email),
    check(
      "users_preferred_language_check",
      sql`${table.preferredLanguage} in ('zh-CN', 'en')`,
    ),
    check("users_role_check", sql`${table.role} in ('student', 'admin')`),
    check(
      "users_status_check",
      sql`${table.status} in ('active', 'suspended', 'deleted')`,
    ),
  ],
);

export const userSettings = sqliteTable(
  "user_settings",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    dailyStudyMinutes: integer("daily_study_minutes").notNull().default(60),
    preferredStudyStartTime: text("preferred_study_start_time"),
    weekStartsOn: integer("week_starts_on").notNull().default(1),
    reminderEnabled: integer("reminder_enabled", { mode: "boolean" })
      .notNull()
      .default(true),
    academicIntegrityMode: integer("academic_integrity_mode", {
      mode: "boolean",
    })
      .notNull()
      .default(true),
    aiExplanationLanguage: text("ai_explanation_language")
      .notNull()
      .default("zh-CN"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("user_settings_user_unique").on(table.userId),
    check(
      "user_settings_daily_minutes_check",
      sql`${table.dailyStudyMinutes} between 15 and 720`,
    ),
    check(
      "user_settings_week_starts_on_check",
      sql`${table.weekStartsOn} between 0 and 6`,
    ),
  ],
);

export const authSessions = sqliteTable(
  "auth_sessions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    expiresAt: text("expires_at").notNull(),
    lastSeenAt: text("last_seen_at").notNull(),
    createdAt: text("created_at").notNull(),
    revokedAt: text("revoked_at"),
  },
  (table) => [
    uniqueIndex("auth_sessions_token_hash_unique").on(table.tokenHash),
    index("auth_sessions_user_idx").on(table.userId),
    index("auth_sessions_expires_idx").on(table.expiresAt),
  ],
);

export const magicLinkTokens = sqliteTable(
  "magic_link_tokens",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    tokenHash: text("token_hash").notNull(),
    expiresAt: text("expires_at").notNull(),
    createdAt: text("created_at").notNull(),
    consumedAt: text("consumed_at"),
    requestedIpHash: text("requested_ip_hash"),
  },
  (table) => [
    uniqueIndex("magic_link_tokens_hash_unique").on(table.tokenHash),
    index("magic_link_tokens_email_idx").on(table.email),
    index("magic_link_tokens_expires_idx").on(table.expiresAt),
  ],
);

export const authRateLimits = sqliteTable(
  "auth_rate_limits",
  {
    key: text("key").primaryKey(),
    count: integer("count").notNull(),
    windowStartedAt: text("window_started_at").notNull(),
    expiresAt: text("expires_at").notNull(),
  },
  (table) => [index("auth_rate_limits_expires_idx").on(table.expiresAt)],
);

export const institutions = sqliteTable(
  "institutions",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    shortName: text("short_name").notNull(),
    country: text("country").notNull(),
    timezone: text("timezone").notNull(),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    ...timestamps,
  },
  (table) => [uniqueIndex("institutions_name_unique").on(table.name)],
);

export const semesters = sqliteTable(
  "semesters",
  {
    id: text("id").primaryKey(),
    institutionId: text("institution_id")
      .notNull()
      .references(() => institutions.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    code: text("code").notNull(),
    startDate: text("start_date").notNull(),
    endDate: text("end_date").notNull(),
    isTemplate: integer("is_template", { mode: "boolean" })
      .notNull()
      .default(true),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("semesters_institution_code_unique").on(
      table.institutionId,
      table.code,
    ),
    index("semesters_dates_idx").on(table.startDate, table.endDate),
  ],
);

export const userSemesters = sqliteTable(
  "user_semesters",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    institutionId: text("institution_id").references(() => institutions.id, {
      onDelete: "set null",
    }),
    institutionName: text("institution_name").notNull(),
    name: text("name").notNull(),
    startDate: text("start_date").notNull(),
    endDate: text("end_date").notNull(),
    status: text("status").notNull().default("draft"),
    ...timestamps,
  },
  (table) => [
    index("user_semesters_user_status_idx").on(table.userId, table.status),
    uniqueIndex("user_semesters_one_active_unique")
      .on(table.userId)
      .where(sql`${table.status} = 'active'`),
    check(
      "user_semesters_status_check",
      sql`${table.status} in ('draft', 'active', 'completed', 'archived')`,
    ),
  ],
);

export const courseTemplates = sqliteTable(
  "course_templates",
  {
    id: text("id").primaryKey(),
    institutionId: text("institution_id").references(() => institutions.id, {
      onDelete: "set null",
    }),
    courseCode: text("course_code"),
    courseName: text("course_name").notNull(),
    description: text("description"),
    defaultLanguage: text("default_language").notNull().default("en"),
    colourKey: text("colour_key").notNull().default("ocean"),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
    ...timestamps,
  },
  (table) => [
    index("course_templates_institution_idx").on(table.institutionId),
    uniqueIndex("course_templates_institution_code_unique").on(
      table.institutionId,
      table.courseCode,
    ),
  ],
);

export const courses = sqliteTable(
  "courses",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    userSemesterId: text("user_semester_id")
      .notNull()
      .references(() => userSemesters.id, { onDelete: "cascade" }),
    courseTemplateId: text("course_template_id").references(
      () => courseTemplates.id,
      { onDelete: "set null" },
    ),
    courseCode: text("course_code"),
    courseName: text("course_name").notNull(),
    colourKey: text("colour_key").notNull().default("ocean"),
    instructorName: text("instructor_name"),
    sourceType: text("source_type").notNull().default("manual"),
    ...timestamps,
    archivedAt: text("archived_at"),
  },
  (table) => [
    index("courses_user_semester_idx").on(
      table.userId,
      table.userSemesterId,
    ),
    index("courses_user_archived_idx").on(table.userId, table.archivedAt),
    check(
      "courses_source_type_check",
      sql`${table.sourceType} in ('template', 'manual', 'imported')`,
    ),
  ],
);

export const classSessions = sqliteTable(
  "class_sessions",
  {
    id: text("id").primaryKey(),
    courseId: text("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    sessionType: text("session_type").notNull().default("other"),
    title: text("title").notNull(),
    dayOfWeek: integer("day_of_week").notNull(),
    startTime: text("start_time").notNull(),
    endTime: text("end_time").notNull(),
    location: text("location"),
    mapUrl: text("map_url"),
    startDate: text("start_date"),
    endDate: text("end_date"),
    recurrenceRule: text("recurrence_rule"),
    sourceUid: text("source_uid"),
    sourceResourceId: text("source_resource_id"),
    ...timestamps,
  },
  (table) => [
    index("class_sessions_user_day_idx").on(table.userId, table.dayOfWeek),
    index("class_sessions_course_idx").on(table.courseId),
    uniqueIndex("class_sessions_import_uid_unique")
      .on(table.userId, table.courseId, table.sourceUid)
      .where(sql`${table.sourceUid} is not null`),
    check(
      "class_sessions_type_check",
      sql`${table.sessionType} in ('lecture', 'tutorial', 'workshop', 'lab', 'practical', 'other')`,
    ),
    check(
      "class_sessions_day_check",
      sql`${table.dayOfWeek} between 0 and 6`,
    ),
  ],
);

export const assessments = sqliteTable(
  "assessments",
  {
    id: text("id").primaryKey(),
    courseId: text("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    assessmentType: text("assessment_type").notNull().default("other"),
    dueAt: text("due_at"),
    weightPercent: integer("weight_percent"),
    estimatedMinutes: integer("estimated_minutes"),
    status: text("status").notNull().default("not_started"),
    sourceType: text("source_type").notNull().default("manual"),
    sourceUid: text("source_uid"),
    sourceResourceId: text("source_resource_id"),
    notes: text("notes"),
    ...timestamps,
  },
  (table) => [
    index("assessments_user_due_idx").on(table.userId, table.dueAt),
    index("assessments_course_idx").on(table.courseId),
    uniqueIndex("assessments_import_uid_unique")
      .on(table.userId, table.courseId, table.sourceUid)
      .where(sql`${table.sourceUid} is not null`),
    check(
      "assessments_status_check",
      sql`${table.status} in ('not_started', 'in_progress', 'submitted', 'completed', 'overdue')`,
    ),
    check(
      "assessments_type_check",
      sql`${table.assessmentType} in ('quiz', 'assignment', 'skills_test', 'exam', 'lab', 'project', 'presentation', 'other')`,
    ),
    check(
      "assessments_source_type_check",
      sql`${table.sourceType} in ('manual', 'imported', 'template')`,
    ),
    check(
      "assessments_weight_check",
      sql`${table.weightPercent} is null or ${table.weightPercent} between 0 and 100`,
    ),
  ],
);

export const topics = sqliteTable(
  "topics",
  {
    id: text("id").primaryKey(),
    courseId: text("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    weekNumber: integer("week_number"),
    sequenceNumber: integer("sequence_number").notNull().default(0),
    ...timestamps,
  },
  (table) => [
    index("topics_user_course_idx").on(table.userId, table.courseId),
    uniqueIndex("topics_user_course_title_unique").on(
      table.userId,
      table.courseId,
      table.title,
    ),
  ],
);

export const studyTasks = sqliteTable(
  "study_tasks",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    courseId: text("course_id").references(() => courses.id, {
      onDelete: "cascade",
    }),
    topicId: text("topic_id").references(() => topics.id, {
      onDelete: "set null",
    }),
    assessmentId: text("assessment_id").references(() => assessments.id, {
      onDelete: "set null",
    }),
    title: text("title").notNull(),
    description: text("description"),
    completionCriteria: text("completion_criteria").notNull(),
    reason: text("reason").notNull(),
    taskType: text("task_type").notNull().default("custom"),
    priority: text("priority").notNull().default("medium"),
    priorityScore: integer("priority_score").notNull().default(0),
    sortOrder: integer("sort_order").notNull().default(0),
    estimatedMinutes: integer("estimated_minutes").notNull(),
    scheduledFor: text("scheduled_for").notNull(),
    dueAt: text("due_at"),
    status: text("status").notNull().default("queued"),
    generatedBy: text("generated_by").notNull().default("rule"),
    completedAt: text("completed_at"),
    ...timestamps,
  },
  (table) => [
    index("study_tasks_user_schedule_idx").on(
      table.userId,
      table.scheduledFor,
      table.status,
    ),
    index("study_tasks_course_idx").on(table.courseId),
    uniqueIndex("study_tasks_open_retest_topic_unique")
      .on(table.userId, table.topicId)
      .where(
        sql`${table.taskType} = 'retest' and ${table.status} in ('queued', 'active', 'overdue')`,
      ),
    check(
      "study_tasks_type_check",
      sql`${table.taskType} in ('preview', 'review', 'practice', 'assessment', 'revision', 'retest', 'reading', 'custom')`,
    ),
    check(
      "study_tasks_priority_check",
      sql`${table.priority} in ('low', 'medium', 'high', 'critical')`,
    ),
    check(
      "study_tasks_status_check",
      sql`${table.status} in ('queued', 'active', 'completed', 'skipped', 'overdue')`,
    ),
    check(
      "study_tasks_generated_by_check",
      sql`${table.generatedBy} in ('user', 'rule', 'ai', 'template')`,
    ),
  ],
);

export const focusSessions = sqliteTable(
  "focus_sessions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    studyTaskId: text("study_task_id").references(() => studyTasks.id, {
      onDelete: "set null",
    }),
    plannedMinutes: integer("planned_minutes").notNull(),
    actualSeconds: integer("actual_seconds"),
    startedAt: text("started_at").notNull(),
    endedAt: text("ended_at"),
    completionStatus: text("completion_status").notNull().default("active"),
    difficulty: integer("difficulty"),
    needsMorePractice: integer("needs_more_practice", { mode: "boolean" })
      .notNull()
      .default(false),
    confidenceAfter: integer("confidence_after"),
    createdAt: text("created_at").notNull(),
  },
  (table) => [
    index("focus_sessions_user_started_idx").on(
      table.userId,
      table.startedAt,
    ),
    index("focus_sessions_task_idx").on(table.studyTaskId),
    uniqueIndex("focus_sessions_one_active_user_unique")
      .on(table.userId)
      .where(
        sql`${table.completionStatus} = 'active' and ${table.endedAt} is null`,
      ),
    check(
      "focus_sessions_planned_minutes_check",
      sql`${table.plannedMinutes} between 5 and 180`,
    ),
    check(
      "focus_sessions_actual_seconds_check",
      sql`${table.actualSeconds} is null or ${table.actualSeconds} between 0 and 86400`,
    ),
    check(
      "focus_sessions_status_check",
      sql`${table.completionStatus} in ('active', 'completed', 'partial', 'abandoned')`,
    ),
    check(
      "focus_sessions_difficulty_check",
      sql`${table.difficulty} is null or ${table.difficulty} between 1 and 5`,
    ),
    check(
      "focus_sessions_confidence_check",
      sql`${table.confidenceAfter} is null or ${table.confidenceAfter} between 1 and 5`,
    ),
  ],
);

export const practiceQuestions = sqliteTable(
  "practice_questions",
  {
    id: text("id").primaryKey(),
    courseTemplateId: text("course_template_id").references(
      () => courseTemplates.id,
      { onDelete: "set null" },
    ),
    courseId: text("course_id").references(() => courses.id, {
      onDelete: "cascade",
    }),
    topicId: text("topic_id").references(() => topics.id, {
      onDelete: "cascade",
    }),
    ownerUserId: text("owner_user_id").references(() => users.id, {
      onDelete: "cascade",
    }),
    questionType: text("question_type").notNull().default("single_choice"),
    difficulty: integer("difficulty").notNull().default(1),
    prompt: text("prompt").notNull(),
    optionsJson: text("options_json"),
    solution: text("solution").notNull(),
    hint1: text("hint_1"),
    hint2: text("hint_2"),
    hint3: text("hint_3"),
    explanation: text("explanation").notNull(),
    language: text("language").notNull().default("zh-CN"),
    sourceType: text("source_type").notNull().default("user_generated"),
    reviewStatus: text("review_status").notNull().default("draft"),
    ...timestamps,
  },
  (table) => [
    index("practice_questions_owner_course_idx").on(
      table.ownerUserId,
      table.courseId,
    ),
    index("practice_questions_topic_idx").on(table.topicId),
    index("practice_questions_public_template_idx").on(
      table.courseTemplateId,
      table.reviewStatus,
    ),
    check(
      "practice_questions_type_check",
      sql`${table.questionType} in ('single_choice', 'multiple_choice', 'short_answer', 'numeric')`,
    ),
    check(
      "practice_questions_difficulty_check",
      sql`${table.difficulty} between 1 and 5`,
    ),
    check(
      "practice_questions_language_check",
      sql`${table.language} in ('zh-CN', 'en')`,
    ),
    check(
      "practice_questions_source_check",
      sql`${table.sourceType} in ('original', 'ai_generated', 'user_generated')`,
    ),
    check(
      "practice_questions_review_check",
      sql`${table.reviewStatus} in ('draft', 'reviewed', 'rejected')`,
    ),
  ],
);

export const practiceSessions = sqliteTable(
  "practice_sessions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    courseId: text("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    topicId: text("topic_id")
      .notNull()
      .references(() => topics.id, { onDelete: "cascade" }),
    practiceQuestionId: text("practice_question_id")
      .notNull()
      .references(() => practiceQuestions.id, { onDelete: "cascade" }),
    studyTaskId: text("study_task_id").references(() => studyTasks.id, {
      onDelete: "set null",
    }),
    status: text("status").notNull().default("active"),
    hintsUsed: integer("hints_used").notNull().default(0),
    incorrectAttempts: integer("incorrect_attempts").notNull().default(0),
    confidenceBefore: integer("confidence_before"),
    startedAt: text("started_at").notNull(),
    completedAt: text("completed_at"),
    createdAt: text("created_at").notNull(),
  },
  (table) => [
    index("practice_sessions_user_status_idx").on(
      table.userId,
      table.status,
    ),
    index("practice_sessions_question_idx").on(table.practiceQuestionId),
    uniqueIndex("practice_sessions_one_active_user_unique")
      .on(table.userId)
      .where(sql`${table.status} = 'active'`),
    check(
      "practice_sessions_status_check",
      sql`${table.status} in ('active', 'completed', 'abandoned')`,
    ),
    check(
      "practice_sessions_hints_check",
      sql`${table.hintsUsed} between 0 and 3`,
    ),
    check(
      "practice_sessions_incorrect_attempts_check",
      sql`${table.incorrectAttempts} between 0 and 3`,
    ),
    check(
      "practice_sessions_confidence_check",
      sql`${table.confidenceBefore} is null or ${table.confidenceBefore} between 1 and 5`,
    ),
  ],
);

export const practiceAttempts = sqliteTable(
  "practice_attempts",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    practiceQuestionId: text("practice_question_id")
      .notNull()
      .references(() => practiceQuestions.id, { onDelete: "cascade" }),
    topicId: text("topic_id")
      .notNull()
      .references(() => topics.id, { onDelete: "cascade" }),
    practiceSessionId: text("practice_session_id")
      .notNull()
      .references(() => practiceSessions.id, { onDelete: "cascade" }),
    studyTaskId: text("study_task_id").references(() => studyTasks.id, {
      onDelete: "set null",
    }),
    answer: text("answer").notNull(),
    isCorrect: integer("is_correct", { mode: "boolean" }).notNull(),
    score: integer("score").notNull(),
    confidenceBefore: integer("confidence_before"),
    confidenceAfter: integer("confidence_after"),
    hintsUsed: integer("hints_used").notNull().default(0),
    incorrectAttempts: integer("incorrect_attempts").notNull().default(0),
    timeSpentSeconds: integer("time_spent_seconds").notNull(),
    errorType: text("error_type").notNull().default("unknown"),
    attemptedAt: text("attempted_at").notNull(),
  },
  (table) => [
    uniqueIndex("practice_attempts_session_unique").on(
      table.practiceSessionId,
    ),
    index("practice_attempts_user_topic_idx").on(
      table.userId,
      table.topicId,
      table.attemptedAt,
    ),
    index("practice_attempts_question_idx").on(table.practiceQuestionId),
    check(
      "practice_attempts_score_check",
      sql`${table.score} between 0 and 100`,
    ),
    check(
      "practice_attempts_confidence_before_check",
      sql`${table.confidenceBefore} is null or ${table.confidenceBefore} between 1 and 5`,
    ),
    check(
      "practice_attempts_confidence_after_check",
      sql`${table.confidenceAfter} is null or ${table.confidenceAfter} between 1 and 5`,
    ),
    check(
      "practice_attempts_hints_check",
      sql`${table.hintsUsed} between 0 and 3`,
    ),
    check(
      "practice_attempts_incorrect_attempts_check",
      sql`${table.incorrectAttempts} between 0 and 3`,
    ),
    check(
      "practice_attempts_time_check",
      sql`${table.timeSpentSeconds} between 0 and 86400`,
    ),
    check(
      "practice_attempts_error_type_check",
      sql`${table.errorType} in ('concept', 'formula', 'algebra', 'units', 'sign', 'interpretation', 'syntax', 'logic', 'careless', 'unknown')`,
    ),
  ],
);

export const masteryRecords = sqliteTable(
  "mastery_records",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    courseId: text("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    topicId: text("topic_id")
      .notNull()
      .references(() => topics.id, { onDelete: "cascade" }),
    masteryScore: integer("mastery_score").notNull().default(0),
    confidenceScore: integer("confidence_score").notNull().default(0),
    lastAttemptAt: text("last_attempt_at"),
    lastCorrectAt: text("last_correct_at"),
    nextReviewAt: text("next_review_at"),
    reviewIntervalHours: integer("review_interval_hours").notNull().default(0),
    consecutiveCorrect: integer("consecutive_correct").notNull().default(0),
    consecutiveIncorrect: integer("consecutive_incorrect").notNull().default(0),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("mastery_records_user_topic_unique").on(
      table.userId,
      table.topicId,
    ),
    index("mastery_records_user_course_idx").on(
      table.userId,
      table.courseId,
    ),
    index("mastery_records_review_queue_idx").on(
      table.userId,
      table.nextReviewAt,
    ),
    check(
      "mastery_records_score_check",
      sql`${table.masteryScore} between 0 and 100`,
    ),
    check(
      "mastery_records_confidence_check",
      sql`${table.confidenceScore} between 0 and 100`,
    ),
    check(
      "mastery_records_interval_check",
      sql`${table.reviewIntervalHours} between 0 and 8760`,
    ),
    check(
      "mastery_records_streak_check",
      sql`${table.consecutiveCorrect} >= 0 and ${table.consecutiveIncorrect} >= 0`,
    ),
  ],
);

export const usageEvents = sqliteTable(
  "usage_events",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    eventName: text("event_name").notNull(),
    eventCategory: text("event_category").notNull(),
    propertiesJson: text("properties_json"),
    createdAt: text("created_at").notNull(),
  },
  (table) => [
    index("usage_events_user_created_idx").on(table.userId, table.createdAt),
    index("usage_events_name_created_idx").on(table.eventName, table.createdAt),
  ],
);

export const auditLogs = sqliteTable(
  "audit_logs",
  {
    id: text("id").primaryKey(),
    actorUserId: text("actor_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id"),
    metadataJson: text("metadata_json"),
    ipHash: text("ip_hash"),
    createdAt: text("created_at").notNull(),
  },
  (table) => [
    index("audit_logs_actor_created_idx").on(
      table.actorUserId,
      table.createdAt,
    ),
    index("audit_logs_entity_idx").on(table.entityType, table.entityId),
  ],
);

export const subscriptions = sqliteTable(
  "subscriptions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    provider: text("provider").notNull().default("stripe"),
    providerCustomerId: text("provider_customer_id"),
    providerSubscriptionId: text("provider_subscription_id"),
    productKey: text("product_key").notNull(),
    status: text("status").notNull().default("free"),
    currentPeriodStart: text("current_period_start"),
    currentPeriodEnd: text("current_period_end"),
    cancelAtPeriodEnd: integer("cancel_at_period_end", { mode: "boolean" })
      .notNull()
      .default(false),
    ...timestamps,
  },
  (table) => [
    index("subscriptions_user_status_idx").on(table.userId, table.status),
    uniqueIndex("subscriptions_provider_id_unique").on(
      table.provider,
      table.providerSubscriptionId,
    ),
    check(
      "subscriptions_status_check",
      sql`${table.status} in ('free', 'active', 'past_due', 'cancelled', 'expired', 'refunded')`,
    ),
  ],
);

export const purchases = sqliteTable(
  "purchases",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    provider: text("provider").notNull().default("stripe"),
    providerPaymentId: text("provider_payment_id"),
    providerCheckoutSessionId: text("provider_checkout_session_id"),
    productKey: text("product_key").notNull(),
    amountMinor: integer("amount_minor").notNull(),
    currency: text("currency").notNull(),
    status: text("status").notNull().default("pending"),
    accessStartAt: text("access_start_at"),
    accessEndAt: text("access_end_at"),
    ...timestamps,
  },
  (table) => [
    index("purchases_user_status_idx").on(table.userId, table.status),
    uniqueIndex("purchases_provider_payment_unique").on(
      table.provider,
      table.providerPaymentId,
    ),
    uniqueIndex("purchases_checkout_session_unique").on(
      table.provider,
      table.providerCheckoutSessionId,
    ),
    check(
      "purchases_amount_check",
      sql`${table.amountMinor} >= 0`,
    ),
    check(
      "purchases_status_check",
      sql`${table.status} in ('pending', 'active', 'failed', 'refunded', 'expired')`,
    ),
  ],
);

export const paymentWebhookEvents = sqliteTable(
  "payment_webhook_events",
  {
    id: text("id").primaryKey(),
    provider: text("provider").notNull().default("stripe"),
    providerEventId: text("provider_event_id").notNull(),
    eventType: text("event_type").notNull(),
    status: text("status").notNull().default("processing"),
    payloadHash: text("payload_hash").notNull(),
    attempts: integer("attempts").notNull().default(1),
    lastError: text("last_error"),
    receivedAt: text("received_at").notNull(),
    processedAt: text("processed_at"),
  },
  (table) => [
    uniqueIndex("payment_webhook_events_provider_unique").on(
      table.provider,
      table.providerEventId,
    ),
    index("payment_webhook_events_status_idx").on(
      table.status,
      table.receivedAt,
    ),
    check(
      "payment_webhook_events_status_check",
      sql`${table.status} in ('processing', 'processed', 'failed', 'ignored')`,
    ),
  ],
);

export const featureFlags = sqliteTable(
  "feature_flags",
  {
    id: text("id").primaryKey(),
    environment: text("environment").notNull(),
    flagKey: text("flag_key").notNull(),
    enabled: integer("enabled", { mode: "boolean" }).notNull(),
    updatedByUserId: text("updated_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("feature_flags_environment_key_unique").on(
      table.environment,
      table.flagKey,
    ),
    check(
      "feature_flags_environment_check",
      sql`${table.environment} in ('development', 'preview', 'production', 'test')`,
    ),
  ],
);

export const aiConversations = sqliteTable(
  "ai_conversations",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    courseId: text("course_id").references(() => courses.id, {
      onDelete: "set null",
    }),
    topicId: text("topic_id").references(() => topics.id, {
      onDelete: "set null",
    }),
    title: text("title").notNull(),
    status: text("status").notNull().default("active"),
    ...timestamps,
  },
  (table) => [
    index("ai_conversations_user_updated_idx").on(
      table.userId,
      table.updatedAt,
    ),
    check(
      "ai_conversations_status_check",
      sql`${table.status} in ('active', 'archived', 'deleted')`,
    ),
  ],
);

export const aiMessages = sqliteTable(
  "ai_messages",
  {
    id: text("id").primaryKey(),
    conversationId: text("conversation_id")
      .notNull()
      .references(() => aiConversations.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: text("role").notNull(),
    content: text("content").notNull(),
    tokenInput: integer("token_input").notNull().default(0),
    tokenOutput: integer("token_output").notNull().default(0),
    modelKey: text("model_key").notNull(),
    safetyMode: text("safety_mode").notNull().default("hint_first"),
    createdAt: text("created_at").notNull(),
  },
  (table) => [
    index("ai_messages_conversation_created_idx").on(
      table.conversationId,
      table.createdAt,
    ),
    index("ai_messages_user_created_idx").on(table.userId, table.createdAt),
    check(
      "ai_messages_role_check",
      sql`${table.role} in ('user', 'assistant', 'system')`,
    ),
  ],
);

export const aiUsageLogs = sqliteTable(
  "ai_usage_logs",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    feature: text("feature").notNull(),
    modelKey: text("model_key").notNull(),
    tokenInput: integer("token_input").notNull().default(0),
    tokenOutput: integer("token_output").notNull().default(0),
    latencyMs: integer("latency_ms").notNull(),
    success: integer("success", { mode: "boolean" }).notNull(),
    errorCode: text("error_code"),
    estimatedCostMinorUsd: integer("estimated_cost_minor_usd")
      .notNull()
      .default(0),
    createdAt: text("created_at").notNull(),
  },
  (table) => [
    index("ai_usage_logs_user_created_idx").on(table.userId, table.createdAt),
    index("ai_usage_logs_feature_created_idx").on(
      table.feature,
      table.createdAt,
    ),
    check(
      "ai_usage_logs_token_check",
      sql`${table.tokenInput} >= 0 and ${table.tokenOutput} >= 0`,
    ),
  ],
);

export const learningResources = sqliteTable(
  "learning_resources",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    courseId: text("course_id").references(() => courses.id, {
      onDelete: "cascade",
    }),
    fileName: text("file_name").notNull(),
    storageKey: text("storage_key").notNull(),
    mimeType: text("mime_type").notNull(),
    fileSize: integer("file_size").notNull(),
    resourceType: text("resource_type").notNull(),
    processingStatus: text("processing_status").notNull().default("pending"),
    retentionUntil: text("retention_until"),
    ...timestamps,
    deletedAt: text("deleted_at"),
  },
  (table) => [
    uniqueIndex("learning_resources_storage_key_unique").on(table.storageKey),
    index("learning_resources_user_course_idx").on(
      table.userId,
      table.courseId,
    ),
    index("learning_resources_retention_idx").on(
      table.retentionUntil,
      table.deletedAt,
    ),
    check(
      "learning_resources_size_check",
      sql`${table.fileSize} between 1 and 10485760`,
    ),
    check(
      "learning_resources_type_check",
      sql`${table.resourceType} in ('lecture_notes', 'subject_information', 'assessment_information', 'personal_notes', 'timetable', 'other')`,
    ),
    check(
      "learning_resources_processing_check",
      sql`${table.processingStatus} in ('pending', 'processing', 'awaiting_confirmation', 'ready', 'failed', 'deleted')`,
    ),
  ],
);

export const resourceExtractions = sqliteTable(
  "resource_extractions",
  {
    id: text("id").primaryKey(),
    resourceId: text("resource_id")
      .notNull()
      .references(() => learningResources.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    extractedText: text("extracted_text"),
    proposedDataJson: text("proposed_data_json"),
    status: text("status").notNull().default("pending"),
    failureCode: text("failure_code"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
    confirmedAt: text("confirmed_at"),
  },
  (table) => [
    uniqueIndex("resource_extractions_resource_unique").on(table.resourceId),
    index("resource_extractions_user_status_idx").on(table.userId, table.status),
    check(
      "resource_extractions_status_check",
      sql`${table.status} in ('pending', 'processing', 'awaiting_confirmation', 'confirmed', 'failed', 'deleted')`,
    ),
  ],
);

// Phase 2 ingestion tables are additive. `learning_resources` and
// `resource_extractions` remain the compatibility read model until the
// PostgreSQL cutover is complete.
export const lmsConnections = sqliteTable(
  "lms_connections",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    connectorId: text("connector_id").notNull(),
    displayName: text("display_name").notNull(),
    baseUrl: text("base_url"),
    encryptedCredentialsJson: text("encrypted_credentials_json"),
    credentialKeyId: text("credential_key_id"),
    scopesJson: text("scopes_json").notNull().default("[]"),
    sourceId: text("source_id"),
    status: text("status").notNull().default("pending"),
    lastSyncedAt: text("last_synced_at"),
    ...timestamps,
    deletedAt: text("deleted_at"),
  },
  (table) => [
    index("lms_connections_user_idx").on(table.userId, table.status),
    uniqueIndex("lms_connections_user_source_unique")
      .on(table.userId, table.connectorId, table.sourceId)
      .where(sql`${table.sourceId} is not null and ${table.deletedAt} is null`),
    check(
      "lms_connections_connector_check",
      sql`${table.connectorId} in ('mock', 'manual-upload', 'canvas')`,
    ),
    check(
      "lms_connections_status_check",
      sql`${table.status} in ('pending', 'active', 'expired', 'revoked', 'error')`,
    ),
  ],
);

export const lmsCourseLinks = sqliteTable(
  "lms_course_links",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    courseId: text("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    connectionId: text("connection_id")
      .notNull()
      .references(() => lmsConnections.id, { onDelete: "cascade" }),
    sourceCourseId: text("source_course_id").notNull(),
    sourceUrl: text("source_url"),
    ...timestamps,
    deletedAt: text("deleted_at"),
  },
  (table) => [
    uniqueIndex("lms_course_links_course_unique")
      .on(table.userId, table.courseId)
      .where(sql`${table.deletedAt} is null`),
    uniqueIndex("lms_course_links_source_unique")
      .on(table.connectionId, table.sourceCourseId)
      .where(sql`${table.deletedAt} is null`),
  ],
);

export const resources = sqliteTable(
  "resources",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    courseId: text("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    legacyResourceId: text("legacy_resource_id"),
    connectionId: text("connection_id").references(() => lmsConnections.id, {
      onDelete: "set null",
    }),
    sourceType: text("source_type").notNull(),
    sourceId: text("source_id").notNull(),
    sourceUrl: text("source_url"),
    sourceUpdatedAt: text("source_updated_at"),
    title: text("title").notNull(),
    resourceType: text("resource_type").notNull(),
    mimeType: text("mime_type").notNull(),
    status: text("status").notNull().default("pending"),
    currentVersionId: text("current_version_id"),
    lastSyncedAt: text("last_synced_at"),
    ...timestamps,
    deletedAt: text("deleted_at"),
  },
  (table) => [
    index("resources_user_course_idx").on(table.userId, table.courseId),
    uniqueIndex("resources_legacy_unique")
      .on(table.legacyResourceId)
      .where(sql`${table.legacyResourceId} is not null`),
    uniqueIndex("resources_course_source_unique")
      .on(table.courseId, table.sourceType, table.sourceId)
      .where(sql`${table.deletedAt} is null`),
    check(
      "resources_status_check",
      sql`${table.status} in ('pending', 'processing', 'completed', 'failed', 'tombstoned')`,
    ),
  ],
);

export const resourceVersions = sqliteTable(
  "resource_versions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    resourceId: text("resource_id")
      .notNull()
      .references(() => resources.id, { onDelete: "cascade" }),
    versionNumber: integer("version_number").notNull(),
    fileName: text("file_name").notNull(),
    mimeType: text("mime_type").notNull(),
    storageKey: text("storage_key").notNull(),
    fileHash: text("file_hash").notNull(),
    contentHash: text("content_hash"),
    sizeBytes: integer("size_bytes").notNull(),
    sourceUpdatedAt: text("source_updated_at"),
    lastSyncedAt: text("last_synced_at"),
    parserVersion: text("parser_version"),
    embeddingVersion: text("embedding_version"),
    processingStatus: text("processing_status").notNull().default("pending"),
    qualityStatus: text("quality_status").notNull().default("pending"),
    qualityReportJson: text("quality_report_json"),
    isActive: integer("is_active", { mode: "boolean" }).notNull().default(false),
    ...timestamps,
    deletedAt: text("deleted_at"),
  },
  (table) => [
    uniqueIndex("resource_versions_resource_number_unique").on(
      table.resourceId,
      table.versionNumber,
    ),
    uniqueIndex("resource_versions_resource_hash_unique").on(
      table.resourceId,
      table.fileHash,
    ),
    uniqueIndex("resource_versions_storage_key_unique").on(table.storageKey),
    index("resource_versions_user_idx").on(table.userId, table.createdAt),
    check(
      "resource_versions_status_check",
      sql`${table.processingStatus} in ('pending', 'processing', 'completed', 'failed', 'tombstoned')`,
    ),
    check(
      "resource_versions_quality_check",
      sql`${table.qualityStatus} in ('pending', 'passed', 'warning', 'failed')`,
    ),
  ],
);

export const resourceProcessingJobs = sqliteTable(
  "resource_processing_jobs",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    resourceVersionId: text("resource_version_id")
      .notNull()
      .references(() => resourceVersions.id, { onDelete: "cascade" }),
    jobType: text("job_type").notNull(),
    idempotencyKey: text("idempotency_key").notNull(),
    status: text("status").notNull().default("pending"),
    attemptCount: integer("attempt_count").notNull().default(0),
    maxAttempts: integer("max_attempts").notNull().default(3),
    errorCode: text("error_code"),
    errorSummary: text("error_summary"),
    startedAt: text("started_at"),
    completedAt: text("completed_at"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("resource_processing_jobs_idempotency_unique").on(
      table.idempotencyKey,
    ),
    index("resource_processing_jobs_status_idx").on(table.status, table.createdAt),
    check(
      "resource_processing_jobs_status_check",
      sql`${table.status} in ('pending', 'processing', 'completed', 'failed', 'tombstoned')`,
    ),
    check(
      "resource_processing_jobs_attempt_check",
      sql`${table.attemptCount} >= 0 and ${table.maxAttempts} between 1 and 10`,
    ),
  ],
);

export const resourceChunks = sqliteTable(
  "resource_chunks",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    courseId: text("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    resourceId: text("resource_id")
      .notNull()
      .references(() => resources.id, { onDelete: "cascade" }),
    resourceVersionId: text("resource_version_id")
      .notNull()
      .references(() => resourceVersions.id, { onDelete: "cascade" }),
    sequenceNumber: integer("sequence_number").notNull(),
    content: text("content").notNull(),
    contentHash: text("content_hash").notNull(),
    page: integer("page"),
    slide: integer("slide"),
    section: text("section"),
    timestampStart: integer("timestamp_start"),
    timestampEnd: integer("timestamp_end"),
    sourceUrl: text("source_url"),
    embeddingJson: text("embedding_json"),
    embeddingVersion: text("embedding_version"),
    reusedFromChunkId: text("reused_from_chunk_id"),
    ...timestamps,
    deletedAt: text("deleted_at"),
  },
  (table) => [
    uniqueIndex("resource_chunks_version_sequence_unique").on(
      table.resourceVersionId,
      table.sequenceNumber,
    ),
    index("resource_chunks_user_course_idx").on(
      table.userId,
      table.courseId,
      table.resourceId,
    ),
    index("resource_chunks_content_hash_idx").on(
      table.resourceId,
      table.contentHash,
    ),
    check(
      "resource_chunks_locator_check",
      sql`(${table.page} is not null) + (${table.slide} is not null) + (${table.section} is not null) = 1`,
    ),
  ],
);

export const resourceSyncRuns = sqliteTable(
  "resource_sync_runs",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    courseId: text("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    connectionId: text("connection_id")
      .notNull()
      .references(() => lmsConnections.id, { onDelete: "cascade" }),
    connectorId: text("connector_id").notNull(),
    sourceCourseId: text("source_course_id").notNull(),
    status: text("status").notNull().default("processing"),
    discoveredCount: integer("discovered_count").notNull().default(0),
    createdCount: integer("created_count").notNull().default(0),
    updatedCount: integer("updated_count").notNull().default(0),
    skippedCount: integer("skipped_count").notNull().default(0),
    tombstonedCount: integer("tombstoned_count").notNull().default(0),
    failedCount: integer("failed_count").notNull().default(0),
    detailsJson: text("details_json").notNull().default("{}"),
    startedAt: text("started_at").notNull(),
    completedAt: text("completed_at"),
    ...timestamps,
  },
  (table) => [
    index("resource_sync_runs_course_idx").on(table.userId, table.courseId, table.createdAt),
    check(
      "resource_sync_runs_status_check",
      sql`${table.status} in ('processing', 'completed', 'partial', 'failed')`,
    ),
  ],
);

export const notificationPreferences = sqliteTable(
  "notification_preferences",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tomorrowClasses: integer("tomorrow_classes", { mode: "boolean" })
      .notNull()
      .default(true),
    deadlineApproaching: integer("deadline_approaching", { mode: "boolean" })
      .notNull()
      .default(true),
    dailyPlan: integer("daily_plan", { mode: "boolean" })
      .notNull()
      .default(true),
    reviewDue: integer("review_due", { mode: "boolean" })
      .notNull()
      .default(true),
    weeklyReport: integer("weekly_report", { mode: "boolean" })
      .notNull()
      .default(true),
    marketing: integer("marketing", { mode: "boolean" })
      .notNull()
      .default(false),
    unsubscribedAt: text("unsubscribed_at"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("notification_preferences_user_unique").on(table.userId),
  ],
);

export const notifications = sqliteTable(
  "notifications",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    notificationType: text("notification_type").notNull(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    actionUrl: text("action_url"),
    dedupeKey: text("dedupe_key").notNull(),
    scheduledFor: text("scheduled_for").notNull(),
    readAt: text("read_at"),
    createdAt: text("created_at").notNull(),
  },
  (table) => [
    uniqueIndex("notifications_user_dedupe_unique").on(
      table.userId,
      table.dedupeKey,
    ),
    index("notifications_user_read_idx").on(table.userId, table.readAt),
    check(
      "notifications_type_check",
      sql`${table.notificationType} in ('tomorrow_classes', 'deadline_approaching', 'daily_plan', 'review_due', 'weekly_report', 'system')`,
    ),
  ],
);

export const notificationDeliveries = sqliteTable(
  "notification_deliveries",
  {
    id: text("id").primaryKey(),
    notificationId: text("notification_id")
      .notNull()
      .references(() => notifications.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    channel: text("channel").notNull(),
    status: text("status").notNull().default("pending"),
    attempts: integer("attempts").notNull().default(0),
    providerMessageId: text("provider_message_id"),
    lastError: text("last_error"),
    nextAttemptAt: text("next_attempt_at"),
    sentAt: text("sent_at"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("notification_deliveries_notification_channel_unique").on(
      table.notificationId,
      table.channel,
    ),
    index("notification_deliveries_retry_idx").on(
      table.status,
      table.nextAttemptAt,
    ),
    check(
      "notification_deliveries_channel_check",
      sql`${table.channel} in ('in_app', 'email')`,
    ),
    check(
      "notification_deliveries_status_check",
      sql`${table.status} in ('pending', 'sending', 'sent', 'failed', 'skipped')`,
    ),
  ],
);

export const scheduledJobRuns = sqliteTable(
  "scheduled_job_runs",
  {
    id: text("id").primaryKey(),
    jobName: text("job_name").notNull(),
    scheduledAt: text("scheduled_at").notNull(),
    startedAt: text("started_at").notNull(),
    completedAt: text("completed_at"),
    status: text("status").notNull().default("running"),
    processedCount: integer("processed_count").notNull().default(0),
    failedCount: integer("failed_count").notNull().default(0),
    errorSummary: text("error_summary"),
  },
  (table) => [
    uniqueIndex("scheduled_job_runs_job_schedule_unique").on(
      table.jobName,
      table.scheduledAt,
    ),
    check(
      "scheduled_job_runs_status_check",
      sql`${table.status} in ('running', 'completed', 'failed', 'skipped')`,
    ),
  ],
);

export const supportAccessGrants = sqliteTable(
  "support_access_grants",
  {
    id: text("id").primaryKey(),
    adminUserId: text("admin_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    targetUserId: text("target_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    reason: text("reason").notNull(),
    scope: text("scope").notNull(),
    expiresAt: text("expires_at").notNull(),
    createdAt: text("created_at").notNull(),
    revokedAt: text("revoked_at"),
  },
  (table) => [
    index("support_access_grants_target_idx").on(
      table.targetUserId,
      table.expiresAt,
    ),
    check(
      "support_access_grants_scope_check",
      sql`${table.scope} in ('account_metadata', 'billing', 'private_content')`,
    ),
  ],
);
