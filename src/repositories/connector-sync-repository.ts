import type { D1DatabaseLike } from "./types.ts";

export interface CourseConnectorRecord {
  connectionId: string;
  userId: string;
  courseId: string;
  connectorId: "mock" | "canvas";
  displayName: string;
  baseUrl: string | null;
  encryptedCredentialsJson: string | null;
  sourceCourseId: string;
  sourceUrl: string | null;
}

export interface SyncRunCounts {
  discoveredCount: number;
  createdCount: number;
  updatedCount: number;
  skippedCount: number;
  tombstonedCount: number;
  failedCount: number;
}

export class ConnectorSyncRepository {
  private readonly db: D1DatabaseLike;

  constructor(db: D1DatabaseLike) {
    this.db = db;
  }

  findCourseConnection(
    userId: string,
    courseId: string,
  ): Promise<CourseConnectorRecord | null> {
    return this.db
      .prepare(
        `SELECT
           connection.id AS connectionId, connection.user_id AS userId,
           link.course_id AS courseId, connection.connector_id AS connectorId,
           connection.display_name AS displayName,
           connection.base_url AS baseUrl,
           connection.encrypted_credentials_json AS encryptedCredentialsJson,
           link.source_course_id AS sourceCourseId,
           link.source_url AS sourceUrl
         FROM lms_course_links link
         JOIN lms_connections connection
           ON connection.id = link.connection_id
          AND connection.user_id = link.user_id
          AND connection.deleted_at IS NULL
          AND connection.status = 'active'
         JOIN courses course
           ON course.id = link.course_id
          AND course.user_id = link.user_id
          AND course.archived_at IS NULL
         WHERE link.user_id = ? AND link.course_id = ?
           AND link.deleted_at IS NULL
         LIMIT 1`,
      )
      .bind(userId, courseId)
      .first<CourseConnectorRecord>();
  }

  async startRun(input: {
    id: string;
    userId: string;
    courseId: string;
    connectionId: string;
    connectorId: string;
    sourceCourseId: string;
    now: string;
  }): Promise<void> {
    await this.db
      .prepare(
        `INSERT INTO resource_sync_runs (
           id, user_id, course_id, connection_id, connector_id,
           source_course_id, status, started_at, created_at, updated_at
         ) VALUES (?, ?, ?, ?, ?, ?, 'processing', ?, ?, ?)`,
      )
      .bind(
        input.id,
        input.userId,
        input.courseId,
        input.connectionId,
        input.connectorId,
        input.sourceCourseId,
        input.now,
        input.now,
        input.now,
      )
      .run();
  }

  async completeRun(input: {
    id: string;
    userId: string;
    connectionId: string;
    status: "completed" | "partial";
    counts: SyncRunCounts;
    details: Record<string, unknown>;
    now: string;
  }): Promise<void> {
    await this.db.batch([
      this.db
        .prepare(
          `UPDATE resource_sync_runs
           SET status = ?, discovered_count = ?, created_count = ?,
               updated_count = ?, skipped_count = ?, tombstoned_count = ?,
               failed_count = ?, details_json = ?, completed_at = ?,
               updated_at = ?
           WHERE id = ? AND user_id = ? AND status = 'processing'`,
        )
        .bind(
          input.status,
          input.counts.discoveredCount,
          input.counts.createdCount,
          input.counts.updatedCount,
          input.counts.skippedCount,
          input.counts.tombstonedCount,
          input.counts.failedCount,
          JSON.stringify(input.details),
          input.now,
          input.now,
          input.id,
          input.userId,
        ),
      this.db
        .prepare(
          `UPDATE lms_connections
           SET last_synced_at = ?, updated_at = ?
           WHERE id = ? AND user_id = ? AND deleted_at IS NULL`,
        )
        .bind(input.now, input.now, input.connectionId, input.userId),
    ]);
  }

  async failRun(input: {
    id: string;
    userId: string;
    errorCode: string;
    now: string;
  }): Promise<void> {
    await this.db
      .prepare(
        `UPDATE resource_sync_runs
         SET status = 'failed', failed_count = failed_count + 1,
             details_json = ?, completed_at = ?, updated_at = ?
         WHERE id = ? AND user_id = ? AND status = 'processing'`,
      )
      .bind(
        JSON.stringify({ errorCode: input.errorCode }),
        input.now,
        input.now,
        input.id,
        input.userId,
      )
      .run();
  }
}
