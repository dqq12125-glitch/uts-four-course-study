import type {
  ExtractedAssessment,
  ExtractedClassSession,
} from "../services/ai/types.ts";
import type { D1DatabaseLike } from "./types.ts";

export interface ResourceRecord {
  id: string;
  userId: string;
  courseId: string | null;
  courseName: string | null;
  fileName: string;
  storageKey: string;
  mimeType: string;
  fileSize: number;
  resourceType: string;
  processingStatus: string;
  retentionUntil: string | null;
  createdAt: string;
  deletedAt: string | null;
  extractedText: string | null;
  proposedDataJson: string | null;
  extractionStatus: string | null;
  failureCode: string | null;
}

export class ResourceRepository {
  private readonly db: D1DatabaseLike;

  constructor(db: D1DatabaseLike) {
    this.db = db;
  }

  async create(input: {
    id: string;
    extractionId: string;
    userId: string;
    courseId: string;
    fileName: string;
    storageKey: string;
    mimeType: string;
    fileSize: number;
    resourceType: string;
    retentionUntil: string;
    now: string;
  }): Promise<boolean> {
    const course = await this.db
      .prepare(
        `SELECT id FROM courses
         WHERE id = ? AND user_id = ? AND archived_at IS NULL`,
      )
      .bind(input.courseId, input.userId)
      .first<{ id: string }>();
    if (!course) return false;
    await this.db.batch([
      this.db
        .prepare(
          `INSERT INTO learning_resources (
             id, user_id, course_id, file_name, storage_key, mime_type,
             file_size, resource_type, processing_status,
             retention_until, created_at, updated_at
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)`,
        )
        .bind(
          input.id,
          input.userId,
          input.courseId,
          input.fileName,
          input.storageKey,
          input.mimeType,
          input.fileSize,
          input.resourceType,
          input.retentionUntil,
          input.now,
          input.now,
        ),
      this.db
        .prepare(
          `INSERT INTO resource_extractions (
             id, resource_id, user_id, status, created_at, updated_at
           ) VALUES (?, ?, ?, 'pending', ?, ?)`,
        )
        .bind(
          input.extractionId,
          input.id,
          input.userId,
          input.now,
          input.now,
        ),
      this.db
        .prepare(
          `INSERT INTO usage_events (
             id, user_id, event_name, event_category, properties_json,
             created_at
           ) VALUES (?, ?, 'resource_uploaded', 'content', ?, ?)`,
        )
        .bind(
          `event_${input.id}`,
          input.userId,
          JSON.stringify({
            resourceType: input.resourceType,
            mimeType: input.mimeType,
            fileSize: input.fileSize,
          }),
          input.now,
        ),
    ]);
    return true;
  }

  async list(userId: string): Promise<ResourceRecord[]> {
    const result = await this.db
      .prepare(
        `SELECT
           r.id, r.user_id AS userId, r.course_id AS courseId,
           c.course_name AS courseName, r.file_name AS fileName,
           r.storage_key AS storageKey, r.mime_type AS mimeType,
           r.file_size AS fileSize, r.resource_type AS resourceType,
           r.processing_status AS processingStatus,
           r.retention_until AS retentionUntil, r.created_at AS createdAt,
           r.deleted_at AS deletedAt, NULL AS extractedText,
           x.proposed_data_json AS proposedDataJson,
           x.status AS extractionStatus, x.failure_code AS failureCode
         FROM learning_resources r
         LEFT JOIN courses c
           ON c.id = r.course_id AND c.user_id = r.user_id
         LEFT JOIN resource_extractions x
           ON x.resource_id = r.id AND x.user_id = r.user_id
         WHERE r.user_id = ? AND r.deleted_at IS NULL
         ORDER BY r.created_at DESC`,
      )
      .bind(userId)
      .all<ResourceRecord>();
    return result.results ?? [];
  }

