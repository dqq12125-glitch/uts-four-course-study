import { sql } from "drizzle-orm";
import {
  boolean,
  date,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  time,
  timestamp,
  uniqueIndex,
  vector,
} from "drizzle-orm/pg-core";

const lifecycleColumns = () => ({
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

const sourceColumns = () => ({
  sourceType: text("source_type").notNull().default("manual"),
  sourceId: text("source_id"),
  sourceUrl: text("source_url"),
  sourceMetadata: jsonb("source_metadata")
    .$type<Record<string, unknown>>()
    .notNull()
    .default({}),
});

export const connectionStatus = pgEnum("connection_status", [
  "pending",
  "active",
  "expired",
  "revoked",
  "error",
]);

export const processingStatus = pgEnum("processing_status", [
  "pending",
  "processing",
  "completed",
  "failed",
  "tombstoned",
]);

export const learningMode = pgEnum("learning_mode", [
  "memory_retrieval",
  "concept_understanding",
  "quantitative_problem_solving",
  "procedural_practice",
  "programming_computation",
  "reading_argumentation",
  "language_communication",
  "design_project",
  "case_reasoning",
  "simulation_experiment",
]);

export const learningSessionStatus = pgEnum("learning_session_status", [
  "created",
  "diagnostic",
  "instruction",
  "guided_practice",
  "independent_practice",
  "assessment",
  "reflection",
  "completed",
  "abandoned",
]);

export const masteryStatus = pgEnum("mastery_status", [
  "not_started",
  "introduced",
  "needs_guidance",
  "independent",
  "transfer_ready",
]);

export const toolRunStatus = pgEnum("tool_run_status", [
  "observed",
  "proposed",
  "awaiting_approval",
  "approved",
  "executing",
  "verified",
  "failed",
  "rolled_back",
]);

export const tenants = pgTable("tenants", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  status: text("status").notNull().default("active"),
  ...lifecycleColumns(),
});

export const users = pgTable(
  "users",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "restrict" }),
    email: text("email").notNull(),
    emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
    displayName: text("display_name"),
    preferredLanguage: text("preferred_language").notNull().default("zh-CN"),
    timezone: text("timezone").notNull().default("Australia/Sydney"),
    role: text("role").notNull().default("student"),
    status: text("status").notNull().default("active"),
    onboardingCompletedAt: timestamp("onboarding_completed_at", {
      withTimezone: true,
    }),
    ...lifecycleColumns(),
  },
  (table) => [
    uniqueIndex("users_tenant_email_unique").on(table.tenantId, table.email),
    index("users_tenant_idx").on(table.tenantId),
  ],
);

export const userPreferences = pgTable(
  "user_preferences",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    dailyStudyMinutes: integer("daily_study_minutes").notNull().default(60),
    preferredStudyStartTime: time("preferred_study_start_time"),
    weekStartsOn: integer("week_starts_on").notNull().default(1),
    reminderEnabled: boolean("reminder_enabled").notNull().default(true),
    academicIntegrityMode: boolean("academic_integrity_mode")
      .notNull()
      .default(true),
    aiExplanationLanguage: text("ai_explanation_language")
      .notNull()
      .default("zh-CN"),
    learningPreferences: jsonb("learning_preferences")
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),
    ...lifecycleColumns(),
  },
  (table) => [
    uniqueIndex("user_preferences_user_unique").on(table.userId),
    index("user_preferences_tenant_idx").on(table.tenantId),
  ],
);

export const authSessions = pgTable(
  "auth_sessions",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("auth_sessions_token_hash_unique").on(table.tokenHash),
    index("auth_sessions_user_idx").on(table.userId, table.expiresAt),
  ],
);

export const magicLinkTokens = pgTable(
  "magic_link_tokens",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    consumedAt: timestamp("consumed_at", { withTimezone: true }),
    requestedIpHash: text("requested_ip_hash"),
  },
  (table) => [
    uniqueIndex("magic_link_tokens_hash_unique").on(table.tokenHash),
    index("magic_link_tokens_email_idx").on(table.email, table.expiresAt),
  ],
);

