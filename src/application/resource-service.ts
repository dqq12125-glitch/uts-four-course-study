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

  constructor(
    repository: ResourceRepository,
    aiRepository: AiRepository,
    storage: PrivateObjectStorage,
    provider: AiProvider,
    entitlements: EntitlementService,
    flags: FeatureFlagService,
  ) {
    this.repository = repository;
    this.aiRepository = aiRepository;
    this.storage = storage;
    this.provider = provider;
    this.entitlements = entitlements;
    this.flags = flags;
  }

  async list(userId: string): Promise<ResourceRecord[]> {
    return this.repository.list(userId);
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
    return resource;
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
    const now = input.now ?? new Date();
    const resourceId = createId("resource");
    const storageKey = `users/${input.userId}/${resourceId}/${validated.fileName}`;
    await this.storage.put(
      storageKey,
      input.bytes,
      validated.mimeType,
    );
    const created = await this.repository.create({
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
    if (!created) {
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
    await this.process({ ...input, bytes, now: input.now ?? new Date() });
    return this.detail(input.userId, input.resourceId);
  }

  private async process(input: {
    userId: string;
    resourceId: string;
    language: "zh-CN" | "en";
    timezone: string;
    bytes: Uint8Array;
    now: Date;
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
    try {
      const extracted = await this.extract({
        resource,
        bytes: input.bytes,
        language: input.language,
        timezone: input.timezone,
        userId: input.userId,
        now: input.now,
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
  }): Promise<{ text: string | null; result: ExtractionResult }> {
    let text: string | null = null;
    if (
      input.resource.mimeType === "text/plain" ||
      input.resource.mimeType === "text/calendar"
    ) {
      text = new TextDecoder("utf-8", { fatal: true }).decode(input.bytes);
    } else if (input.resource.mimeType === "application/pdf") {
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
    try {
      await this.storage.delete(storageKey);
      await this.repository.markPhysicallyDeleted(
        input.resourceId,
        now.toISOString(),
      );
      return { physicallyDeleted: true };
    } catch {
      return { physicallyDeleted: false };
    }
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
    return removed;
  }
}
