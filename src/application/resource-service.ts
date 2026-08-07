import type { EntitlementService } from "./entitlement-service.ts";
import type { FeatureFlagService } from "./feature-flag-service.ts";
import type { AiProvider, ExtractionResult } from "../services/ai/types.ts";
import type { PrivateObjectStorage } from "../services/storage/private-object-storage.ts";
import type {
  ResourceRecord,
  ResourceRepository,
} from "../repositories/resource-repository.ts";
import type { AiRepository } from "../repositories/ai-repository.ts";
import {
  validatePrivateUpload,
} from "../services/resources/file-validation.ts";
import { parseIcs } from "../services/resources/ics-parser.ts";
import { extractLocalCourseData } from "../services/resources/local-text-extractor.ts";
import { ApiError } from "../lib/api-errors.ts";
import { createId } from "../lib/ids.ts";
import { zonedDateTimeToUtc } from "../lib/timezone.ts";
import type { ResourceIngestionService } from "./resource-ingestion-service.ts";
import type { ConnectorId, ResourceFile } from "@deepstudy/shared-types";

export const RESOURCE_TYPES = [
  "lecture_notes",
  "subject_information",
  "assessment_information",
  "personal_notes",
  "timetable",
  "other",
] as const;

export interface ResourceProposal {
  institutionName: string | null;
  courseCode: string | null;
  courseName: string | null;
  assessments: ExtractionResult["assessments"];
  classSessions: ExtractionResult["classSessions"];
  topics: string[];
  warnings: string[];
}

function proposalFrom(result: ExtractionResult): ResourceProposal {
  return {
    institutionName: result.institutionName,
    courseCode: result.courseCode,
    courseName: result.courseName,
    assessments: result.assessments,
    classSessions: result.classSessions,
    topics: result.topics,
    warnings: result.warnings ?? [],
  };
}

function mergeExtractions(
  local: ExtractionResult,
  ai: ExtractionResult,
): ExtractionResult {
  const assessmentKey = (item: ExtractionResult["assessments"][number]) =>
    `${item.title.toLocaleLowerCase()}|${item.dueLocal ?? ""}`;
  const classKey = (item: ExtractionResult["classSessions"][number]) =>
    item.sourceUid ??
    `${item.title.toLocaleLowerCase()}|${item.dayOfWeek}|${item.startTime}|${item.endTime}`;
  const assessments = new Map(
    [...local.assessments, ...ai.assessments].map((item) => [
      assessmentKey(item),
      item,
    ]),
  );
  const classSessions = new Map(
    [...local.classSessions, ...ai.classSessions].map((item) => [
      classKey(item),
      item,
    ]),
  );
  return {
    ...ai,
    institutionName: ai.institutionName ?? local.institutionName,
    courseCode: ai.courseCode ?? local.courseCode,
    courseName: ai.courseName ?? local.courseName,
    assessments: [...assessments.values()].slice(0, 40),
    classSessions: [...classSessions.values()].slice(0, 40),
    topics: [...new Set([...local.topics, ...ai.topics])].slice(0, 80),
    warnings: [
      ...new Set([...(local.warnings ?? []), ...(ai.warnings ?? [])]),
    ].slice(0, 20),
  };
}

function imageDataUrl(mimeType: string, bytes: Uint8Array): string {
  let binary = "";
  for (let offset = 0; offset < bytes.length; offset += 8_192) {
    binary += String.fromCharCode(
      ...bytes.slice(offset, offset + 8_192),
    );
  }
  return `data:${mimeType};base64,${btoa(binary)}`;
}

function failureCode(error: unknown): string {
  return error instanceof ApiError ? error.code : "RESOURCE_PROCESSING_FAILED";
}

export class ResourceService {
  private readonly repository: ResourceRepository;
  private readonly aiRepository: AiRepository;
  private readonly storage: PrivateObjectStorage;
  private readonly provider: AiProvider;
  private readonly entitlements: EntitlementService;
  private readonly flags: FeatureFlagService;
  private readonly ingestion: ResourceIngestionService | null;