export const institutions = pgTable(
  "institutions",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    shortName: text("short_name"),
    country: text("country"),
    timezone: text("timezone"),
    status: text("status").notNull().default("active"),
    ...sourceColumns(),
    ...lifecycleColumns(),
  },
  (table) => [uniqueIndex("institutions_name_unique").on(table.name)],
);

export const lmsConnections = pgTable(
  "lms_connections",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    institutionId: text("institution_id").references(() => institutions.id, {
      onDelete: "set null",
    }),
    connectorId: text("connector_id").notNull(),
    status: connectionStatus("status").notNull().default("pending"),
    encryptedCredentials: jsonb("encrypted_credentials"),
    credentialKeyId: text("credential_key_id"),
    scopes: jsonb("scopes").$type<string[]>().notNull().default([]),
    lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),
    ...sourceColumns(),
    ...lifecycleColumns(),
  },
  (table) => [
    index("lms_connections_owner_idx").on(table.tenantId, table.userId),
    uniqueIndex("lms_connections_source_unique")
      .on(table.userId, table.connectorId, table.sourceId)
      .where(sql`${table.deletedAt} is null`),
  ],
);

export const courses = pgTable(
  "courses",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    ownerUserId: text("owner_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    institutionId: text("institution_id").references(() => institutions.id, {
      onDelete: "set null",
    }),
    lmsConnectionId: text("lms_connection_id").references(
      () => lmsConnections.id,
      { onDelete: "set null" },
    ),
    code: text("code"),
    name: text("name").notNull(),
    description: text("description"),
    colourKey: text("colour_key").notNull().default("slate"),
    startsOn: date("starts_on"),
    endsOn: date("ends_on"),
    status: text("status").notNull().default("active"),
    ...sourceColumns(),
    ...lifecycleColumns(),
  },
  (table) => [
    index("courses_owner_idx").on(table.tenantId, table.ownerUserId),
    uniqueIndex("courses_owner_source_unique")
      .on(table.ownerUserId, table.sourceType, table.sourceId)
      .where(sql`${table.sourceId} is not null and ${table.deletedAt} is null`),
  ],
);

export const resourceSyncRuns = pgTable(
  "resource_sync_runs",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
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
    details: jsonb("details")
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),
    startedAt: timestamp("started_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    ...lifecycleColumns(),
  },
  (table) => [
    index("resource_sync_runs_course_idx").on(
      table.tenantId,
      table.userId,
      table.courseId,
      table.createdAt,
    ),
  ],
);

export const courseEnrolments = pgTable(
  "course_enrolments",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    courseId: text("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: text("role").notNull().default("student"),
    status: text("status").notNull().default("active"),
    ...lifecycleColumns(),
  },
  (table) => [
    uniqueIndex("course_enrolments_course_user_unique").on(
      table.courseId,
      table.userId,
    ),
    index("course_enrolments_owner_idx").on(table.tenantId, table.userId),
  ],
);

export const teachingWeeks = pgTable(
  "teaching_weeks",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    courseId: text("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    weekNumber: integer("week_number").notNull(),
    title: text("title").notNull(),
    startsOn: date("starts_on"),
    endsOn: date("ends_on"),
    ...sourceColumns(),
    ...lifecycleColumns(),
  },
  (table) => [
    uniqueIndex("teaching_weeks_course_number_unique").on(
      table.courseId,
      table.weekNumber,
    ),
  ],
);

export const courseModules = pgTable(
  "course_modules",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    courseId: text("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    teachingWeekId: text("teaching_week_id").references(
      () => teachingWeeks.id,
      { onDelete: "set null" },
    ),
    title: text("title").notNull(),
    description: text("description"),
    sequenceNumber: integer("sequence_number").notNull().default(0),
    ...sourceColumns(),
    ...lifecycleColumns(),
  },
  (table) => [index("course_modules_course_sequence_idx").on(table.courseId, table.sequenceNumber)],
);