  async find(
    userId: string,
    resourceId: string,
  ): Promise<ResourceRecord | null> {
    return this.db
      .prepare(
        `SELECT
           r.id, r.user_id AS userId, r.course_id AS courseId,
           c.course_name AS courseName, r.file_name AS fileName,
           r.storage_key AS storageKey, r.mime_type AS mimeType,
           r.file_size AS fileSize, r.resource_type AS resourceType,
           r.processing_status AS processingStatus,
           r.retention_until AS retentionUntil, r.created_at AS createdAt,
           r.deleted_at AS deletedAt, x.extracted_text AS extractedText,
           x.proposed_data_json AS proposedDataJson,
           x.status AS extractionStatus, x.failure_code AS failureCode
         FROM learning_resources r
         LEFT JOIN courses c
           ON c.id = r.course_id AND c.user_id = r.user_id
         LEFT JOIN resource_extractions x
           ON x.resource_id = r.id AND x.user_id = r.user_id
         WHERE r.id = ? AND r.user_id = ? AND r.deleted_at IS NULL`,
      )
      .bind(resourceId, userId)
      .first<ResourceRecord>();
  }

  async markProcessing(
    userId: string,
    resourceId: string,
    now: string,
  ): Promise<boolean> {
    const result = await this.db
      .prepare(
        `UPDATE learning_resources
         SET processing_status = 'processing', updated_at = ?
         WHERE id = ? AND user_id = ? AND deleted_at IS NULL
           AND processing_status IN ('pending', 'failed')`,
      )
      .bind(now, resourceId, userId)
      .run();
    if (Number(result.meta.changes ?? 0) < 1) return false;
    await this.db
      .prepare(
        `UPDATE resource_extractions
         SET status = 'processing', failure_code = NULL, updated_at = ?
         WHERE resource_id = ? AND user_id = ?`,
      )
      .bind(now, resourceId, userId)
      .run();
    return true;
  }

  async completeExtraction(input: {
    userId: string;
    resourceId: string;
    extractedText: string | null;
    proposedDataJson: string;
    now: string;
  }): Promise<void> {
    await this.db.batch([
      this.db
        .prepare(
          `UPDATE resource_extractions
           SET extracted_text = ?, proposed_data_json = ?,
               status = 'awaiting_confirmation', failure_code = NULL,
               updated_at = ?
           WHERE resource_id = ? AND user_id = ?`,
        )
        .bind(
          input.extractedText,
          input.proposedDataJson,
          input.now,
          input.resourceId,
          input.userId,
        ),
      this.db
        .prepare(
          `UPDATE learning_resources
           SET processing_status = 'awaiting_confirmation', updated_at = ?
           WHERE id = ? AND user_id = ?`,
        )
        .bind(input.now, input.resourceId, input.userId),
    ]);
  }

  async failExtraction(input: {
    userId: string;
    resourceId: string;
    failureCode: string;
    now: string;
  }): Promise<void> {
    await this.db.batch([
      this.db
        .prepare(
          `UPDATE resource_extractions
           SET status = 'failed', failure_code = ?, updated_at = ?
           WHERE resource_id = ? AND user_id = ?`,
        )
        .bind(
          input.failureCode,
          input.now,
          input.resourceId,
          input.userId,
        ),
      this.db
        .prepare(
          `UPDATE learning_resources
           SET processing_status = 'failed', updated_at = ?
           WHERE id = ? AND user_id = ?`,
        )
        .bind(input.now, input.resourceId, input.userId),
    ]);
  }

  async claimConfirmation(
    userId: string,
    resourceId: string,
    now: string,
  ): Promise<boolean> {
    const result = await this.db
      .prepare(
        `UPDATE resource_extractions
         SET status = 'processing', updated_at = ?
         WHERE resource_id = ? AND user_id = ?
           AND status = 'awaiting_confirmation'`,
      )
      .bind(now, resourceId, userId)
      .run();
    return Number(result.meta.changes ?? 0) > 0;
  }

  async releaseConfirmation(
    userId: string,
    resourceId: string,
    now: string,
  ): Promise<void> {
    await this.db
      .prepare(
        `UPDATE resource_extractions
         SET status = 'awaiting_confirmation', updated_at = ?
         WHERE resource_id = ? AND user_id = ? AND status = 'processing'`,
      )
      .bind(now, resourceId, userId)
      .run();
  }