  constructor(
    repository: ResourceRepository,
    aiRepository: AiRepository,
    storage: PrivateObjectStorage,
    provider: AiProvider,
    entitlements: EntitlementService,
    flags: FeatureFlagService,
    ingestion: ResourceIngestionService | null = null,
  ) {
    this.repository = repository;
    this.aiRepository = aiRepository;
    this.storage = storage;
    this.provider = provider;
    this.entitlements = entitlements;
    this.flags = flags;
    this.ingestion = ingestion;
  }

  async list(userId: string): Promise<ResourceRecord[]> {
    const resources = await this.repository.list(userId);
    if (!this.ingestion) return resources;
    return Promise.all(
      resources.map(async (resource) => ({
        ...resource,
        ingestion: await this.ingestion!.status(userId, resource.id),
      })),
    );
  }

  async detail(
    userId: string,
    resourceId: string,
  ): Promise<ResourceRecord> {
    const resource = await this.repository.find(userId, resourceId);
    if (!resource) {
      throw new ApiError(
        "RESOURCE_NOT_FOUND",
        404,
        "The learning resource was not found.",
      );
    }
    return {
      ...resource,
      ...(this.ingestion
        ? { ingestion: await this.ingestion.status(userId, resourceId) }
        : {}),
    };
  }

  async upload(input: {
    userId: string;
    role: "student" | "admin";
    courseId: string;
    fileName: string;
    mimeType: string;
    bytes: Uint8Array;
    resourceType: (typeof RESOURCE_TYPES)[number];
    language: "zh-CN" | "en";
    timezone: string;
    now?: Date;
  }): Promise<ResourceRecord> {
    await this.flags.require("file_upload_enabled");
    const entitlement = await this.entitlements.snapshot(
      input.userId,
      input.role,
      input.now ?? new Date(),
    );
    this.entitlements.assertCanUploadResource(entitlement);
    const validated = validatePrivateUpload(input);
    const fileHash = this.ingestion
      ? await this.ingestion.fingerprint(input.bytes)
      : null;
    if (this.ingestion && fileHash) {
      const duplicateId = await this.ingestion.findManualDuplicate(
        input.userId,
        input.courseId,
        fileHash,
      );
      if (duplicateId) return this.detail(input.userId, duplicateId);
    }
    const now = input.now ?? new Date();
    const resourceId = createId("resource");
    const storageKey = `users/${input.userId}/${resourceId}/${validated.fileName}`;
    await this.storage.put(
      storageKey,
      input.bytes,
      validated.mimeType,
    );
    let versionId: string | null = null;
    if (this.ingestion && fileHash) {
      try {
        const registration = await this.ingestion.reserve({
          resourceId,
          userId: input.userId,
          courseId: input.courseId,
          sourceType: "manual-upload",
          sourceId: `sha256:${fileHash}`,
          fileName: validated.fileName,
          mimeType: validated.mimeType,
          storageKey,
          fileHash,
          fileSize: input.bytes.byteLength,
          resourceType: input.resourceType,
          now: now.toISOString(),
        });
        if (!registration) {
          await this.storage.delete(storageKey);
          throw new ApiError(
            "COURSE_NOT_FOUND",
            404,
            "The selected course was not found.",
          );
        }
        versionId = registration.versionId;
      } catch (error) {
        const duplicateId = await this.ingestion.findManualDuplicate(
          input.userId,
          input.courseId,
          fileHash,
        );
        await this.storage.delete(storageKey);
        if (duplicateId) return this.detail(input.userId, duplicateId);
        throw error;
      }
    }
    let created = false;
    try {
      created = await this.repository.create({
        id: resourceId,
        extractionId: createId("extraction"),
        userId: input.userId,
        courseId: input.courseId,
        fileName: validated.fileName,
        storageKey,
        mimeType: validated.mimeType,
        fileSize: input.bytes.byteLength,
        resourceType: input.resourceType,
        retentionUntil: new Date(
          now.getTime() + 365 * 86_400_000,
        ).toISOString(),
        now: now.toISOString(),
      });
    } catch (error) {
      if (this.ingestion) {
        await this.ingestion.rollbackReservation(resourceId, input.userId);
      }
      await this.storage.delete(storageKey);
      throw error;
    }
    if (!created) {
      if (this.ingestion) {
        await this.ingestion.rollbackReservation(resourceId, input.userId);
      }
      await this.storage.delete(storageKey);
      throw new ApiError(
        "COURSE_NOT_FOUND",
        404,
        "The selected course was not found.",
      );
    }
    await this.process({
      userId: input.userId,
      resourceId,
      language: input.language,
      timezone: input.timezone,
      bytes: input.bytes,
      now,
      versionId,
    });
    return this.detail(input.userId, resourceId);
  }