export const resources = pgTable(
  "resources",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    courseId: text("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    moduleId: text("module_id").references(() => courseModules.id, {
      onDelete: "set null",
    }),
    legacyResourceId: text("legacy_resource_id"),
    title: text("title").notNull(),
    fileName: text("file_name"),
    resourceType: text("resource_type").notNull(),
    mimeType: text("mime_type"),
    storageKey: text("storage_key"),
    status: processingStatus("status").notNull().default("pending"),
    currentVersionId: text("current_version_id"),
    ...sourceColumns(),
    ...lifecycleColumns(),
  },
  (table) => [
    index("resources_owner_course_idx").on(
      table.tenantId,
      table.userId,
      table.courseId,
    ),
    uniqueIndex("resources_course_source_unique")
      .on(table.courseId, table.sourceType, table.sourceId)
      .where(sql`${table.sourceId} is not null and ${table.deletedAt} is null`),
    uniqueIndex("resources_legacy_unique")
      .on(table.legacyResourceId)
      .where(sql`${table.legacyResourceId} is not null`),
  ],
);

export const resourceVersions = pgTable(
  "resource_versions",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
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
    sizeBytes: integer("size_bytes"),
    sourceUpdatedAt: timestamp("source_updated_at", { withTimezone: true }),
    lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),
    parserVersion: text("parser_version"),
    embeddingVersion: text("embedding_version"),
    processingStatus: processingStatus("processing_status")
      .notNull()
      .default("pending"),
    qualityStatus: text("quality_status").notNull().default("pending"),
    qualityReport: jsonb("quality_report")
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),
    isActive: boolean("is_active").notNull().default(false),
    ...lifecycleColumns(),
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
    index("resource_versions_owner_idx").on(table.tenantId, table.userId),
  ],
);

export const resourceProcessingJobs = pgTable(
  "resource_processing_jobs",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    resourceVersionId: text("resource_version_id")
      .notNull()
      .references(() => resourceVersions.id, { onDelete: "cascade" }),
    jobType: text("job_type").notNull(),
    idempotencyKey: text("idempotency_key").notNull(),
    status: processingStatus("status").notNull().default("pending"),
    attemptCount: integer("attempt_count").notNull().default(0),
    maxAttempts: integer("max_attempts").notNull().default(3),
    errorCode: text("error_code"),
    errorSummary: text("error_summary"),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    ...lifecycleColumns(),
  },
  (table) => [
    uniqueIndex("resource_processing_jobs_idempotency_unique").on(
      table.idempotencyKey,
    ),
    index("resource_processing_jobs_status_idx").on(table.status, table.createdAt),
  ],
);

export const resourceChunks = pgTable(
  "resource_chunks",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
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
    timestampStart: doublePrecision("timestamp_start"),
    timestampEnd: doublePrecision("timestamp_end"),
    sourceUrl: text("source_url"),
    embedding: vector("embedding", { dimensions: 1536 }),
    embeddingVersion: text("embedding_version"),
    ...lifecycleColumns(),
  },
  (table) => [
    uniqueIndex("resource_chunks_version_sequence_unique").on(
      table.resourceVersionId,
      table.sequenceNumber,
    ),
    index("resource_chunks_owner_course_idx").on(
      table.tenantId,
      table.userId,
      table.courseId,
    ),
    index("resource_chunks_embedding_hnsw_idx")
      .using("hnsw", table.embedding.op("vector_cosine_ops"))
      .with({ m: 16, ef_construction: 64 })
      .where(sql`${table.embedding} is not null and ${table.deletedAt} is null`),
  ],
);

export const assignments = pgTable(
  "assignments",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    courseId: text("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    dueAt: timestamp("due_at", { withTimezone: true }),
    availableFrom: timestamp("available_from", { withTimezone: true }),
    availableUntil: timestamp("available_until", { withTimezone: true }),
    status: text("status").notNull().default("active"),
    ...sourceColumns(),
    ...lifecycleColumns(),
  },
  (table) => [
    index("assignments_owner_course_due_idx").on(
      table.tenantId,
      table.userId,
      table.courseId,
      table.dueAt,
    ),
    uniqueIndex("assignments_course_source_unique")
      .on(table.courseId, table.sourceType, table.sourceId)
      .where(sql`${table.sourceId} is not null and ${table.deletedAt} is null`),
  ],
);

