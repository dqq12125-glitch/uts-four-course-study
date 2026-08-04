import type { ResourceIngestionStatus } from "@deepstudy/shared-types";
import type { DocumentIngestionResult } from "@deepstudy/ingestion";
import type { D1DatabaseLike } from "./types.ts";

export interface VersionedResourceRecord {
  resourceId: string;
  legacyResourceId: string;
  userId: string;
  courseId: string;
  sourceType: string;
  sourceId: string;
  sourceUrl: string | null;
  sourceUpdatedAt: string | null;
  status: string;
  currentVersionId: string;
  versionNumber: number;
  fileName: string;
  mimeType: string;
  storageKey: string;
  fileHash: string;
  processingStatus: string;
}

export interface ReusableChunkRecord {
  id: string;
  contentHash: string;
  page: number | null;
  slide: number | null;
  section: string | null;
  embedding: number[];
  embeddingVersion: string;
}

function parseStringArray(value: string | null): string[] {
  if (!value) return [];
  try {
    const decoded: unknown = JSON.parse(value);
    return Array.isArray(decoded)
      ? decoded.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

function parseEmbedding(value: string | null): number[] | null {
  if (!value) return null;
  try {
    const decoded: unknown = JSON.parse(value);
    if (
      Array.isArray(decoded) &&
      decoded.length > 0 &&
      decoded.every((item) => typeof item === "number" && Number.isFinite(item))
    ) {
      return decoded;
    }
  } catch {
    // Invalid legacy/cache data is not reusable.
  }
  return null;
}

export class ResourceIngestionRepository {
  private readonly db: D1DatabaseLike;

  constructor(db: D1DatabaseLike) {
    this.db = db;
  }

  async findManualDuplicate(
    userId: string,
    courseId: string,
    fileHash: string,
  ): Promise<string | null> {
    const row = await this.db
      .prepare(
        `SELECT r.legacy_resource_id AS legacyResourceId
         FROM resources r
         JOIN resource_versions v ON v.id = r.current_version_id
         JOIN learning_resources legacy
           ON legacy.id = r.legacy_resource_id
          AND legacy.user_id = r.user_id
          AND legacy.deleted_at IS NULL
         WHERE r.user_id = ? AND r.course_id = ?
           AND r.source_type = 'manual-upload'
           AND r.status != 'tombstoned' AND r.deleted_at IS NULL
           AND v.file_hash = ? AND v.deleted_at IS NULL
         LIMIT 1`,
      )
      .bind(userId, courseId, fileHash)
      .first<{ legacyResourceId: string }>();
    return row?.legacyResourceId ?? null;
  }

  async findBySource(input: {
    userId: string;
    courseId: string;
    sourceType: string;
    sourceId: string;
  }): Promise<VersionedResourceRecord | null> {
    return this.db
      .prepare(
        `SELECT
           r.id AS resourceId, r.legacy_resource_id AS legacyResourceId,
           r.user_id AS userId, r.course_id AS courseId,
           r.source_type AS sourceType, r.source_id AS sourceId,
           r.source_url AS sourceUrl, r.source_updated_at AS sourceUpdatedAt,
           r.status, r.current_version_id AS currentVersionId,
           v.version_number AS versionNumber, v.file_name AS fileName,
           v.mime_type AS mimeType, v.storage_key AS storageKey,
           v.file_hash AS fileHash, v.processing_status AS processingStatus
         FROM resources r
         JOIN resource_versions v ON v.id = r.current_version_id
         WHERE r.user_id = ? AND r.course_id = ?
           AND r.source_type = ? AND r.source_id = ?
           AND r.deleted_at IS NULL
         LIMIT 1`,
      )
      .bind(input.userId, input.courseId, input.sourceType, input.sourceId)
      .first<VersionedResourceRecord>();
  }

  async reserveResource(input: {
    resourceId: string;
    legacyResourceId: string;
    versionId: string;
    jobId: string;
    userId: string;
    courseId: string;
    connectionId?: string | null;
    sourceType: string;
    sourceId: string;
    sourceUrl?: string | null;
    sourceUpdatedAt?: string | null;
    fileName: string;
    mimeType: string;
    storageKey: string;
    fileHash: string;
    fileSize: number;
    resourceType: string;
    parserVersion: string;
    embeddingVersion?: string | null;
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
    const idempotencyKey = `${input.versionId}:${input.parserVersion}:${input.embeddingVersion ?? "none"}`;
    await this.db.batch([
      this.db
        .prepare(
          `INSERT INTO resources (
             id, user_id, course_id, legacy_resource_id, connection_id,
             source_type, source_id, source_url, source_updated_at, title,
             resource_type, mime_type, status, current_version_id,
             last_synced_at, created_at, updated_at
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?)`,
        )
        .bind(
          input.resourceId,
          input.userId,
          input.courseId,
          input.legacyResourceId,
          input.connectionId ?? null,
          input.sourceType,
          input.sourceId,
          input.sourceUrl ?? null,
          input.sourceUpdatedAt ?? null,
          input.fileName,
          input.resourceType,
          input.mimeType,
          input.versionId,
          input.now,
          input.now,
          input.now,
        ),
      this.db
        .prepare(
          `INSERT INTO resource_versions (
             id, user_id, resource_id, version_number, file_name, mime_type,
             storage_key, file_hash, size_bytes, source_updated_at,
             last_synced_at, parser_version, embedding_version,
             processing_status, quality_status, is_active, created_at, updated_at
           ) VALUES (?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending',
             'pending', 1, ?, ?)`,
        )
        .bind(
          input.versionId,
          input.userId,
          input.resourceId,
          input.fileName,
          input.mimeType,
          input.storageKey,
          input.fileHash,
          input.fileSize,
          input.sourceUpdatedAt ?? null,
          input.now,
          input.parserVersion,
          input.embeddingVersion ?? null,
          input.now,
          input.now,
        ),
      this.db
        .prepare(
          `INSERT INTO resource_processing_jobs (
             id, user_id, resource_version_id, job_type, idempotency_key,
             status, attempt_count, max_attempts, created_at, updated_at
           ) VALUES (?, ?, ?, 'parse_chunk_embed', ?, 'pending', 0, 3, ?, ?)`,
        )
        .bind(
          input.jobId,
          input.userId,
          input.versionId,
          idempotencyKey,
          input.now,
          input.now,
        ),
    ]);
    return true;
  }

  async appendVersion(input: {
    resourceId: string;
    versionId: string;
    jobId: string;
    userId: string;
    fileName: string;
    mimeType: string;
    storageKey: string;
    fileHash: string;
    fileSize: number;
    sourceUrl?: string | null;
    sourceUpdatedAt?: string | null;
    parserVersion: string;
    embeddingVersion?: string | null;
    now: string;
  }): Promise<number> {
    const current = await this.db
      .prepare(
        `SELECT coalesce(max(version_number), 0) AS versionNumber
         FROM resource_versions
         WHERE resource_id = ? AND user_id = ?`,
      )
      .bind(input.resourceId, input.userId)
      .first<{ versionNumber: number }>();
    const versionNumber = Number(current?.versionNumber ?? 0) + 1;
    const idempotencyKey = `${input.versionId}:${input.parserVersion}:${input.embeddingVersion ?? "none"}`;
    await this.db.batch([
      this.db
        .prepare(
          `UPDATE resource_versions
           SET is_active = 0, updated_at = ?
           WHERE resource_id = ? AND user_id = ? AND is_active = 1`,
        )
        .bind(input.now, input.resourceId, input.userId),
      this.db
        .prepare(
          `INSERT INTO resource_versions (
             id, user_id, resource_id, version_number, file_name, mime_type,
             storage_key, file_hash, size_bytes, source_updated_at,
             last_synced_at, parser_version, embedding_version,
             processing_status, quality_status, is_active, created_at, updated_at
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending',
             'pending', 1, ?, ?)`,
        )
        .bind(
          input.versionId,
          input.userId,
          input.resourceId,
          versionNumber,
          input.fileName,
          input.mimeType,
          input.storageKey,
          input.fileHash,
          input.fileSize,
          input.sourceUpdatedAt ?? null,
          input.now,
          input.parserVersion,
          input.embeddingVersion ?? null,
          input.now,
          input.now,
        ),
      this.db
        .prepare(
          `INSERT INTO resource_processing_jobs (
             id, user_id, resource_version_id, job_type, idempotency_key,
             status, attempt_count, max_attempts, created_at, updated_at
           ) VALUES (?, ?, ?, 'parse_chunk_embed', ?, 'pending', 0, 3, ?, ?)`,
        )
        .bind(
          input.jobId,
          input.userId,
          input.versionId,
          idempotencyKey,
          input.now,
          input.now,
        ),
      this.db
        .prepare(
          `UPDATE resources
           SET title = ?, mime_type = ?, source_url = ?, source_updated_at = ?,
               status = 'pending', current_version_id = ?, last_synced_at = ?,
               updated_at = ?
           WHERE id = ? AND user_id = ? AND deleted_at IS NULL`,
        )
        .bind(
          input.fileName,
          input.mimeType,
          input.sourceUrl ?? null,
          input.sourceUpdatedAt ?? null,
          input.versionId,
          input.now,
          input.now,
          input.resourceId,
          input.userId,
        ),
    ]);
    return versionNumber;
  }

  async rollbackReservation(resourceId: string, userId: string): Promise<void> {
    await this.db
      .prepare(`DELETE FROM resources WHERE id = ? AND user_id = ?`)
      .bind(resourceId, userId)
      .run();
  }

  async markSeen(input: {
    resourceId: string;
    userId: string;
    sourceUrl?: string | null;
    sourceUpdatedAt?: string | null;
    now: string;
  }): Promise<void> {
    await this.db.batch([
      this.db
        .prepare(
          `UPDATE resources
           SET source_url = coalesce(?, source_url), source_updated_at = ?,
               last_synced_at = ?, status = CASE
                 WHEN status = 'tombstoned' THEN 'completed' ELSE status END,
               updated_at = ?
           WHERE id = ? AND user_id = ? AND deleted_at IS NULL`,
        )
        .bind(
          input.sourceUrl ?? null,
          input.sourceUpdatedAt ?? null,
          input.now,
          input.now,
          input.resourceId,
          input.userId,
        ),
      this.db
        .prepare(
          `UPDATE resource_versions
           SET last_synced_at = ?, processing_status = CASE
                 WHEN processing_status = 'tombstoned' THEN 'completed'
                 ELSE processing_status END,
               is_active = 1, updated_at = ?
           WHERE id = (
             SELECT current_version_id FROM resources
             WHERE id = ? AND user_id = ? AND deleted_at IS NULL
           ) AND user_id = ?`,
        )
        .bind(
          input.now,
          input.now,
          input.resourceId,
          input.userId,
          input.userId,
        ),
    ]);
  }

  async claimProcessing(input: {
    userId: string;
    resourceId: string;
    versionId: string;
    now: string;
  }): Promise<boolean> {
    const claimed = await this.db
      .prepare(
        `UPDATE resource_processing_jobs
         SET status = 'processing', attempt_count = attempt_count + 1,
             started_at = ?, completed_at = NULL, error_code = NULL,
             error_summary = NULL, updated_at = ?
         WHERE user_id = ? AND resource_version_id = ?
           AND status IN ('pending', 'failed') AND attempt_count < max_attempts`,
      )
      .bind(input.now, input.now, input.userId, input.versionId)
      .run();
    if (Number(claimed.meta.changes ?? 0) < 1) return false;
    await this.db.batch([
      this.db
        .prepare(
          `UPDATE resource_versions
           SET processing_status = 'processing', quality_status = 'pending',
               updated_at = ?
           WHERE id = ? AND user_id = ?`,
        )
        .bind(input.now, input.versionId, input.userId),
      this.db
        .prepare(
          `UPDATE resources SET status = 'processing', updated_at = ?
           WHERE id = ? AND user_id = ? AND current_version_id = ?`,
        )
        .bind(input.now, input.resourceId, input.userId, input.versionId),
    ]);
    return true;
  }

  async reusableChunks(input: {
    userId: string;
    resourceId: string;
    excludeVersionId: string;
  }): Promise<ReusableChunkRecord[]> {
    const rows = await this.db
      .prepare(
        `SELECT c.id, c.content_hash AS contentHash, c.page, c.slide, c.section,
                c.embedding_json AS embeddingJson,
                c.embedding_version AS embeddingVersion
         FROM resource_chunks c
         JOIN resource_versions v ON v.id = c.resource_version_id
         WHERE c.user_id = ? AND c.resource_id = ?
           AND c.resource_version_id != ? AND c.deleted_at IS NULL
           AND c.embedding_json IS NOT NULL AND c.embedding_version IS NOT NULL
         ORDER BY v.version_number DESC, c.sequence_number`,
      )
      .bind(input.userId, input.resourceId, input.excludeVersionId)
      .all<{
        id: string;
        contentHash: string;
        page: number | null;
        slide: number | null;
        section: string | null;
        embeddingJson: string;
        embeddingVersion: string;
      }>();
    const seen = new Set<string>();
    const output: ReusableChunkRecord[] = [];
    for (const row of rows.results ?? []) {
      const embedding = parseEmbedding(row.embeddingJson);
      const key = `${row.contentHash}|${row.page ?? ""}|${row.slide ?? ""}|${row.section ?? ""}|${row.embeddingVersion}`;
      if (!embedding || seen.has(key)) continue;
      seen.add(key);
      output.push({ ...row, embedding });
    }
    return output;
  }

  async completedText(input: {
    userId: string;
    versionId: string;
  }): Promise<string | null | undefined> {
    const version = await this.db
      .prepare(
        `SELECT processing_status AS processingStatus
         FROM resource_versions WHERE id = ? AND user_id = ?`,
      )
      .bind(input.versionId, input.userId)
      .first<{ processingStatus: string }>();
    if (version?.processingStatus !== "completed") return undefined;
    const rows = await this.db
      .prepare(
        `SELECT content FROM resource_chunks
         WHERE resource_version_id = ? AND user_id = ? AND deleted_at IS NULL
         ORDER BY sequence_number`,
      )
      .bind(input.versionId, input.userId)
      .all<{ content: string }>();
    const text = (rows.results ?? [])
      .map((row) => row.content.trim())
      .filter(Boolean)
      .join("\n\n")
      .slice(0, 200_000);
    return text || null;
  }

  async completeProcessing(input: {
    userId: string;
    courseId: string;
    resourceId: string;
    versionId: string;
    result: DocumentIngestionResult;
    chunkIds: string[];
    now: string;
  }): Promise<void> {
    await this.db
      .prepare(`DELETE FROM resource_chunks WHERE resource_version_id = ? AND user_id = ?`)
      .bind(input.versionId, input.userId)
      .run();
    const statements = input.result.chunks.map((chunk, index) => {
      const reference = chunk.sourceReference;
      return this.db
        .prepare(
          `INSERT INTO resource_chunks (
             id, user_id, course_id, resource_id, resource_version_id,
             sequence_number, content, content_hash, page, slide, section,
             timestamp_start, timestamp_end, source_url, embedding_json,
             embedding_version, reused_from_chunk_id, created_at, updated_at
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          input.chunkIds[index],
          input.userId,
          input.courseId,
          input.resourceId,
          input.versionId,
          chunk.sequenceNumber,
          chunk.content,
          chunk.contentHash,
          reference.page ?? null,
          reference.slide ?? null,
          reference.section ?? null,
          reference.timestampStart ?? null,
          reference.timestampEnd ?? null,
          reference.sourceUrl ?? null,
          chunk.embedding ? JSON.stringify(chunk.embedding) : null,
          chunk.embedding ? input.result.embeddingVersion : null,
          chunk.reusedFromChunkId ?? null,
          input.now,
          input.now,
        );
    });
    for (let offset = 0; offset < statements.length; offset += 50) {
      await this.db.batch(statements.slice(offset, offset + 50));
    }
    await this.db.batch([
      this.db
        .prepare(
          `UPDATE resource_versions
           SET content_hash = ?, parser_version = ?, embedding_version = ?,
               processing_status = 'completed', quality_status = ?,
               quality_report_json = ?, last_synced_at = ?, updated_at = ?
           WHERE id = ? AND user_id = ?`,
        )
        .bind(
          input.result.contentHash,
          input.result.parserVersion,
          input.result.embeddingVersion,
          input.result.quality.status,
          JSON.stringify(input.result.quality),
          input.now,
          input.now,
          input.versionId,
          input.userId,
        ),
      this.db
        .prepare(
          `UPDATE resources
           SET status = 'completed', last_synced_at = ?, updated_at = ?
           WHERE id = ? AND user_id = ? AND current_version_id = ?`,
        )
        .bind(
          input.now,
          input.now,
          input.resourceId,
          input.userId,
          input.versionId,
        ),
      this.db
        .prepare(
          `UPDATE resource_processing_jobs
           SET status = 'completed', completed_at = ?, updated_at = ?
           WHERE user_id = ? AND resource_version_id = ? AND status = 'processing'`,
        )
        .bind(input.now, input.now, input.userId, input.versionId),
    ]);
  }

  async failProcessing(input: {
    userId: string;
    resourceId: string;
    versionId: string;
    errorCode: string;
    errorSummary: string;
    now: string;
  }): Promise<void> {
    const summary = input.errorSummary.replace(/[\r\n]+/g, " ").slice(0, 500);
    await this.db.batch([
      this.db
        .prepare(
          `UPDATE resource_versions
           SET processing_status = 'failed', quality_status = 'failed',
               quality_report_json = ?, updated_at = ?
           WHERE id = ? AND user_id = ?`,
        )
        .bind(
          JSON.stringify({ status: "failed", issues: [input.errorCode] }),
          input.now,
          input.versionId,
          input.userId,
        ),
      this.db
        .prepare(
          `UPDATE resources SET status = 'failed', updated_at = ?
           WHERE id = ? AND user_id = ? AND current_version_id = ?`,
        )
        .bind(
          input.now,
          input.resourceId,
          input.userId,
          input.versionId,
        ),
      this.db
        .prepare(
          `UPDATE resource_processing_jobs
           SET status = 'failed', error_code = ?, error_summary = ?,
               completed_at = ?, updated_at = ?
           WHERE user_id = ? AND resource_version_id = ? AND status = 'processing'`,
        )
        .bind(
          input.errorCode,
          summary,
          input.now,
          input.now,
          input.userId,
          input.versionId,
        ),
    ]);
  }

  async statusForLegacy(
    userId: string,
    legacyResourceId: string,
  ): Promise<ResourceIngestionStatus | null> {
    const row = await this.db
      .prepare(
        `SELECT
           r.source_type AS sourceType, r.source_id AS sourceId,
           r.source_url AS sourceUrl, r.current_version_id AS versionId,
           v.version_number AS versionNumber, v.file_hash AS fileHash,
           v.content_hash AS contentHash, v.parser_version AS parserVersion,
           v.embedding_version AS embeddingVersion,
           v.processing_status AS pipelineStatus,
           j.status AS jobStatus, coalesce(j.attempt_count, 0) AS jobAttempts,
           (SELECT count(*) FROM resource_chunks c
             WHERE c.resource_version_id = v.id AND c.deleted_at IS NULL) AS chunkCount,
           (SELECT count(*) FROM resource_chunks c
             WHERE c.resource_version_id = v.id AND c.deleted_at IS NULL
               AND c.embedding_json IS NOT NULL) AS embeddedChunkCount,
           (SELECT count(*) FROM resource_chunks c
             WHERE c.resource_version_id = v.id AND c.deleted_at IS NULL
               AND c.reused_from_chunk_id IS NOT NULL) AS reusedChunkCount,
           v.quality_status AS qualityStatus,
           v.quality_report_json AS qualityReportJson,
           r.last_synced_at AS lastSyncedAt
         FROM resources r
         LEFT JOIN resource_versions v ON v.id = r.current_version_id
         LEFT JOIN resource_processing_jobs j
           ON j.id = (
             SELECT latest.id FROM resource_processing_jobs latest
             WHERE latest.resource_version_id = v.id
             ORDER BY latest.created_at DESC LIMIT 1
           )
         WHERE r.user_id = ? AND r.legacy_resource_id = ?
           AND r.deleted_at IS NULL
         LIMIT 1`,
      )
      .bind(userId, legacyResourceId)
      .first<{
        sourceType: string;
        sourceId: string | null;
        sourceUrl: string | null;
        versionId: string | null;
        versionNumber: number | null;
        fileHash: string | null;
        contentHash: string | null;
        parserVersion: string | null;
        embeddingVersion: string | null;
        pipelineStatus: ResourceIngestionStatus["pipelineStatus"];
        jobStatus: ResourceIngestionStatus["jobStatus"];
        jobAttempts: number;
        chunkCount: number;
        embeddedChunkCount: number;
        reusedChunkCount: number;
        qualityStatus: ResourceIngestionStatus["qualityStatus"];
        qualityReportJson: string | null;
        lastSyncedAt: string | null;
      }>();
    if (!row) return null;
    return {
      sourceType: row.sourceType,
      sourceId: row.sourceId,
      sourceUrl: row.sourceUrl,
      versionId: row.versionId,
      versionNumber:
        row.versionNumber === null ? null : Number(row.versionNumber),
      fileHash: row.fileHash,
      contentHash: row.contentHash,
      parserVersion: row.parserVersion,
      embeddingVersion: row.embeddingVersion,
      pipelineStatus: row.pipelineStatus,
      jobStatus: row.jobStatus,
      jobAttempts: Number(row.jobAttempts ?? 0),
      chunkCount: Number(row.chunkCount ?? 0),
      embeddedChunkCount: Number(row.embeddedChunkCount ?? 0),
      reusedChunkCount: Number(row.reusedChunkCount ?? 0),
      qualityStatus: row.qualityStatus,
      qualityIssues: parseStringArrayFromQuality(row.qualityReportJson),
      lastSyncedAt: row.lastSyncedAt,
    };
  }

  async storageKeysForLegacy(input: {
    userId: string;
    legacyResourceId: string;
  }): Promise<Array<{ versionId: string; storageKey: string }>> {
    const rows = await this.db
      .prepare(
        `SELECT v.id AS versionId, v.storage_key AS storageKey
         FROM resource_versions v
         JOIN resources r ON r.id = v.resource_id
         WHERE r.user_id = ? AND r.legacy_resource_id = ?
           AND v.storage_key NOT LIKE '__deleted__/%'`,
      )
      .bind(input.userId, input.legacyResourceId)
      .all<{ versionId: string; storageKey: string }>();
    return rows.results ?? [];
  }

  async pendingStorageDeletion(limit = 100): Promise<
    Array<{ versionId: string; storageKey: string }>
  > {
    const rows = await this.db
      .prepare(
        `SELECT v.id AS versionId, v.storage_key AS storageKey
         FROM resource_versions v
         JOIN resources r ON r.id = v.resource_id
         WHERE r.deleted_at IS NOT NULL
           AND v.storage_key NOT LIKE '__deleted__/%'
         ORDER BY r.deleted_at, v.version_number
         LIMIT ?`,
      )
      .bind(limit)
      .all<{ versionId: string; storageKey: string }>();
    return rows.results ?? [];
  }

  async markVersionPhysicallyDeleted(
    versionId: string,
    now: string,
  ): Promise<void> {
    await this.db
      .prepare(
        `UPDATE resource_versions
         SET storage_key = '__deleted__/' || id, updated_at = ?
         WHERE id = ? AND storage_key NOT LIKE '__deleted__/%'`,
      )
      .bind(now, versionId)
      .run();
  }

  async tombstoneLegacy(input: {
    userId: string;
    legacyResourceId: string;
    now: string;
  }): Promise<void> {
    await this.db.batch([
      this.db
        .prepare(
          `UPDATE resources
           SET status = 'tombstoned', deleted_at = ?, updated_at = ?
           WHERE user_id = ? AND legacy_resource_id = ? AND deleted_at IS NULL`,
        )
        .bind(input.now, input.now, input.userId, input.legacyResourceId),
      this.db
        .prepare(
          `UPDATE resource_versions
           SET processing_status = 'tombstoned', is_active = 0,
               deleted_at = ?, updated_at = ?
           WHERE user_id = ? AND resource_id IN (
             SELECT id FROM resources WHERE user_id = ? AND legacy_resource_id = ?
           ) AND deleted_at IS NULL`,
        )
        .bind(
          input.now,
          input.now,
          input.userId,
          input.userId,
          input.legacyResourceId,
        ),
      this.db
        .prepare(
          `UPDATE resource_chunks
           SET deleted_at = ?, updated_at = ?
           WHERE user_id = ? AND resource_id IN (
             SELECT id FROM resources WHERE user_id = ? AND legacy_resource_id = ?
           ) AND deleted_at IS NULL`,
        )
        .bind(
          input.now,
          input.now,
          input.userId,
          input.userId,
          input.legacyResourceId,
        ),
      this.db
        .prepare(
          `UPDATE resource_processing_jobs
           SET status = 'tombstoned', updated_at = ?
           WHERE user_id = ? AND resource_version_id IN (
             SELECT v.id FROM resource_versions v
             JOIN resources r ON r.id = v.resource_id
             WHERE r.user_id = ? AND r.legacy_resource_id = ?
           ) AND status != 'completed'`,
        )
        .bind(input.now, input.userId, input.userId, input.legacyResourceId),
    ]);
  }

  async sourceResources(input: {
    userId: string;
    courseId: string;
    connectionId: string;
    sourceType: string;
  }): Promise<Array<{ resourceId: string; sourceId: string }>> {
    const rows = await this.db
      .prepare(
        `SELECT id AS resourceId, source_id AS sourceId
         FROM resources
         WHERE user_id = ? AND course_id = ? AND connection_id = ?
           AND source_type = ? AND deleted_at IS NULL`,
      )
      .bind(
        input.userId,
        input.courseId,
        input.connectionId,
        input.sourceType,
      )
      .all<{ resourceId: string; sourceId: string }>();
    return rows.results ?? [];
  }

  async tombstoneMissingSources(input: {
    userId: string;
    courseId: string;
    connectionId: string;
    sourceType: string;
    seenSourceIds: ReadonlySet<string>;
    now: string;
  }): Promise<number> {
    const existing = await this.sourceResources(input);
    const missing = existing.filter((row) => !input.seenSourceIds.has(row.sourceId));
    for (const row of missing) {
      await this.db.batch([
        this.db
          .prepare(
            `UPDATE resources SET status = 'tombstoned', updated_at = ?
             WHERE id = ? AND user_id = ? AND deleted_at IS NULL`,
          )
          .bind(input.now, row.resourceId, input.userId),
        this.db
          .prepare(
            `UPDATE resource_versions
             SET processing_status = 'tombstoned', is_active = 0, updated_at = ?
             WHERE resource_id = ? AND user_id = ? AND is_active = 1`,
          )
          .bind(input.now, row.resourceId, input.userId),
      ]);
    }
    return missing.length;
  }
}

function parseStringArrayFromQuality(value: string | null): string[] {
  if (!value) return [];
  try {
    const decoded: unknown = JSON.parse(value);
    if (!decoded || typeof decoded !== "object" || !("issues" in decoded)) {
      return [];
    }
    return parseStringArray(JSON.stringify(decoded.issues));
  } catch {
    return [];
  }
}