  async retryProcessing(input: {
    userId: string;
    resourceId: string;
    language: "zh-CN" | "en";
    timezone: string;
    now?: Date;
  }): Promise<ResourceRecord> {
    const resource = await this.detail(input.userId, input.resourceId);
    const bytes = await this.storage.get(resource.storageKey);
    if (!bytes) {
      throw new ApiError(
        "RESOURCE_FILE_MISSING",
        410,
        "The stored file is no longer available.",
      );
    }
    if (
      this.ingestion &&
      resource.ingestion?.pipelineStatus === "failed" &&
      resource.ingestion.versionId &&
      (resource.processingStatus === "awaiting_confirmation" ||
        resource.processingStatus === "ready")
    ) {
      await this.ingestion.process({
        userId: input.userId,
        courseId: resource.courseId ?? "",
        resourceId: resource.id,
        versionId: resource.ingestion.versionId,
        fileName: resource.fileName,
        mimeType: resource.mimeType,
        bytes,
        sourceUrl: resource.ingestion.sourceUrl,
        now: input.now ?? new Date(),
      });
      return this.detail(input.userId, input.resourceId);
    }
    await this.process({
      ...input,
      bytes,
      now: input.now ?? new Date(),
      versionId: resource.ingestion?.versionId ?? null,
    });
    return this.detail(input.userId, input.resourceId);
  }

  async sourceNeedsDownload(input: {
    userId: string;
    courseId: string;
    sourceType: ConnectorId;
    sourceId: string;
    sourceUrl?: string | null;
    sourceUpdatedAt?: string | null;
    now?: Date;
  }): Promise<boolean> {
    if (!this.ingestion) return true;
    const state = await this.ingestion.sourceState(input);
    if (
      state &&
      input.sourceUpdatedAt &&
      state.sourceUpdatedAt === input.sourceUpdatedAt
    ) {
      await this.ingestion.markSeen({
        resourceId: state.resourceId,
        userId: input.userId,
        sourceUrl: input.sourceUrl,
        sourceUpdatedAt: input.sourceUpdatedAt,
        now: (input.now ?? new Date()).toISOString(),
      });
      return false;
    }
    return true;
  }