export const assessments = pgTable(
  "assessments",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    courseId: text("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    assignmentId: text("assignment_id").references(() => assignments.id, {
      onDelete: "set null",
    }),
    title: text("title").notNull(),
    assessmentType: text("assessment_type").notNull(),
    description: text("description"),
    dueAt: timestamp("due_at", { withTimezone: true }),
    examAt: timestamp("exam_at", { withTimezone: true }),
    weightPercent: doublePrecision("weight_percent"),
    estimatedMinutes: integer("estimated_minutes"),
    status: text("status").notNull().default("active"),
    ...sourceColumns(),
    ...lifecycleColumns(),
  },
  (table) => [
    index("assessments_owner_course_due_idx").on(
      table.tenantId,
      table.userId,
      table.courseId,
      table.dueAt,
    ),
    uniqueIndex("assessments_course_source_unique")
      .on(table.courseId, table.sourceType, table.sourceId)
      .where(sql`${table.sourceId} is not null and ${table.deletedAt} is null`),
  ],
);

export const rubrics = pgTable(
  "rubrics",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    assessmentId: text("assessment_id")
      .notNull()
      .references(() => assessments.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    criteria: jsonb("criteria")
      .$type<Array<Record<string, unknown>>>()
      .notNull()
      .default([]),
    ...sourceColumns(),
    ...lifecycleColumns(),
  },
  (table) => [index("rubrics_assessment_idx").on(table.assessmentId)],
);

export const calendarEvents = pgTable(
  "calendar_events",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    courseId: text("course_id").references(() => courses.id, {
      onDelete: "cascade",
    }),
    title: text("title").notNull(),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }),
    location: text("location"),
    eventType: text("event_type").notNull().default("course"),
    ...sourceColumns(),
    ...lifecycleColumns(),
  },
  (table) => [
    index("calendar_events_owner_start_idx").on(
      table.tenantId,
      table.userId,
      table.startsAt,
    ),
  ],
);

export const announcements = pgTable(
  "announcements",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    courseId: text("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    body: text("body").notNull(),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    ...sourceColumns(),
    ...lifecycleColumns(),
  },
  (table) => [index("announcements_course_published_idx").on(table.courseId, table.publishedAt)],
);

export const learningObjectives = pgTable(
  "learning_objectives",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    courseId: text("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    moduleId: text("module_id").references(() => courseModules.id, {
      onDelete: "set null",
    }),
    statement: text("statement").notNull(),
    bloomVerb: text("bloom_verb"),
    confidence: doublePrecision("confidence"),
    reviewStatus: text("review_status").notNull().default("provisional"),
    evidenceReferences: jsonb("evidence_references")
      .$type<Array<Record<string, unknown>>>()
      .notNull()
      .default([]),
    ...sourceColumns(),
    ...lifecycleColumns(),
  },
  (table) => [index("learning_objectives_course_idx").on(table.courseId)],
);

export const concepts = pgTable(
  "concepts",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    courseId: text("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    moduleId: text("module_id").references(() => courseModules.id, {
      onDelete: "set null",
    }),
    learningObjectiveId: text("learning_objective_id").references(
      () => learningObjectives.id,
      { onDelete: "set null" },
    ),
    name: text("name").notNull(),
    description: text("description"),
    conceptType: text("concept_type").notNull().default("concept"),
    legacyTopicId: text("legacy_topic_id"),
    confidence: doublePrecision("confidence"),
    reviewStatus: text("review_status").notNull().default("provisional"),
    ...sourceColumns(),
    ...lifecycleColumns(),
  },
  (table) => [
    index("concepts_owner_course_idx").on(
      table.tenantId,
      table.userId,
      table.courseId,
    ),
    uniqueIndex("concepts_course_legacy_topic_unique")
      .on(table.courseId, table.legacyTopicId)
      .where(sql`${table.legacyTopicId} is not null and ${table.deletedAt} is null`),
  ],
);

export const conceptEdges = pgTable(
  "concept_edges",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    courseId: text("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    fromConceptId: text("from_concept_id")
      .notNull()
      .references(() => concepts.id, { onDelete: "cascade" }),
    toConceptId: text("to_concept_id")
      .notNull()
      .references(() => concepts.id, { onDelete: "cascade" }),
    relationshipType: text("relationship_type").notNull(),
    confidence: doublePrecision("confidence").notNull().default(1),
    evidenceReferences: jsonb("evidence_references")
      .$type<Array<Record<string, unknown>>>()
      .notNull()
      .default([]),
    ...sourceColumns(),
    ...lifecycleColumns(),
  },
  (table) => [
    uniqueIndex("concept_edges_relation_unique").on(
      table.fromConceptId,
      table.toConceptId,
      table.relationshipType,
    ),
    index("concept_edges_course_idx").on(table.courseId),
  ],
);

