import { z } from "zod";
import { entityIdSchema } from "./ids.ts";

export const connectorIdSchema = z.enum(["mock", "manual-upload", "canvas"]);
export type ConnectorId = z.infer<typeof connectorIdSchema>;

export const connectionResultSchema = z.object({
  connectorId: connectorIdSchema,
  status: z.enum(["connected", "disconnected", "error"]),
  displayName: z.string().trim().min(1).max(240),
  readOnly: z.literal(true),
  connectedAt: z.iso.datetime().nullable(),
  message: z.string().max(2_000).nullable(),
});

export const courseSummarySchema = z.object({
  id: z.string().trim().min(1).max(240),
  name: z.string().trim().min(1).max(500),
  code: z.string().max(120).nullable(),
  startAt: z.iso.datetime().nullable(),
  endAt: z.iso.datetime().nullable(),
  sourceUrl: z.url().nullable(),
  updatedAt: z.iso.datetime().nullable(),
});

export const assignmentDataSchema = z.object({
  id: z.string().trim().min(1).max(240),
  courseId: z.string().trim().min(1).max(240),
  title: z.string().trim().min(1).max(500),
  description: z.string().max(100_000).nullable(),
  dueAt: z.iso.datetime().nullable(),
  pointsPossible: z.number().nonnegative().nullable(),
  submissionTypes: z.array(z.string().max(120)).max(30),
  sourceUrl: z.url().nullable(),
  updatedAt: z.iso.datetime().nullable(),
});

export const moduleDataSchema = z.object({
  id: z.string().trim().min(1).max(240),
  courseId: z.string().trim().min(1).max(240),
  title: z.string().trim().min(1).max(500),
  position: z.number().int().nonnegative(),
  state: z.string().max(120).nullable(),
  items: z.array(
    z.object({
      id: z.string().trim().min(1).max(240),
      title: z.string().trim().min(1).max(500),
      type: z.string().trim().min(1).max(120),
      contentId: z.string().max(240).nullable(),
      sourceUrl: z.url().nullable(),
      position: z.number().int().nonnegative(),
    }),
  ),
  updatedAt: z.iso.datetime().nullable(),
});

export const announcementDataSchema = z.object({
  id: z.string().trim().min(1).max(240),
  courseId: z.string().trim().min(1).max(240),
  title: z.string().trim().min(1).max(500),
  message: z.string().max(100_000).nullable(),
  postedAt: z.iso.datetime().nullable(),
  sourceUrl: z.url().nullable(),
  updatedAt: z.iso.datetime().nullable(),
});

export const calendarEventDataSchema = z.object({
  id: z.string().trim().min(1).max(240),
  courseId: z.string().trim().min(1).max(240),
  title: z.string().trim().min(1).max(500),
  description: z.string().max(100_000).nullable(),
  startAt: z.iso.datetime().nullable(),
  endAt: z.iso.datetime().nullable(),
  location: z.string().max(500).nullable(),
  sourceUrl: z.url().nullable(),
  updatedAt: z.iso.datetime().nullable(),
});

export const resourceDescriptorSchema = z.object({
  id: z.string().trim().min(1).max(240),
  courseId: z.string().trim().min(1).max(240),
  fileName: z.string().trim().min(1).max(500),
  displayName: z.string().trim().min(1).max(500),
  mimeType: z.string().trim().min(1).max(240),
  sizeBytes: z.number().int().nonnegative().nullable(),
  sourceUrl: z.url().nullable(),
  updatedAt: z.iso.datetime().nullable(),
  status: z.enum(["active", "unavailable"]),
});

export const courseSyncResultSchema = z.object({
  connectorId: connectorIdSchema,
  courseId: z.string().trim().min(1).max(240),
  assignments: z.array(assignmentDataSchema),
  modules: z.array(moduleDataSchema),
  announcements: z.array(announcementDataSchema),
  calendarEvents: z.array(calendarEventDataSchema),
  resources: z.array(resourceDescriptorSchema),
  syncedAt: z.iso.datetime(),
});

export interface ResourceFile {
  id: string;
  courseId: string;
  fileName: string;
  mimeType: string;
  bytes: Uint8Array;
  sourceUrl: string | null;
  updatedAt: string | null;
}

export interface LMSConnector {
  readonly id: ConnectorId;
  connect(): Promise<ConnectionResult>;
  listCourses(): Promise<CourseSummary[]>;
  syncCourse(courseId: string): Promise<CourseSyncResult>;
  listAssignments(courseId: string): Promise<AssignmentData[]>;
  listModules(courseId: string): Promise<ModuleData[]>;
  listAnnouncements(courseId: string): Promise<AnnouncementData[]>;
  listCalendarEvents(courseId: string): Promise<CalendarEventData[]>;
  listResources(courseId: string): Promise<ResourceDescriptor[]>;
  downloadResource(resourceId: string): Promise<ResourceFile>;
}

export const resourcePipelineStatusSchema = z.enum([
  "pending",
  "processing",
  "completed",
  "failed",
  "tombstoned",
]);

export const resourceQualityStatusSchema = z.enum([
  "pending",
  "passed",
  "warning",
  "failed",
]);

export const resourceIngestionStatusSchema = z.object({
  sourceType: z.string().trim().min(1).max(120),
  sourceId: z.string().max(500).nullable(),
  sourceUrl: z.url().nullable(),
  versionId: entityIdSchema.nullable(),
  versionNumber: z.number().int().positive().nullable(),
  fileHash: z.string().regex(/^[a-f0-9]{64}$/).nullable(),
  contentHash: z.string().regex(/^[a-f0-9]{64}$/).nullable(),
  parserVersion: z.string().max(120).nullable(),
  embeddingVersion: z.string().max(120).nullable(),
  pipelineStatus: resourcePipelineStatusSchema.nullable(),
  jobStatus: resourcePipelineStatusSchema.nullable(),
  jobAttempts: z.number().int().nonnegative(),
  chunkCount: z.number().int().nonnegative(),
  embeddedChunkCount: z.number().int().nonnegative(),
  reusedChunkCount: z.number().int().nonnegative(),
  qualityStatus: resourceQualityStatusSchema.nullable(),
  qualityIssues: z.array(z.string().max(500)),
  lastSyncedAt: z.iso.datetime().nullable(),
});

export type ConnectionResult = z.infer<typeof connectionResultSchema>;
export type CourseSummary = z.infer<typeof courseSummarySchema>;
export type AssignmentData = z.infer<typeof assignmentDataSchema>;
export type ModuleData = z.infer<typeof moduleDataSchema>;
export type AnnouncementData = z.infer<typeof announcementDataSchema>;
export type CalendarEventData = z.infer<typeof calendarEventDataSchema>;
export type ResourceDescriptor = z.infer<typeof resourceDescriptorSchema>;
export type CourseSyncResult = z.infer<typeof courseSyncResultSchema>;
export type ResourcePipelineStatus = z.infer<
  typeof resourcePipelineStatusSchema
>;
export type ResourceIngestionStatus = z.infer<
  typeof resourceIngestionStatusSchema
>;