  async syncResource(input: {
    userId: string;
    role: "student" | "admin";
    courseId: string;
    connectionId: string;
    sourceType: Exclude<ConnectorId, "manual-upload">;
    sourceId: string;
    sourceUrl?: string | null;
    sourceUpdatedAt?: string | null;
    file: ResourceFile;
    resourceType?: (typeof RESOURCE_TYPES)[number];
    language: "zh-CN" | "en";
    timezone: string;
    now?: Date;
  }): Promise<{ action: "created" | "updated" | "skipped"; resourceId: string }> {
    if (!this.ingestion) {
      throw new ApiError(
        "INGESTION_PIPELINE_UNAVAILABLE",
        503,
        "The versioned ingestion pipeline is unavailable.",
      );
    }
    const now = input.now ?? new Date();
    const validated = validatePrivateUpload({
      fileName: input.file.fileName,
      mimeType: input.file.mimeType,
      bytes: input.file.bytes,
    });
    const fileHash = await this.ingestion.fingerprint(input.file.bytes);
    const existing = await this.ingestion.sourceState({
      userId: input.userId,
      courseId: input.courseId,
      sourceType: input.sourceType,
      sourceId: input.sourceId,
    });
    if (existing?.fileHash === fileHash) {
      await this.ingestion.markSeen({
        resourceId: existing.resourceId,
        userId: input.userId,
        sourceUrl: input.sourceUrl,
        sourceUpdatedAt: input.sourceUpdatedAt,
        now: now.toISOString(),
      });
      return { action: "skipped", resourceId: existing.legacyResourceId };
    }

    const resourceType = input.resourceType ?? "lecture_notes";
    if (!existing) {
      await this.flags.require("file_upload_enabled");
      const entitlement = await this.entitlements.snapshot(
        input.userId,
        input.role,
        now,
      );
      this.entitlements.assertCanUploadResource(entitlement);
    }
    const resourceId = existing?.resourceId ?? createId("resource");
    const objectId = createId("object");
    const storageKey = `users/${input.userId}/${resourceId}/versions/${objectId}/${validated.fileName}`;
    await this.storage.put(storageKey, input.file.bytes, validated.mimeType);

    let versionId: string;
    if (existing) {
      try {
        const registration = await this.ingestion.appendVersion({
          resourceId,
          userId: input.userId,
          fileName: validated.fileName,
          mimeType: validated.mimeType,
          storageKey,
          fileHash,
          fileSize: input.file.bytes.byteLength,
          sourceUrl: input.sourceUrl,
          sourceUpdatedAt: input.sourceUpdatedAt,
          now: now.toISOString(),
        });
        versionId = registration.versionId;
        const replaced = await this.repository.replaceForProcessing({
          userId: input.userId,
          resourceId: existing.legacyResourceId,
          fileName: validated.fileName,
          storageKey,
          mimeType: validated.mimeType,
          fileSize: input.file.bytes.byteLength,
          resourceType,
          now: now.toISOString(),
        });
        if (!replaced) {
          throw new ApiError(
            "RESOURCE_NOT_FOUND",
            404,
            "The synchronized resource compatibility record was not found.",
          );
        }
      } catch (error) {
        await this.storage.delete(storageKey);
        throw error;
      }
    } else {
      const registration = await this.ingestion.reserve({
        resourceId,
        userId: input.userId,
        courseId: input.courseId,
        connectionId: input.connectionId,
        sourceType: input.sourceType,
        sourceId: input.sourceId,
        sourceUrl: input.sourceUrl,
        sourceUpdatedAt: input.sourceUpdatedAt,
        fileName: validated.fileName,
        mimeType: validated.mimeType,
        storageKey,
        fileHash,
        fileSize: input.file.bytes.byteLength,
        resourceType,
        now: now.toISOString(),
      });
      if (!registration) {
        await this.storage.delete(storageKey);
        throw new ApiError(
          "COURSE_NOT_FOUND",
          404,
          "The selected course was not found.",
        );
      }
      versionId = registration.versionId;
      try {
        const created = await this.repository.create({
          id: resourceId,
          extractionId: createId("extraction"),
          userId: input.userId,
          courseId: input.courseId,
          fileName: validated.fileName,
          storageKey,
          mimeType: validated.mimeType,
          fileSize: input.file.bytes.byteLength,
          resourceType,
          retentionUntil: new Date(
            now.getTime() + 365 * 86_400_000,
          ).toISOString(),
          now: now.toISOString(),
        });
        if (!created) {
          throw new ApiError(
            "COURSE_NOT_FOUND",
            404,
            "The selected course was not found.",
          );
        }
      } catch (error) {
        await this.ingestion.rollbackReservation(resourceId, input.userId);
        await this.storage.delete(storageKey);
        throw error;
      }
    }

    await this.process({
      userId: input.userId,
      resourceId,
      language: input.language,
      timezone: input.timezone,
      bytes: input.file.bytes,
      now,
      versionId,
    });
    return {
      action: existing ? "updated" : "created",
      resourceId,
    };
  }

