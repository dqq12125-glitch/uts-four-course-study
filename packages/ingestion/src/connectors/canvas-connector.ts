import { z } from "zod";
import {
  announcementDataSchema,
  assignmentDataSchema,
  calendarEventDataSchema,
  courseSummarySchema,
  courseSyncResultSchema,
  moduleDataSchema,
  resourceDescriptorSchema,
  type AnnouncementData,
  type AssignmentData,
  type CalendarEventData,
  type ConnectionResult,
  type CourseSummary,
  type CourseSyncResult,
  type LMSConnector,
  type ModuleData,
  type ResourceDescriptor,
  type ResourceFile,
} from "@deepstudy/shared-types";
import { IngestionError } from "../errors.ts";

const nullableDate = z.string().nullable().optional();
const canvasCourseSchema = z.object({
  id: z.union([z.string(), z.number()]),
  name: z.string(),
  course_code: z.string().nullable().optional(),
  start_at: nullableDate,
  end_at: nullableDate,
  updated_at: nullableDate,
  html_url: z.string().nullable().optional(),
});
const canvasAssignmentSchema = z.object({
  id: z.union([z.string(), z.number()]),
  name: z.string(),
  description: z.string().nullable().optional(),
  due_at: nullableDate,
  points_possible: z.number().nullable().optional(),
  submission_types: z.array(z.string()).optional(),
  html_url: z.string().nullable().optional(),
  updated_at: nullableDate,
});
const canvasModuleItemSchema = z.object({
  id: z.union([z.string(), z.number()]),
  title: z.string(),
  type: z.string(),
  content_id: z.union([z.string(), z.number()]).nullable().optional(),
  html_url: z.string().nullable().optional(),
  position: z.number().int().optional(),
});
const canvasModuleSchema = z.object({
  id: z.union([z.string(), z.number()]),
  name: z.string(),
  position: z.number().int().optional(),
  workflow_state: z.string().nullable().optional(),
  updated_at: nullableDate,
  items: z.array(canvasModuleItemSchema).optional(),
});
const canvasAnnouncementSchema = z.object({
  id: z.union([z.string(), z.number()]),
  title: z.string(),
  message: z.string().nullable().optional(),
  posted_at: nullableDate,
  html_url: z.string().nullable().optional(),
  updated_at: nullableDate,
});
const canvasCalendarSchema = z.object({
  id: z.union([z.string(), z.number()]),
  title: z.string(),
  description: z.string().nullable().optional(),
  start_at: nullableDate,
  end_at: nullableDate,
  location_name: z.string().nullable().optional(),
  html_url: z.string().nullable().optional(),
  updated_at: nullableDate,
});
const canvasFileSchema = z.object({
  id: z.union([z.string(), z.number()]),
  display_name: z.string(),
  filename: z.string().optional(),
  "content-type": z.string(),
  size: z.number().int().nonnegative().nullable().optional(),
  url: z.string(),
  updated_at: nullableDate,
  modified_at: nullableDate,
  locked_for_user: z.boolean().optional(),
  hidden_for_user: z.boolean().optional(),
});
const profileSchema = z.object({
  id: z.union([z.string(), z.number()]),
  name: z.string().optional(),
  primary_email: z.string().optional(),
});

function optionalIso(value: string | null | undefined): string | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function optionalUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    return new URL(value).toString();
  } catch {
    return null;
  }
}

function nextLink(header: string | null): string | null {
  if (!header) return null;
  for (const part of header.split(",")) {
    const match = part.match(/<([^>]+)>\s*;\s*rel="?next"?/i);
    if (match?.[1]) return match[1];
  }
  return null;
}

export interface CanvasConnectorConfiguration {
  baseUrl: string;
  accessToken: string;
  fetcher?: typeof fetch;
  now?: () => Date;
}

export class CanvasConnector implements LMSConnector {
  readonly id = "canvas" as const;
  private readonly baseUrl: string;
  private readonly accessToken: string;
  private readonly fetcher: typeof fetch;
  private readonly now: () => Date;
  private readonly files = new Map<
    string,
    { metadata: z.infer<typeof canvasFileSchema>; courseId: string }
  >();