  async applyConfirmation(input: {
    userId: string;
    resourceId: string;
    courseId: string;
    assessments: Array<
      ExtractedAssessment & { id: string; dueAt: string | null }
    >;
    classSessions: Array<ExtractedClassSession & { id: string }>;
    topics: Array<{ id: string; title: string; sequenceNumber: number }>;
    now: string;
  }): Promise<{
    assessmentCount: number;
    classSessionCount: number;
    topicCount: number;
    skippedDuplicateCount: number;
  }> {
    const assessmentStatements = input.assessments.map((assessment) =>
        this.db
          .prepare(
            `INSERT INTO assessments (
               id, course_id, user_id, title, assessment_type, due_at,
               weight_percent, estimated_minutes, status, source_type,
               source_uid, source_resource_id, notes, created_at, updated_at
             )
             SELECT ?, c.id, ?, ?, ?, ?, ?, ?, 'not_started',
               'imported', ?, ?, ?, ?, ?
             FROM courses c
             WHERE c.id = ? AND c.user_id = ? AND c.archived_at IS NULL
              AND (
                ? IS NOT NULL OR NOT EXISTS (
                  SELECT 1 FROM assessments existing
                  WHERE existing.user_id = ?
                    AND existing.course_id = c.id
                    AND lower(trim(existing.title)) = lower(trim(?))
                    AND coalesce(existing.due_at, '') = coalesce(?, '')
                )
              )
             ON CONFLICT(user_id, course_id, source_uid)
               WHERE source_uid IS NOT NULL
             DO UPDATE SET
               title = excluded.title,
               assessment_type = excluded.assessment_type,
               due_at = excluded.due_at,
               weight_percent = excluded.weight_percent,
               estimated_minutes = excluded.estimated_minutes,
               source_type = 'imported',
               source_resource_id = excluded.source_resource_id,
               notes = excluded.notes,
               updated_at = excluded.updated_at`,
          )
          .bind(
            assessment.id,
            input.userId,
            assessment.title,
            assessment.assessmentType,
            assessment.dueAt,
            assessment.weightPercent,
            assessment.estimatedMinutes,
            assessment.sourceUid ?? null,
            input.resourceId,
            assessment.notes,
            input.now,
            input.now,
            input.courseId,
            input.userId,
            assessment.sourceUid ?? null,
            input.userId,
            assessment.title,
            assessment.dueAt,
          ),
      );
    const classSessionStatements = input.classSessions.map((session) =>
        this.db
          .prepare(
            `INSERT INTO class_sessions (
               id, course_id, user_id, session_type, title, day_of_week,
               start_time, end_time, location, map_url, start_date,
               end_date, recurrence_rule, source_uid, source_resource_id,
               created_at, updated_at
             )
             SELECT ?, c.id, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
             FROM courses c
             WHERE c.id = ? AND c.user_id = ? AND c.archived_at IS NULL
               AND (
                 ? IS NOT NULL OR NOT EXISTS (
                   SELECT 1 FROM class_sessions existing
                   WHERE existing.user_id = ?
                     AND existing.course_id = c.id
                     AND lower(trim(existing.title)) = lower(trim(?))
                     AND existing.day_of_week = ?
                     AND existing.start_time = ?
                     AND existing.end_time = ?
                 )
               )
             ON CONFLICT(user_id, course_id, source_uid)
               WHERE source_uid IS NOT NULL
             DO UPDATE SET
               session_type = excluded.session_type,
               title = excluded.title,
               day_of_week = excluded.day_of_week,
               start_time = excluded.start_time,
               end_time = excluded.end_time,
               location = excluded.location,
               map_url = excluded.map_url,
               start_date = excluded.start_date,
               end_date = excluded.end_date,
               recurrence_rule = excluded.recurrence_rule,
               source_resource_id = excluded.source_resource_id,
               updated_at = excluded.updated_at`,
          )
          .bind(
            session.id,
            input.userId,
            session.sessionType,
            session.title,
            session.dayOfWeek,
            session.startTime,
            session.endTime,
            session.location,
            session.mapUrl ?? null,
            session.startDate ?? null,
            session.endDate ?? null,
            session.recurrenceRule ?? null,
            session.sourceUid ?? null,
            input.resourceId,
            input.now,
            input.now,
            input.courseId,
            input.userId,
            session.sourceUid ?? null,
            input.userId,
            session.title,
            session.dayOfWeek,
            session.startTime,
            session.endTime,
          ),
      );
    const topicStatements = input.topics.map((topic) =>
        this.db
          .prepare(
            `INSERT OR IGNORE INTO topics (
               id, course_id, user_id, title, sequence_number,
               created_at, updated_at
             )
             SELECT ?, c.id, ?, ?, ?, ?, ?
             FROM courses c
             WHERE c.id = ? AND c.user_id = ? AND c.archived_at IS NULL`,
          )
          .bind(
            topic.id,
            input.userId,
            topic.title,
            topic.sequenceNumber,
            input.now,
            input.now,
            input.courseId,
            input.userId,
          ),
      );
    const statements = [
      ...assessmentStatements,
      ...classSessionStatements,
      ...topicStatements,
      this.db
        .prepare(
          `UPDATE resource_extractions
           SET status = 'confirmed', confirmed_at = ?, updated_at = ?
           WHERE resource_id = ? AND user_id = ? AND status = 'processing'`,
        )
        .bind(input.now, input.now, input.resourceId, input.userId),
      this.db
        .prepare(
          `UPDATE learning_resources
           SET processing_status = 'ready', updated_at = ?
           WHERE id = ? AND user_id = ?`,
        )
        .bind(input.now, input.resourceId, input.userId),
      this.db
        .prepare(
          `INSERT INTO usage_events (
             id, user_id, event_name, event_category, properties_json,
             created_at
           ) VALUES (?, ?, 'resource_import_confirmed', 'content', ?, ?)`,
        )
        .bind(
          `event_confirm_${input.resourceId}`,
          input.userId,
          JSON.stringify({
            selectedAssessmentCount: input.assessments.length,
            selectedClassSessionCount: input.classSessions.length,
            selectedTopicCount: input.topics.length,
          }),
          input.now,
        ),
    ];
    const results = await this.db.batch(statements);
    const changes = (index: number): number =>
      Number(results[index]?.meta.changes ?? 0);
    const assessmentCount = assessmentStatements.reduce(
      (total, _statement, index) => total + changes(index),
      0,
    );
    const classOffset = assessmentStatements.length;
    const classSessionCount = classSessionStatements.reduce(
      (total, _statement, index) =>
        total + changes(classOffset + index),
      0,
    );
    const topicOffset = classOffset + classSessionStatements.length;
    const topicCount = topicStatements.reduce(
      (total, _statement, index) =>
        total + changes(topicOffset + index),
      0,
    );
    return {
      assessmentCount,
      classSessionCount,
      topicCount,
      skippedDuplicateCount:
        input.assessments.length +
        input.classSessions.length +
        input.topics.length -
        assessmentCount -
        classSessionCount -
        topicCount,
    };
  }