  tombstoneMissingSources(input: {
    userId: string;
    courseId: string;
    connectionId: string;
    sourceType: Exclude<ConnectorId, "manual-upload">;
    seenSourceIds: ReadonlySet<string>;
    now: string;
  }): Promise<number> {
    return this.ingestion
      ? this.ingestion.tombstoneMissingSources(input)
      : Promise.resolve(0);
  }

  private async process(input: {
    userId: string;
    resourceId: string;
    language: "zh-CN" | "en";
    timezone: string;
    bytes: Uint8Array;
    now: Date;
    versionId: string | null;
  }): Promise<void> {
    const resource = await this.detail(input.userId, input.resourceId);
    const claimed = await this.repository.markProcessing(
      input.userId,
      input.resourceId,
      input.now.toISOString(),
    );
    if (!claimed) {
      if (
        resource.processingStatus === "awaiting_confirmation" ||
        resource.processingStatus === "ready"
      ) {
        return;
      }
      throw new ApiError(
        "RESOURCE_PROCESSING_CONFLICT",
        409,
        "This resource is already being processed.",
      );
    }
    const ingestionResult =
      this.ingestion && input.versionId
        ? await this.ingestion.process({
            userId: input.userId,
            courseId: resource.courseId ?? "",
            resourceId: input.resourceId,
            versionId: input.versionId,
            fileName: resource.fileName,
            mimeType: resource.mimeType,
            bytes: input.bytes,
            sourceUrl: resource.ingestion?.sourceUrl,
            now: input.now,
          })
        : null;
    try {
      const extracted = await this.extract({
        resource,
        bytes: input.bytes,
        language: input.language,
        timezone: input.timezone,
        userId: input.userId,
        now: input.now,
        extractedTextOverride:
          ingestionResult?.success === true
            ? ingestionResult.extractedText
            : undefined,
      });
      await this.repository.completeExtraction({
        userId: input.userId,
        resourceId: input.resourceId,
        extractedText: extracted.text,
        proposedDataJson: JSON.stringify(proposalFrom(extracted.result)),
        now: input.now.toISOString(),
      });
    } catch (error) {
      await this.repository.failExtraction({
        userId: input.userId,
        resourceId: input.resourceId,
        failureCode: failureCode(error),
        now: input.now.toISOString(),
      });
    }
  }