export const resourceConcepts = pgTable(
  "resource_concepts",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    resourceId: text("resource_id")
      .notNull()
      .references(() => resources.id, { onDelete: "cascade" }),
    conceptId: text("concept_id")
      .notNull()
      .references(() => concepts.id, { onDelete: "cascade" }),
    relationshipType: text("relationship_type").notNull().default("explains"),
    confidence: doublePrecision("confidence").notNull().default(1),
    evidenceReferences: jsonb("evidence_references")
      .$type<Array<Record<string, unknown>>>()
      .notNull()
      .default([]),
    ...lifecycleColumns(),
  },
  (table) => [
    uniqueIndex("resource_concepts_relation_unique").on(
      table.resourceId,
      table.conceptId,
      table.relationshipType,
    ),
  ],
);

export const assessmentConcepts = pgTable(
  "assessment_concepts",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    assessmentId: text("assessment_id")
      .notNull()
      .references(() => assessments.id, { onDelete: "cascade" }),
    conceptId: text("concept_id")
      .notNull()
      .references(() => concepts.id, { onDelete: "cascade" }),
    relationshipType: text("relationship_type").notNull().default("assesses"),
    weight: doublePrecision("weight"),
    confidence: doublePrecision("confidence").notNull().default(1),
    evidenceReferences: jsonb("evidence_references")
      .$type<Array<Record<string, unknown>>>()
      .notNull()
      .default([]),
    ...lifecycleColumns(),
  },
  (table) => [
    uniqueIndex("assessment_concepts_relation_unique").on(
      table.assessmentId,
      table.conceptId,
    ),
  ],
);

export const toolRequirements = pgTable(
  "tool_requirements",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    courseId: text("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    conceptId: text("concept_id").references(() => concepts.id, {
      onDelete: "cascade",
    }),
    assessmentId: text("assessment_id").references(() => assessments.id, {
      onDelete: "cascade",
    }),
    toolId: text("tool_id").notNull(),
    capability: text("capability"),
    required: boolean("required").notNull().default(true),
    ...sourceColumns(),
    ...lifecycleColumns(),
  },
  (table) => [index("tool_requirements_course_idx").on(table.courseId)],
);

export const learningSessions = pgTable(
  "learning_sessions",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    courseId: text("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    conceptId: text("concept_id").references(() => concepts.id, {
      onDelete: "set null",
    }),
    assessmentId: text("assessment_id").references(() => assessments.id, {
      onDelete: "set null",
    }),
    mode: learningMode("mode").notNull(),
    packVersion: integer("pack_version").notNull(),
    routerVersion: integer("router_version").notNull(),
    routerDecision: jsonb("router_decision")
      .$type<Record<string, unknown>>()
      .notNull(),
    status: learningSessionStatus("status").notNull().default("created"),
    currentStepId: text("current_step_id"),
    availableMinutes: integer("available_minutes").notNull(),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    ...lifecycleColumns(),
  },
  (table) => [
    index("learning_sessions_owner_status_idx").on(
      table.tenantId,
      table.userId,
      table.status,
    ),
    index("learning_sessions_course_idx").on(table.courseId),
  ],
);

export const learningSessionSteps = pgTable(
  "learning_session_steps",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    learningSessionId: text("learning_session_id")
      .notNull()
      .references(() => learningSessions.id, { onDelete: "cascade" }),
    definitionId: text("definition_id").notNull(),
    sequenceNumber: integer("sequence_number").notNull(),
    stepType: text("step_type").notNull(),
    status: text("status").notNull().default("pending"),
    state: jsonb("state").$type<Record<string, unknown>>().notNull().default({}),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    ...lifecycleColumns(),
  },
  (table) => [
    uniqueIndex("learning_session_steps_sequence_unique").on(
      table.learningSessionId,
      table.sequenceNumber,
    ),
  ],
);

