import {
  DocumentIngestionPipeline,
  PARSER_VERSION,
  ingestionFailureCode,
  sha256Bytes,
} from "@deepstudy/ingestion";
import type { ResourceIngestionStatus } from "@deepstudy/shared-types";
import { createId } from "../lib/ids.ts";
import type { ResourceIngestionRepository } from "../repositories/resource-ingestion-repository.ts";
import type { VersionedResourceRecord } from "../repositories/resource-ingestion-repository.ts";

export interface ResourceIngestionRegistration {
  resourceId: string;
  versionId: string;
  jobId: string;
  fileHash: string;
}

export class ResourceIngestionService {
  private readonly repository: ResourceIngestionRepository;
  private readonly pipeline: DocumentIngestionPipeline;
  private readonly embeddingVersion: string | null;

  constructor(
    repository: ResourceIngestionRepository,
    pipeline: DocumentIngestionPipeline,
    embeddingVersion: string | null,
  ) {
    this.repository = repository;
    this.pipeline = pipeline;
    this.embeddingVersion = embeddingVersion;
  }

  fingerprint(bytes: Uint8Array): Promise<string> {
    return sha256Bytes(bytes);
  }

  findManualDuplicate(
    userId: string,
    courseId: string,
    fileHash: string,
  ): Promise<string | null> {
    return this.repository.findManualDuplicate(userId, courseId, fileHash);
  }

  async reserve(input: {
    resourceId: string;
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
    now: string;
  }): Promise<ResourceIngestionRegistration | null> {
    const registration = {
      resourceId: input.resourceId,
      versionId: createId("version"),
      jobId: createId("job"),
      fileHash: input.fileHash,
    };
    const created = await this.repository.reserveResource({
      ...input,
      legacyResourceId: input.resourceId,
      versionId: registration.versionId,
      jobId: registration.jobId,
      parserVersion: PARSER_VERSION,
      embeddingVersion: this.embeddingVersion,
    });
    return created ? registration : null;
  }

  rollbackReservation(resourceId: string, userId: string): Promise<void> {
    return this.repository.rollbackReservation(resourceId, userId);
  }

  sourceState(input: {
    userId: string;
    courseId: string;
    sourceType: string;
    sourceId: string;
  }): Promise<VersionedResourceRecord | null> {
    return this.repository.findBySource(input);
  }

  markSeen(input: {
    resourceId: string;
    userId: string;
    sourceUrl?: string | null;
    sourceUpdatedAt?: string | null;
    now: string;
  }): Promise<void> {
    return this.repository.markSeen(input);
  }

  async appendVersion(input: {
    resourceId: string;
    userId: string;
    fileName: string;
    mimeType: string;
    storageKey: string;
    fileHash: string;
    fileSize: number;
    sourceUrl?: string | null;
    sourceUpdatedAt?: string | null;
    now: string;
  }): Promise<ResourceIngestionRegistration> {
    const registration = {
      resourceId: input.resourceId,
      versionId: createId("version"),
      jobId: createId("job"),
      fileHash: input.fileHash,
    };
    await this.repository.appendVersion({
      ...input,
      versionId: registration.versionId,
      jobId: registration.jobId,
      parserVersion: PARSER_VERSION,
      embeddingVersion: this.embeddingVersion,
    });
    return registration;
  }

  tombstoneMissingSources(input: {
    userId: string;
    courseId: string;
    connectionId: string;
    sourceType: string;
    seenSourceIds: ReadonlySet<string>;
    now: string;
  }): Promise<number> {
    return this.repository.tombstoneMissingSources(input);
  }

  async process(input: {
    userId: string;
    courseId: string;
    resourceId: string;
    versionId: string;
    fileName: string;
    mimeType: string;
    bytes: Uint8Array;
    sourceUrl?: string | null;
    now: Date;
  }): Promise<{
    success: boolean;
    extractedText: string | null;
    failureCode: string | null;
  }> {
    const now = input.now.toISOString();
    const claimed = await this.repository.claimProcessing({
      userId: input.userId,
      resourceId: input.resourceId,
      versionId: input.versionId,
      now,
    });
    if (!claimed) {
      const completedText = await this.repository.completedText({
        userId: input.userId,
        versionId: input.versionId,
      });
      if (completedText !== undefined) {
        return {
          success: true,
          extractedText: completedText,
          failureCode: null,
        };
      }
      return {
        success: false,
        extractedText: null,
        failureCode: "RESOURCE_PROCESSING_CONFLICT",
      };
    }
    try {
      const reusableChunks = await this.repository.reusableChunks({
        userId: input.userId,
        resourceId: input.resourceId,
        excludeVersionId: input.versionId,
      });
      const result = await this.pipeline.process({
        fileName: input.fileName,
        mimeType: input.mimeType,
        bytes: input.bytes,
        resourceId: input.resourceId,
        courseId: input.courseId,
        sourceUrl: input.sourceUrl,
        reusableChunks,
      });
      await this.repository.completeProcessing({
        userId: input.userId,
        courseId: input.courseId,
        resourceId: input.resourceId,
        versionId: input.versionId,
        result,
        chunkIds: result.chunks.map(() => createId("chunk")),
        now,
      });
      return {
        success: true,
        extractedText: result.extractedText,
        failureCode: null,
      };
    } catch (error) {
      const code = ingestionFailureCode(error);
      await this.repository.failProcessing({
        userId: input.userId,
        resourceId: input.resourceId,
        versionId: input.versionId,
        errorCode: code,
        errorSummary: error instanceof Error ? error.message : code,
        now,
      });
      return { success: false, extractedText: null, failureCode: code };
    }
  }

  status(
    userId: string,
    legacyResourceId: string,
  ): Promise<ResourceIngestionStatus | null> {
    return this.repository.statusForLegacy(userId, legacyResourceId);
  }

  storageKeysForLegacy(input: {
    userId: string;
    legacyResourceId: string;
  }): Promise<Array<{ versionId: string; storageKey: string }>> {
    return this.repository.storageKeysForLegacy(input);
  }

  pendingStorageDeletion(
    limit?: number,
  ): Promise<Array<{ versionId: string; storageKey: string }>> {
    return this.repository.pendingStorageDeletion(limit);
  }

  markVersionPhysicallyDeleted(
    versionId: string,
    now: string,
  ): Promise<void> {
    return this.repository.markVersionPhysicallyDeleted(versionId, now);
  }

  tombstoneLegacy(input: {
    userId: string;
    legacyResourceId: string;
    now: string;
  }): Promise<void> {
    return this.repository.tombstoneLegacy(input);
  }
}