  private async extract(input: {
    resource: ResourceRecord;
    bytes: Uint8Array;
    language: "zh-CN" | "en";
    timezone: string;
    userId: string;
    now: Date;
    extractedTextOverride?: string | null;
  }): Promise<{ text: string | null; result: ExtractionResult }> {
    let text: string | null = input.extractedTextOverride ?? null;
    if (
      input.extractedTextOverride === undefined &&
      (input.resource.mimeType === "text/plain" ||
        input.resource.mimeType === "text/calendar")
    ) {
      text = new TextDecoder("utf-8", { fatal: true }).decode(input.bytes);
    } else if (
      input.extractedTextOverride === undefined &&
      input.resource.mimeType === "application/pdf"
    ) {
      const { extractText, getDocumentProxy } = await import("unpdf");
      const pdf = await getDocumentProxy(input.bytes);
      try {
        if (pdf.numPages > 250) {
          throw new ApiError(
            "PDF_PAGE_LIMIT_EXCEEDED",
            422,
            "PDF files may contain at most 250 pages.",
          );
        }
        const extracted = await extractText(pdf, { mergePages: true });
        text = String(extracted.text).slice(0, 200_000);
      } finally {
        await (
          pdf as unknown as { destroy?: () => Promise<void> }
        ).destroy?.();
      }
    }

    if (input.resource.mimeType === "text/calendar" && text) {
      const parsed = parseIcs(text, input.timezone);
      return {
        text: text.slice(0, 200_000),
        result: {
          modelKey: "local-ics-parser-v1",
          tokenInput: 0,
          tokenOutput: 0,
          estimatedCostMinorUsd: 0,
          institutionName: null,
          courseCode: null,
          courseName: null,
          ...parsed,
        },
      };
    }
    const local = extractLocalCourseData(text ?? "");
    const startedAt = Date.now();
    try {
      const ai = await this.provider.extractCourseData({
        language: input.language,
        resourceType: input.resource.resourceType,
        text: text?.slice(0, 60_000) ?? null,
        imageDataUrl: input.resource.mimeType.startsWith("image/")
          ? imageDataUrl(input.resource.mimeType, input.bytes)
          : null,
      });
      await this.aiRepository.recordUsage({
        id: createId("aiusage"),
        userId: input.userId,
        feature: "resource_extraction",
        modelKey: ai.modelKey,
        tokenInput: ai.tokenInput,
        tokenOutput: ai.tokenOutput,
        latencyMs: Math.max(0, Date.now() - startedAt),
        success: true,
        errorCode: null,
        estimatedCostMinorUsd: ai.estimatedCostMinorUsd,
        now: input.now.toISOString(),
      });
      return {
        text: text?.slice(0, 200_000) ?? null,
        result: mergeExtractions(local, ai),
      };
    } catch (error) {
      await this.aiRepository.recordUsage({
        id: createId("aiusage"),
        userId: input.userId,
        feature: "resource_extraction",
        modelKey: "unavailable",
        tokenInput: 0,
        tokenOutput: 0,
        latencyMs: Math.max(0, Date.now() - startedAt),
        success: false,
        errorCode: failureCode(error),
        estimatedCostMinorUsd: 0,
        now: input.now.toISOString(),
      });
      if (text !== null) {
        return { text: text.slice(0, 200_000), result: local };
      }
      throw error;
    }
  }

  async confirm(input: {
    userId: string;
    resourceId: string;
    timezone: string;
    assessmentIndexes: number[];
    classSessionIndexes: number[];
    topicIndexes: number[];
    now?: Date;
  }): Promise<{
    assessmentCount: number;
    classSessionCount: number;
    topicCount: number;
    skippedDuplicateCount: number;
  }> {
    const resource = await this.detail(input.userId, input.resourceId);
    if (!resource.courseId || !resource.proposedDataJson) {
      throw new ApiError(
        "RESOURCE_PROPOSAL_NOT_READY",
        409,
        "This resource has no proposal ready for confirmation.",
      );
    }
    let proposal: ResourceProposal;
    try {
      proposal = JSON.parse(resource.proposedDataJson) as ResourceProposal;
    } catch {
      throw new ApiError(
        "RESOURCE_PROPOSAL_INVALID",
        500,
        "The saved extraction proposal is invalid.",
      );
    }
    const select = <T>(items: T[], indexes: number[]): T[] =>
      [...new Set(indexes)].map((index) => {
        const item = items[index];
        if (!item) {
          throw new ApiError(
            "RESOURCE_SELECTION_INVALID",
            400,
            "One or more selected import items no longer exist.",
          );
        }
        return item;
      });
    const selectedAssessments = select(
      proposal.assessments ?? [],
      input.assessmentIndexes,
    );
    const selectedSessions = select(
      proposal.classSessions ?? [],
      input.classSessionIndexes,
    );
    const selectedTopics = select(
      proposal.topics ?? [],
      input.topicIndexes,
    );
    const now = input.now ?? new Date();
    const claimed = await this.repository.claimConfirmation(
      input.userId,
      input.resourceId,
      now.toISOString(),
    );
    if (!claimed) {
      throw new ApiError(
        "RESOURCE_ALREADY_CONFIRMED",
        409,
        "This resource has already been confirmed or is being processed.",
      );
    }
    try {
      const applied = await this.repository.applyConfirmation({
        userId: input.userId,
        resourceId: input.resourceId,
        courseId: resource.courseId,
        assessments: selectedAssessments.map((assessment) => ({
          ...assessment,
          id: createId("assessment"),
          dueAt: assessment.dueLocal
            ? zonedDateTimeToUtc(
                assessment.dueLocal,
                input.timezone,
              ).toISOString()
            : null,
        })),
        classSessions: selectedSessions.map((session) => ({
          ...session,
          id: createId("class"),
        })),
        topics: selectedTopics.map((title, index) => ({
          id: createId("topic"),
          title,
          sequenceNumber: index,
        })),
        now: now.toISOString(),
      });
      return applied;
    } catch (error) {
      await this.repository.releaseConfirmation(
        input.userId,
        input.resourceId,
        now.toISOString(),
      );
      throw error;
    }
  }