  constructor(configuration: CanvasConnectorConfiguration) {
    const baseUrl = new URL(configuration.baseUrl);
    if (
      baseUrl.protocol !== "https:" &&
      !["localhost", "127.0.0.1"].includes(baseUrl.hostname)
    ) {
      throw new Error("Canvas base URL must use HTTPS.");
    }
    if (!configuration.accessToken.trim()) {
      throw new Error("Canvas access token is required.");
    }
    this.baseUrl = baseUrl.toString().replace(/\/$/, "");
    this.accessToken = configuration.accessToken;
    this.fetcher = configuration.fetcher ?? fetch;
    this.now = configuration.now ?? (() => new Date());
  }

  async connect(): Promise<ConnectionResult> {
    const profile = profileSchema.parse(
      await this.requestJson("/api/v1/users/self/profile"),
    );
    return {
      connectorId: this.id,
      status: "connected",
      displayName: profile.name ?? profile.primary_email ?? "Canvas",
      readOnly: true,
      connectedAt: this.now().toISOString(),
      message: null,
    };
  }

  async listCourses(): Promise<CourseSummary[]> {
    const rows = await this.paginated(
      "/api/v1/courses?enrollment_type=student&per_page=100",
      canvasCourseSchema,
    );
    return rows.map((row) =>
      courseSummarySchema.parse({
        id: String(row.id),
        name: row.name,
        code: row.course_code ?? null,
        startAt: optionalIso(row.start_at),
        endAt: optionalIso(row.end_at),
        sourceUrl: optionalUrl(row.html_url),
        updatedAt: optionalIso(row.updated_at),
      }),
    );
  }

  async listAssignments(courseId: string): Promise<AssignmentData[]> {
    const rows = await this.paginated(
      `/api/v1/courses/${encodeURIComponent(courseId)}/assignments?per_page=100`,
      canvasAssignmentSchema,
    );
    return rows.map((row) =>
      assignmentDataSchema.parse({
        id: String(row.id),
        courseId,
        title: row.name,
        description: row.description ?? null,
        dueAt: optionalIso(row.due_at),
        pointsPossible: row.points_possible ?? null,
        submissionTypes: row.submission_types ?? [],
        sourceUrl: optionalUrl(row.html_url),
        updatedAt: optionalIso(row.updated_at),
      }),
    );
  }

  async listModules(courseId: string): Promise<ModuleData[]> {
    const rows = await this.paginated(
      `/api/v1/courses/${encodeURIComponent(courseId)}/modules?include%5B%5D=items&include%5B%5D=content_details&per_page=100`,
      canvasModuleSchema,
    );
    return rows.map((row) =>
      moduleDataSchema.parse({
        id: String(row.id),
        courseId,
        title: row.name,
        position: Math.max(0, row.position ?? 0),
        state: row.workflow_state ?? null,
        items: (row.items ?? []).map((item) => ({
          id: String(item.id),
          title: item.title,
          type: item.type,
          contentId:
            item.content_id === null || item.content_id === undefined
              ? null
              : String(item.content_id),
          sourceUrl: optionalUrl(item.html_url),
          position: Math.max(0, item.position ?? 0),
        })),
        updatedAt: optionalIso(row.updated_at),
      }),
    );
  }

  async listAnnouncements(courseId: string): Promise<AnnouncementData[]> {
    const query = new URLSearchParams({
      "context_codes[]": `course_${courseId}`,
      active_only: "true",
      per_page: "100",
    });
    const rows = await this.paginated(
      `/api/v1/announcements?${query.toString()}`,
      canvasAnnouncementSchema,
    );
    return rows.map((row) =>
      announcementDataSchema.parse({
        id: String(row.id),
        courseId,
        title: row.title,
        message: row.message ?? null,
        postedAt: optionalIso(row.posted_at),
        sourceUrl: optionalUrl(row.html_url),
        updatedAt: optionalIso(row.updated_at),
      }),
    );
  }

  async listCalendarEvents(courseId: string): Promise<CalendarEventData[]> {
    const query = new URLSearchParams({
      "context_codes[]": `course_${courseId}`,
      all_events: "true",
      per_page: "100",
    });
    const rows = await this.paginated(
      `/api/v1/calendar_events?${query.toString()}`,
      canvasCalendarSchema,
    );
    return rows.map((row) =>
      calendarEventDataSchema.parse({
        id: String(row.id),
        courseId,
        title: row.title,
        description: row.description ?? null,
        startAt: optionalIso(row.start_at),
        endAt: optionalIso(row.end_at),
        location: row.location_name ?? null,
        sourceUrl: optionalUrl(row.html_url),
        updatedAt: optionalIso(row.updated_at),
      }),
    );
  }