export const studentAttempts = pgTable(
  "student_attempts",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    courseId: text("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    conceptId: text("concept_id").references(() => concepts.id, {
      onDelete: "set null",
    }),
    learningSessionId: text("learning_session_id")
      .notNull()
      .references(() => learningSessions.id, { onDelete: "cascade" }),
    stepId: text("step_id")
      .notNull()
      .references(() => learningSessionSteps.id, { onDelete: "cascade" }),
    attemptNumber: integer("attempt_number").notNull(),
    response: jsonb("response").$type<Record<string, unknown>>().notNull(),
    correct: boolean("correct"),
    score: doublePrecision("score"),
    hintLevel: integer("hint_level").notNull().default(0),
    responseTimeMs: integer("response_time_ms"),
    errorType: text("error_type"),
    explanationQuality: doublePrecision("explanation_quality"),
    isIndependent: boolean("is_independent").notNull().default(false),
    isTransfer: boolean("is_transfer").notNull().default(false),
    submittedAt: timestamp("submitted_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    ...lifecycleColumns(),
  },
  (table) => [
    uniqueIndex("student_attempts_step_number_unique").on(
      table.stepId,
      table.attemptNumber,
    ),
    index("student_attempts_owner_concept_idx").on(
      table.tenantId,
      table.userId,
      table.conceptId,
    ),
  ],
);

export const conceptMastery = pgTable(
  "concept_mastery",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    courseId: text("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    conceptId: text("concept_id")
      .notNull()
      .references(() => concepts.id, { onDelete: "cascade" }),
    status: masteryStatus("status").notNull().default("not_started"),
    masteryScore: doublePrecision("mastery_score").notNull().default(0),
    independentAccuracy: doublePrecision("independent_accuracy")
      .notNull()
      .default(0),
    hintDependency: doublePrecision("hint_dependency").notNull().default(0),
    explanationQuality: doublePrecision("explanation_quality")
      .notNull()
      .default(0),
    transferAccuracy: doublePrecision("transfer_accuracy").notNull().default(0),
    delayedRecall: doublePrecision("delayed_recall").notNull().default(0),
    confidence: doublePrecision("confidence").notNull().default(0),
    ruleVersion: integer("rule_version").notNull(),
    evidenceSummary: jsonb("evidence_summary")
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),
    lastPractisedAt: timestamp("last_practised_at", { withTimezone: true }),
    nextReviewAt: timestamp("next_review_at", { withTimezone: true }),
    ...lifecycleColumns(),
  },
  (table) => [
    uniqueIndex("concept_mastery_user_concept_unique").on(
      table.userId,
      table.conceptId,
    ),
    index("concept_mastery_owner_review_idx").on(
      table.tenantId,
      table.userId,
      table.nextReviewAt,
    ),
  ],
);