  async download(
    userId: string,
    resourceId: string,
  ): Promise<{ resource: ResourceRecord; bytes: Uint8Array }> {
    const resource = await this.detail(userId, resourceId);
    const bytes = await this.storage.get(resource.storageKey);
    if (!bytes) {
      throw new ApiError(
        "RESOURCE_FILE_MISSING",
        410,
        "The stored file is no longer available.",
      );
    }
    return { resource, bytes };
  }

  async delete(input: {
    userId: string;
    actorUserId: string;
    resourceId: string;
    now?: Date;
  }): Promise<{ physicallyDeleted: boolean }> {
    const now = input.now ?? new Date();
    const versionObjects = this.ingestion
      ? await this.ingestion.storageKeysForLegacy({
          userId: input.userId,
          legacyResourceId: input.resourceId,
        })
      : [];
    const storageKey = await this.repository.markDeleted({
      userId: input.userId,
      resourceId: input.resourceId,
      actorUserId: input.actorUserId,
      auditId: createId("audit"),
      now: now.toISOString(),
    });
    if (!storageKey) {
      throw new ApiError(
        "RESOURCE_NOT_FOUND",
        404,
        "The learning resource was not found.",
      );
    }
    if (this.ingestion) {
      await this.ingestion.tombstoneLegacy({
        userId: input.userId,
        legacyResourceId: input.resourceId,
        now: now.toISOString(),
      });
    }
    let physicallyDeleted = true;
    const deletedKeys = new Set<string>();
    for (const object of versionObjects) {
      try {
        if (!deletedKeys.has(object.storageKey)) {
          await this.storage.delete(object.storageKey);
          deletedKeys.add(object.storageKey);
        }
        await this.ingestion?.markVersionPhysicallyDeleted(
          object.versionId,
          now.toISOString(),
        );
      } catch {
        physicallyDeleted = false;
      }
    }
    try {
      if (!deletedKeys.has(storageKey)) await this.storage.delete(storageKey);
      await this.repository.markPhysicallyDeleted(
        input.resourceId,
        now.toISOString(),
      );
    } catch {
      physicallyDeleted = false;
    }
    return { physicallyDeleted };
  }

  async cleanupDeleted(now = new Date()): Promise<number> {
    const pending = await this.repository.pendingPhysicalDeletion();
    let removed = 0;
    for (const resource of pending) {
      try {
        await this.storage.delete(resource.storageKey);
        await this.repository.markPhysicallyDeleted(
          resource.id,
          now.toISOString(),
        );
        removed += 1;
      } catch {
        // A later scheduled run retries this object.
      }
    }
    if (this.ingestion) {
      const versionObjects = await this.ingestion.pendingStorageDeletion();
      for (const object of versionObjects) {
        try {
          await this.storage.delete(object.storageKey);
          await this.ingestion.markVersionPhysicallyDeleted(
            object.versionId,
            now.toISOString(),
          );
          removed += 1;
        } catch {
          // A later scheduled run retries this object.
        }
      }
    }
    return removed;
  }
}