  async listResources(courseId: string): Promise<ResourceDescriptor[]> {
    const rows = await this.paginated(
      `/api/v1/courses/${encodeURIComponent(courseId)}/files?per_page=100`,
      canvasFileSchema,
    );
    for (const row of rows) {
      this.files.set(String(row.id), { metadata: row, courseId });
    }
    return rows.map((row) =>
      resourceDescriptorSchema.parse({
        id: String(row.id),
        courseId,
        fileName: row.filename ?? row.display_name,
        displayName: row.display_name,
        mimeType: row["content-type"],
        sizeBytes: row.size ?? null,
        sourceUrl: optionalUrl(row.url),
        updatedAt: optionalIso(row.modified_at ?? row.updated_at),
        status:
          row.locked_for_user || row.hidden_for_user
            ? "unavailable"
            : "active",
      }),
    );
  }

  async downloadResource(resourceId: string): Promise<ResourceFile> {
    let cached = this.files.get(resourceId);
    if (!cached) {
      const metadata = canvasFileSchema.parse(
        await this.requestJson(`/api/v1/files/${encodeURIComponent(resourceId)}`),
      );
      cached = { metadata, courseId: "unknown" };
      this.files.set(resourceId, cached);
    }
    const { metadata, courseId } = cached;
    const downloadUrl = new URL(metadata.url, this.baseUrl);
    const headers =
      downloadUrl.origin === new URL(this.baseUrl).origin
        ? { Authorization: `Bearer ${this.accessToken}` }
        : undefined;
    const response = await this.fetcher(downloadUrl.toString(), {
      method: "GET",
      headers,
      redirect: "follow",
    });
    if (!response.ok) {
      throw new IngestionError(
        "CANVAS_DOWNLOAD_FAILED",
        `Canvas resource download failed with status ${response.status}.`,
      );
    }
    return {
      id: String(metadata.id),
      courseId,
      fileName: metadata.filename ?? metadata.display_name,
      mimeType: metadata["content-type"],
      bytes: new Uint8Array(await response.arrayBuffer()),
      sourceUrl: optionalUrl(metadata.url),
      updatedAt: optionalIso(metadata.modified_at ?? metadata.updated_at),
    };
  }

  async syncCourse(courseId: string): Promise<CourseSyncResult> {
    const [assignments, modules, announcements, calendarEvents, resources] =
      await Promise.all([
        this.listAssignments(courseId),
        this.listModules(courseId),
        this.listAnnouncements(courseId),
        this.listCalendarEvents(courseId),
        this.listResources(courseId),
      ]);
    return courseSyncResultSchema.parse({
      connectorId: this.id,
      courseId,
      assignments,
      modules,
      announcements,
      calendarEvents,
      resources,
      syncedAt: this.now().toISOString(),
    });
  }

  private async requestJson(pathOrUrl: string): Promise<unknown> {
    const url = new URL(pathOrUrl, `${this.baseUrl}/`);
    if (url.origin !== new URL(this.baseUrl).origin) {
      throw new IngestionError(
        "CANVAS_PAGINATION_ORIGIN_INVALID",
        "Canvas pagination attempted to leave the configured origin.",
      );
    }
    const response = await this.fetcher(url.toString(), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        Accept: "application/json",
      },
    });
    if (!response.ok) {
      throw new IngestionError(
        "CANVAS_REQUEST_FAILED",
        `Canvas request failed with status ${response.status}.`,
      );
    }
    return response.json();
  }

  private async paginated<T>(
    path: string,
    itemSchema: z.ZodType<T>,
  ): Promise<T[]> {
    const output: T[] = [];
    let next: string | null = path;
    let pages = 0;
    while (next) {
      pages += 1;
      if (pages > 100) {
        throw new IngestionError(
          "CANVAS_PAGINATION_LIMIT",
          "Canvas returned more than 100 pages for one request.",
        );
      }
      const url = new URL(next, `${this.baseUrl}/`);
      if (url.origin !== new URL(this.baseUrl).origin) {
        throw new IngestionError(
          "CANVAS_PAGINATION_ORIGIN_INVALID",
          "Canvas pagination attempted to leave the configured origin.",
        );
      }
      const response = await this.fetcher(url.toString(), {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          Accept: "application/json",
        },
      });
      const payload: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        throw new IngestionError(
          "CANVAS_REQUEST_FAILED",
          `Canvas request failed with status ${response.status}.`,
        );
      }
      output.push(...z.array(itemSchema).parse(payload));
      next = nextLink(response.headers.get("link"));
    }
    return output;
  }
}