export const errorPatterns = pgTable(
  "error_patterns",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    courseId: text("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    conceptId: text("concept_id")
      .notNull()
      .references(() => concepts.id, { onDelete: "cascade" }),
    errorType: text("error_type").notNull(),
    occurrenceCount: integer("occurrence_count").notNull().default(1),
    firstSeenAt: timestamp("first_seen_at", { withTimezone: true }).notNull(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull(),
    evidenceAttemptIds: jsonb("evidence_attempt_ids")
      .$type<string[]>()
      .notNull()
      .default([]),
    ...lifecycleColumns(),
  },
  (table) => [
    uniqueIndex("error_patterns_user_concept_type_unique").on(
      table.userId,
      table.conceptId,
      table.errorType,
    ),
  ],
);

export const reviewSchedule = pgTable(
  "review_schedule",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    courseId: text("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    conceptId: text("concept_id")
      .notNull()
      .references(() => concepts.id, { onDelete: "cascade" }),
    dueAt: timestamp("due_at", { withTimezone: true }).notNull(),
    forgettingRisk: doublePrecision("forgetting_risk").notNull().default(0),
    intervalHours: integer("interval_hours").notNull(),
    status: text("status").notNull().default("scheduled"),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    ...lifecycleColumns(),
  },
  (table) => [
    index("review_schedule_owner_due_idx").on(
      table.tenantId,
      table.userId,
      table.status,
      table.dueAt,
    ),
  ],
);

export const dailyPlans = pgTable(
  "daily_plans",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    planDate: date("plan_date").notNull(),
    timezone: text("timezone").notNull(),
    plannerVersion: integer("planner_version").notNull(),
    inputSnapshot: jsonb("input_snapshot")
      .$type<Record<string, unknown>>()
      .notNull(),
    status: text("status").notNull().default("active"),
    generatedAt: timestamp("generated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    ...lifecycleColumns(),
  },
  (table) => [
    uniqueIndex("daily_plans_user_date_version_unique").on(
      table.userId,
      table.planDate,
      table.plannerVersion,
    ),
    index("daily_plans_owner_date_idx").on(
      table.tenantId,
      table.userId,
      table.planDate,
    ),
  ],
);

export const dailyPlanItems = pgTable(
  "daily_plan_items",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    dailyPlanId: text("daily_plan_id")
      .notNull()
      .references(() => dailyPlans.id, { onDelete: "cascade" }),
    courseId: text("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    conceptId: text("concept_id").references(() => concepts.id, {
      onDelete: "set null",
    }),
    assessmentId: text("assessment_id").references(() => assessments.id, {
      onDelete: "set null",
    }),
    learningSessionId: text("learning_session_id").references(
      () => learningSessions.id,
      { onDelete: "set null" },
    ),
    title: text("title").notNull(),
    mode: learningMode("mode").notNull(),
    scheduledStartAt: timestamp("scheduled_start_at", { withTimezone: true }),
    estimatedMinutes: integer("estimated_minutes").notNull(),
    sequenceNumber: integer("sequence_number").notNull(),
    priorityScore: doublePrecision("priority_score").notNull(),
    prioritySignals: jsonb("priority_signals")
      .$type<Record<string, number>>()
      .notNull(),
    reason: text("reason").notNull(),
    requiredTools: jsonb("required_tools").$type<string[]>().notNull().default([]),
    status: text("status").notNull().default("planned"),
    ...lifecycleColumns(),
  },
  (table) => [
    uniqueIndex("daily_plan_items_sequence_unique").on(
      table.dailyPlanId,
      table.sequenceNumber,
    ),
    index("daily_plan_items_owner_idx").on(table.tenantId, table.userId),
  ],
);

export const toolConnections = pgTable(
  "tool_connections",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    toolId: text("tool_id").notNull(),
    status: connectionStatus("status").notNull().default("pending"),
    encryptedCredentials: jsonb("encrypted_credentials"),
    credentialKeyId: text("credential_key_id"),
    capabilities: jsonb("capabilities").$type<string[]>().notNull().default([]),
    deviceId: text("device_id"),
    lastObservedAt: timestamp("last_observed_at", { withTimezone: true }),
    ...sourceColumns(),
    ...lifecycleColumns(),
  },
  (table) => [
    index("tool_connections_owner_idx").on(table.tenantId, table.userId),
    uniqueIndex("tool_connections_user_tool_device_unique").on(
      table.userId,
      table.toolId,
      table.deviceId,
    ),
  ],
);

export const toolRuns = pgTable(
  "tool_runs",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    courseId: text("course_id").references(() => courses.id, {
      onDelete: "set null",
    }),
    learningSessionId: text("learning_session_id").references(
      () => learningSessions.id,
      { onDelete: "set null" },
    ),
    toolConnectionId: text("tool_connection_id")
      .notNull()
      .references(() => toolConnections.id, { onDelete: "restrict" }),
    projectId: text("project_id"),
    status: toolRunStatus("status").notNull().default("observed"),
    beforeSnapshot: jsonb("before_snapshot"),
    proposedActions: jsonb("proposed_actions")
      .$type<Array<Record<string, unknown>>>()
      .notNull()
      .default([]),
    approval: jsonb("approval"),
    actionHash: text("action_hash"),
    executedActions: jsonb("executed_actions")
      .$type<Array<Record<string, unknown>>>()
      .notNull()
      .default([]),
    afterSnapshot: jsonb("after_snapshot"),
    verification: jsonb("verification"),
    rollbackData: jsonb("rollback_data"),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    ...lifecycleColumns(),
  },
  (table) => [
    index("tool_runs_owner_created_idx").on(
      table.tenantId,
      table.userId,
      table.createdAt,
    ),
  ],
);

