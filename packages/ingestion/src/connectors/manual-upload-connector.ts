import type {
  AnnouncementData,
  AssignmentData,
  CalendarEventData,
  ConnectionResult,
  CourseSummary,
  CourseSyncResult,
  LMSConnector,
  ModuleData,
  ResourceDescriptor,
  ResourceFile,
  ConnectorId,
} from "@deepstudy/shared-types";

export interface ManualUploadConnectorData {
  displayName?: string;
  courses?: CourseSummary[];
  assignments?: AssignmentData[];
  modules?: ModuleData[];
  announcements?: AnnouncementData[];
  calendarEvents?: CalendarEventData[];
  resources?: ResourceFile[];
}

export class ManualUploadConnector implements LMSConnector {
  readonly id: ConnectorId = "manual-upload";
  protected readonly data: Required<ManualUploadConnectorData>;

  constructor(data: ManualUploadConnectorData = {}) {
    this.data = {
      displayName: data.displayName ?? "Manual upload",
      courses: data.courses ?? [],
      assignments: data.assignments ?? [],
      modules: data.modules ?? [],
      announcements: data.announcements ?? [],
      calendarEvents: data.calendarEvents ?? [],
      resources: data.resources ?? [],
    };
  }

  async connect(): Promise<ConnectionResult> {
    return {
      connectorId: this.id,
      status: "connected",
      displayName: this.data.displayName,
      readOnly: true,
      connectedAt: new Date().toISOString(),
      message: null,
    };
  }

  async listCourses(): Promise<CourseSummary[]> {
    return structuredClone(this.data.courses);
  }

  async listAssignments(courseId: string): Promise<AssignmentData[]> {
    return structuredClone(
      this.data.assignments.filter((item) => item.courseId === courseId),
    );
  }

  async listModules(courseId: string): Promise<ModuleData[]> {
    return structuredClone(
      this.data.modules.filter((item) => item.courseId === courseId),
    );
  }

  async listAnnouncements(courseId: string): Promise<AnnouncementData[]> {
    return structuredClone(
      this.data.announcements.filter((item) => item.courseId === courseId),
    );
  }

  async listCalendarEvents(courseId: string): Promise<CalendarEventData[]> {
    return structuredClone(
      this.data.calendarEvents.filter((item) => item.courseId === courseId),
    );
  }

  async listResources(courseId: string): Promise<ResourceDescriptor[]> {
    return this.data.resources
      .filter((item) => item.courseId === courseId)
      .map((item) => ({
        id: item.id,
        courseId: item.courseId,
        fileName: item.fileName,
        displayName: item.fileName,
        mimeType: item.mimeType,
        sizeBytes: item.bytes.byteLength,
        sourceUrl: item.sourceUrl,
        updatedAt: item.updatedAt,
        status: "active" as const,
      }));
  }

  async downloadResource(resourceId: string): Promise<ResourceFile> {
    const file = this.data.resources.find((item) => item.id === resourceId);
    if (!file) throw new Error(`Manual resource ${resourceId} was not found.`);
    return { ...file, bytes: file.bytes.slice() };
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
    return {
      connectorId: this.id,
      courseId,
      assignments,
      modules,
      announcements,
      calendarEvents,
      resources,
      syncedAt: new Date().toISOString(),
    };
  }
}
