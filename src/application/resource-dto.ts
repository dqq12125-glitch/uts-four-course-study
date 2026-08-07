import type { ResourceRecord } from "../repositories/resource-repository.ts";

export function resourceDto(
  resource: ResourceRecord,
  includeProposal = false,
): {
  id: string;
  courseId: string | null;
  courseName: string | null;
  fileName: string;
  mimeType: string;
  fileSize: number;
  resourceType: string;
  processingStatus: string;
  retentionUntil: string | null;
  createdAt: string;
  failureCode: string | null;
  ingestion: ResourceRecord["ingestion"];
  proposal?: unknown;
} {
  let proposal: unknown;
  if (includeProposal && resource.proposedDataJson) {
    try {
      proposal = JSON.parse(resource.proposedDataJson);
    } catch {
      proposal = null;
    }
  }
  return {
    id: resource.id,
    courseId: resource.courseId,
    courseName: resource.courseName,
    fileName: resource.fileName,
    mimeType: resource.mimeType,
    fileSize: resource.fileSize,
    resourceType: resource.resourceType,
    processingStatus: resource.processingStatus,
    retentionUntil: resource.retentionUntil,
    createdAt: resource.createdAt,
    failureCode: resource.failureCode,
    ingestion: resource.ingestion ?? null,
    ...(includeProposal ? { proposal } : {}),
  };
}