  async markDeleted(input: {
    userId: string;
    resourceId: string;
    actorUserId: string;
    auditId: string;
    now: string;
  }): Promise<string | null> {
    const record = await this.find(input.userId, input.resourceId);
    if (!record) return null;
    await this.db.batch([
      this.db
        .prepare(
          `UPDATE learning_resources
           SET processing_status = 'deleted', deleted_at = ?, updated_at = ?
           WHERE id = ? AND user_id = ? AND deleted_at IS NULL`,
        )
        .bind(
          input.now,
          input.now,
          input.resourceId,
          input.userId,
        ),
      this.db
        .prepare(
          `UPDATE resource_extractions
           SET status = 'deleted', extracted_text = NULL,
               proposed_data_json = NULL, updated_at = ?
           WHERE resource_id = ? AND user_id = ?`,
        )
        .bind(input.now, input.resourceId, input.userId),
      this.db
        .prepare(
          `INSERT INTO audit_logs (
             id, actor_user_id, action, entity_type, entity_id,
             metadata_json, created_at
           ) VALUES (?, ?, 'resource_deleted', 'learning_resource', ?, ?, ?)`,
        )
        .bind(
          input.auditId,
          input.actorUserId,
          input.resourceId,
          JSON.stringify({ physicalDeletionRequested: true }),
          input.now,
        ),
    ]);
    return record.storageKey;
  }

  async pendingPhysicalDeletion(limit = 100): Promise<
    Array<{ id: string; storageKey: string }>
  > {
    const result = await this.db
      .prepare(
        `SELECT id, storage_key AS storageKey
         FROM learning_resources
         WHERE deleted_at IS NOT NULL AND storage_key != ''
         ORDER BY deleted_at
         LIMIT ?`,
      )
      .bind(limit)
      .all<{ id: string; storageKey: string }>();
    return result.results ?? [];
  }

  async markPhysicallyDeleted(resourceId: string, now: string): Promise<void> {
    await this.db
      .prepare(
        `UPDATE learning_resources
         SET storage_key = '', updated_at = ?
         WHERE id = ? AND deleted_at IS NOT NULL`,
      )
      .bind(now, resourceId)
      .run();
  }
}
