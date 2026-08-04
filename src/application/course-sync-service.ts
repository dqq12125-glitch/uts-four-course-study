import type { LMSConnector } from "@deepstudy/shared-types";
import { ApiError } from "../lib/api-errors.ts";
import { createId } from "../lib/ids.ts";
import type {
  ConnectorSyncRepository,
  CourseConnectorRecord,
  SyncRunCounts,
} from "../repositories/connector-sync-repository.ts";
import type { ResourceService } from "./resource-service.ts";

export type ConnectorFactory = (
  connection: CourseConnectorRecord,
) => Promise<LMSConnector>;

function stableErrorCode(error: unknown): string {
  if (error instanceof ApiError) return error.code;
  if (
    error &&
    typeof error === "object" &&
    "code" in error &&
    typeof error.code === "string"
  ) {
    return error.code.slice(0, 120);
  }
  return "COURSE_SYNC_FAILED";
}

export class CourseSyncService {
  private readonly repository: ConnectorSyncRepository;
  private readonly connectorFactory: ConnectorFactory;
  private readonly resources: ResourceService;

  constructor(
    repository: ConnectorSyncRepository,
    connectorFactory: ConnectorFactory,
    resources: ResourceService,
  ) {
    this.repository = repository;
    this.connectorFactory = connectorFactory;
    this.resources = resources;
  }

  async sync(input: {
    userId: string;
    role: "student" | "admin";
    courseId: string;
    language: "zh-CN" | "en";
    timezone: string;
    now?: Date;
  }): Promise<{
    runId: string;
    status: "completed" | "partial";
    counts: SyncRunCounts;
    sourceCounts: {
      assignments: number;
      modules: number;
      announcements: number;
      calendarEvents: number;
    };
    failures: Array<{ sourceId: string; errorCode: string }>;
  }> {
    const connection = await this.repository.findCourseConnection(
      input.userId,
      input.courseId,
    );
    if (!connection) {
      throw new ApiError(
        "LMS_CONNECTION_REQUIRED",
        409,
        "This course is not linked to an active LMS connection.",
      );
    }
    const now = input.now ?? new Date();
    const nowIso = now.toISOString();
    const runId = createId("sync");
    await this.repository.startRun({
      id: runId,
      userId: input.userId,
      courseId: input.courseId,
      connectionId: connection.connectionId,
      connectorId: connection.connectorId,
      sourceCourseId: connection.sourceCourseId,
      now: nowIso,
    });
    try {
      const connector = await this.connectorFactory(connection);
      if (connector.id !== connection.connectorId) {
        throw new ApiError(
          "CONNECTOR_CONFIGURATION_INVALID",
          500,
          "The configured connector does not match the course link.",
        );
      }
      const snapshot = await connector.syncCourse(connection.sourceCourseId);
      if (snapshot.resources.length > 500) {
        throw new ApiError(
          "SYNC_RESOURCE_LIMIT_EXCEEDED",
          422,
          "A single course sync may contain at most 500 resources.",
        );
      }
      const counts: SyncRunCounts = {
        discoveredCount: snapshot.resources.length,
        createdCount: 0,
        updatedCount: 0,
        skippedCount: 0,
        tombstonedCount: 0,
        failedCount: 0,
      };
      const failures: Array<{ sourceId: string; errorCode: string }> = [];
      const seenSourceIds = new Set<string>();
      for (const descriptor of snapshot.resources) {
        seenSourceIds.add(descriptor.id);
        if (descriptor.status !== "active") {
          counts.skippedCount += 1;
          continue;
        }
        try {
          const needsDownload = await this.resources.sourceNeedsDownload({
            userId: input.userId,
            courseId: input.courseId,
            sourceType: connection.connectorId,
            sourceId: descriptor.id,
            sourceUrl: descriptor.sourceUrl,
            sourceUpdatedAt: descriptor.updatedAt,
            now,
          });
          if (!needsDownload) {
            counts.skippedCount += 1;
            continue;
          }
          const file = await connector.downloadResource(descriptor.id);
          const result = await this.resources.syncResource({
            userId: input.userId,
            role: input.role,
            courseId: input.courseId,
            connectionId: connection.connectionId,
            sourceType: connection.connectorId,
            sourceId: descriptor.id,
            sourceUrl: descriptor.sourceUrl ?? file.sourceUrl,
            sourceUpdatedAt: descriptor.updatedAt ?? file.updatedAt,
            file: { ...file, courseId: connection.sourceCourseId },
            language: input.language,
            timezone: input.timezone,
            now,
          });
          if (result.action === "created") counts.createdCount += 1;
          else if (result.action === "updated") counts.updatedCount += 1;
          else counts.skippedCount += 1;
        } catch (error) {
          counts.failedCount += 1;
          failures.push({
            sourceId: descriptor.id,
            errorCode: stableErrorCode(error),
          });
        }
      }
      counts.tombstonedCount = await this.resources.tombstoneMissingSources({
        userId: input.userId,
        courseId: input.courseId,
        connectionId: connection.connectionId,
        sourceType: connection.connectorId,
        seenSourceIds,
        now: nowIso,
      });
      const status = counts.failedCount > 0 ? "partial" : "completed";
      const sourceCounts = {
        assignments: snapshot.assignments.length,
        modules: snapshot.modules.length,
        announcements: snapshot.announcements.length,
        calendarEvents: snapshot.calendarEvents.length,
      };
      await this.repository.completeRun({
        id: runId,
        userId: input.userId,
        connectionId: connection.connectionId,
        status,
        counts,
        details: { sourceCounts, failures },
        now: nowIso,
      });
      return { runId, status, counts, sourceCounts, failures };
    } catch (error) {
      await this.repository.failRun({
        id: runId,
        userId: input.userId,
        errorCode: stableErrorCode(error),
        now: nowIso,
      });
      throw error;
    }
  }
}