export const aiInteractions = pgTable(
  "ai_interactions",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    courseId: text("course_id").references(() => courses.id, {
      onDelete: "set null",
    }),
    learningSessionId: text("learning_session_id").references(
      () => learningSessions.id,
      { onDelete: "set null" },
    ),
    role: text("role").notNull(),
    taskType: text("task_type").notNull(),
    providerKey: text("provider_key").notNull(),
    modelKey: text("model_key").notNull(),
    schemaName: text("schema_name"),
    promptId: text("prompt_id"),
    promptVersion: integer("prompt_version"),
    cacheKeyHash: text("cache_key_hash"),
    inputTokens: integer("input_tokens").notNull().default(0),
    outputTokens: integer("output_tokens").notNull().default(0),
    latencyMs: integer("latency_ms").notNull().default(0),
    estimatedCostMinorUsd: integer("estimated_cost_minor_usd")
      .notNull()
      .default(0),
    confidence: doublePrecision("confidence"),
    sourceReferences: jsonb("source_references")
      .$type<Array<Record<string, unknown>>>()
      .notNull()
      .default([]),
    limitations: jsonb("limitations").$type<string[]>().notNull().default([]),
    status: text("status").notNull().default("completed"),
    errorCode: text("error_code"),
    ...lifecycleColumns(),
  },
  (table) => [
    index("ai_interactions_owner_created_idx").on(
      table.tenantId,
      table.userId,
      table.createdAt,
    ),
    index("ai_interactions_course_idx").on(table.courseId),
  ],
);

export const notifications = pgTable(
  "notifications",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    notificationType: text("notification_type").notNull(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    data: jsonb("data").$type<Record<string, unknown>>().notNull().default({}),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
    deliveredAt: timestamp("delivered_at", { withTimezone: true }),
    readAt: timestamp("read_at", { withTimezone: true }),
    status: text("status").notNull().default("pending"),
    ...lifecycleColumns(),
  },
  (table) => [
    index("notifications_owner_status_idx").on(
      table.tenantId,
      table.userId,
      table.status,
      table.scheduledAt,
    ),
  ],
);

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    userId: text("user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    actorType: text("actor_type").notNull(),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id"),
    requestId: text("request_id"),
    metadata: jsonb("metadata")
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("audit_logs_tenant_created_idx").on(table.tenantId, table.createdAt),
    index("audit_logs_entity_idx").on(table.entityType, table.entityId),
  ],
);

export const dataMigrationRuns = pgTable(
  "data_migration_runs",
  {
    id: text("id").primaryKey(),
    sourceSystem: text("source_system").notNull(),
    sourceSnapshotId: text("source_snapshot_id").notNull(),
    sourceChecksum: text("source_checksum").notNull(),
    rowCounts: jsonb("row_counts")
      .$type<Record<string, number>>()
      .notNull()
      .default({}),
    idMappingChecksum: text("id_mapping_checksum"),
    status: text("status").notNull().default("pending"),
    report: jsonb("report").$type<Record<string, unknown>>().notNull().default({}),
    startedAt: timestamp("started_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("data_migration_runs_snapshot_unique").on(
      table.sourceSystem,
      table.sourceSnapshotId,
    ),
  ],
);

export const legacyImportRows = pgTable(
  "legacy_import_rows",
  {
    id: text("id").primaryKey(),
    migrationRunId: text("migration_run_id")
      .notNull()
      .references(() => dataMigrationRuns.id, { onDelete: "cascade" }),
    sourceTable: text("source_table").notNull(),
    sourceRowId: text("source_row_id").notNull(),
    ownerUserId: text("owner_user_id"),
    sourceTenantId: text("source_tenant_id"),
    rowChecksum: text("row_checksum").notNull(),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
    importedAt: timestamp("imported_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("legacy_import_rows_run_source_unique").on(
      table.migrationRunId,
      table.sourceTable,
      table.sourceRowId,
    ),
    index("legacy_import_rows_owner_idx").on(table.ownerUserId),
  ],
);
