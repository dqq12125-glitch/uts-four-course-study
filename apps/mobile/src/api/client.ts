import type {
  ApiErrorBody,
  AccountSettings,
  Assessment,
  BillingOverview,
  ClassSession,
  CompletedAttemptResponse,
  Course,
  LearningResource,
  Language,
  MasteryOverviewResponse,
  MobileExchangeResponse,
  NotificationPreferences,
  NotificationRecord,
  PlanResponse,
  PracticeAttemptResponse,
  PracticeOverviewResponse,
  SafePracticeSession,
  SessionResponse,
  Topic,
  TutorResponse,
  TodayResponse,
  WeeklyReport,
} from "./types";

export class DeepStudyApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly requestId: string | null;

  constructor(
    code: string,
    status: number,
    message: string,
    requestId: string | null = null,
  ) {
    super(message);
    this.name = "DeepStudyApiError";
    this.code = code;
    this.status = status;
    this.requestId = requestId;
  }
}

export function normalizeApiBaseUrl(value: string): string {
  const trimmed = value.trim().replace(/\/+$/, "");
  const parsed = new URL(trimmed);
  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("DeepStudy API URL must use HTTP or HTTPS.");
  }
  return parsed.toString().replace(/\/$/, "");
}

export function buildApiUrl(baseUrl: string, path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${normalizeApiBaseUrl(baseUrl)}${normalizedPath}`;
}

function isApiErrorBody(value: unknown): value is ApiErrorBody {
  if (!value || typeof value !== "object" || !("error" in value)) {
    return false;
  }
  const error = (value as { error?: unknown }).error;
  return Boolean(
    error &&
      typeof error === "object" &&
      typeof (error as { code?: unknown }).code === "string" &&
      typeof (error as { message?: unknown }).message === "string",
  );
}

export class DeepStudyApi {
  private readonly baseUrl: string;
  private sessionToken: string | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = normalizeApiBaseUrl(baseUrl);
  }

  setSessionToken(token: string | null): void {
    this.sessionToken = token;
  }

  async request<T>(
    path: string,
    init: RequestInit = {},
    authenticated = true,
  ): Promise<T> {
    const headers = new Headers(init.headers);
    headers.set("Accept", "application/json");
    if (
      init.body !== undefined &&
      !headers.has("Content-Type") &&
      !(init.body instanceof FormData)
    ) {
      headers.set("Content-Type", "application/json");
    }
    if (authenticated) {
      if (!this.sessionToken) {
        throw new DeepStudyApiError(
          "AUTHENTICATION_REQUIRED",
          401,
          "Please sign in to continue.",
        );
      }
      headers.set("Authorization", `Bearer ${this.sessionToken}`);
    }

    const response = await fetch(buildApiUrl(this.baseUrl, path), {
      ...init,
      headers,
    });
    const payload: unknown = await response.json().catch(() => null);
    if (!response.ok) {
      if (isApiErrorBody(payload)) {
        throw new DeepStudyApiError(
          payload.error.code,
          response.status,
          payload.error.message,
          payload.error.requestId ?? null,
        );
      }
      throw new DeepStudyApiError(
        "NETWORK_RESPONSE_INVALID",
        response.status,
        "DeepStudy returned an unreadable response.",
      );
    }
    return payload as T;
  }

  requestMagicLink(input: {
    email: string;
    intent: "sign-up" | "sign-in";
    language: Language;
  }): Promise<{ message: string; developmentPreviewUrl?: string }> {
    return this.request(
      "/api/auth/request-link",
      {
        method: "POST",
        body: JSON.stringify({ ...input, client: "mobile" }),
      },
      false,
    );
  }

  exchangeMagicToken(token: string): Promise<MobileExchangeResponse> {
    return this.request(
      "/api/auth/mobile/exchange",
      {
        method: "POST",
        body: JSON.stringify({ token }),
      },
      false,
    );
  }

  session(): Promise<SessionResponse> {
    return this.request("/api/auth/session");
  }

  signOut(): Promise<{ signedOut: boolean }> {
    return this.request("/api/auth/sign-out", { method: "POST" });
  }

  today(): Promise<TodayResponse> {
    return this.request("/api/today");
  }

  courses(): Promise<{ courses: Course[] }> {
    return this.request("/api/courses");
  }

  course(
    courseId: string,
  ): Promise<{ course: Course; assessments: Assessment[] }> {
    return this.request(`/api/courses/${courseId}`);
  }

  createCourse(input: {
    templateId: null;
    courseCode: string | null;
    courseName: string;
    colourKey: string;
    instructorName: string | null;
  }): Promise<{ courseId: string }> {
    return this.request("/api/courses", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  updateCourse(
    courseId: string,
    input: {
      courseCode: string | null;
      courseName: string;
      colourKey: string;
      instructorName: string | null;
    },
  ): Promise<{ updated: boolean }> {
    return this.request(`/api/courses/${courseId}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  }

  archiveCourse(courseId: string): Promise<{ archived: boolean }> {
    return this.request(`/api/courses/${courseId}`, {
      method: "DELETE",
    });
  }

  createAssessment(
    courseId: string,
    input: {
      title: string;
      assessmentType: string;
      dueAt: string | null;
      weightPercent: number | null;
      estimatedMinutes: number | null;
      notes: string | null;
    },
  ): Promise<{ assessmentId: string }> {
    return this.request(`/api/courses/${courseId}/assessments`, {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  updateAssessment(
    assessmentId: string,
    input: {
      title: string;
      assessmentType: string;
      dueAt: string | null;
      weightPercent: number | null;
      estimatedMinutes: number | null;
      notes: string | null;
      status: string;
    },
  ): Promise<{ updated: boolean }> {
    return this.request(`/api/assessments/${assessmentId}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  }

  deleteAssessment(assessmentId: string): Promise<{ deleted: boolean }> {
    return this.request(`/api/assessments/${assessmentId}`, {
      method: "DELETE",
    });
  }

  classSessions(
    courseId: string,
  ): Promise<{ classSessions: ClassSession[] }> {
    return this.request(`/api/courses/${courseId}/class-sessions`);
  }

  createClassSession(
    courseId: string,
    input: Omit<
      ClassSession,
      "id" | "courseId" | "courseCode" | "courseName"
    >,
  ): Promise<{ classSessionId: string }> {
    return this.request(`/api/courses/${courseId}/class-sessions`, {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  updateClassSession(
    classSessionId: string,
    input: Omit<
      ClassSession,
      "id" | "courseId" | "courseCode" | "courseName"
    >,
  ): Promise<{ updated: boolean }> {
    return this.request(`/api/class-sessions/${classSessionId}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  }

  deleteClassSession(
    classSessionId: string,
  ): Promise<{ deleted: boolean }> {
    return this.request(`/api/class-sessions/${classSessionId}`, {
      method: "DELETE",
    });
  }

  topics(courseId: string): Promise<{ topics: Topic[] }> {
    return this.request(`/api/courses/${courseId}/topics`);
  }

  createTopic(
    courseId: string,
    input: {
      title: string;
      description: string | null;
      weekNumber: number | null;
      sequenceNumber: number;
    },
  ): Promise<{ topicId: string }> {
    return this.request(`/api/courses/${courseId}/topics`, {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  updateTopic(
    topicId: string,
    input: {
      title: string;
      description: string | null;
      weekNumber: number | null;
      sequenceNumber: number;
    },
  ): Promise<{ updated: boolean }> {
    return this.request(`/api/topics/${topicId}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  }

  deleteTopic(topicId: string): Promise<{ deleted: boolean }> {
    return this.request(`/api/topics/${topicId}`, {
      method: "DELETE",
    });
  }

  plan(start: string, end: string): Promise<PlanResponse> {
    const query = new URLSearchParams({ start, end });
    return this.request(`/api/plan?${query.toString()}`);
  }

  rescheduleTask(
    taskId: string,
    scheduledFor: string,
  ): Promise<{ updated: boolean }> {
    return this.request(`/api/study-tasks/${taskId}/schedule`, {
      method: "PATCH",
      body: JSON.stringify({ scheduledFor }),
    });
  }

  reorderTasks(
    scheduledFor: string,
    taskIds: string[],
  ): Promise<{ updated: boolean }> {
    return this.request("/api/plan/reorder", {
      method: "PATCH",
      body: JSON.stringify({ scheduledFor, taskIds }),
    });
  }

  updateTaskStatus(
    taskId: string,
    status: "active" | "completed" | "skipped",
  ): Promise<{ updated: boolean }> {
    return this.request(`/api/study-tasks/${taskId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  }

  createStudyTask(input: {
    courseId: string | null;
    topicId: string | null;
    assessmentId: string | null;
    title: string;
    description: string | null;
    completionCriteria: string;
    taskType: string;
    priority: string;
    estimatedMinutes: number;
    scheduledFor: string;
    dueAt: string | null;
  }): Promise<{ taskId: string }> {
    return this.request("/api/study-tasks", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  tutor(input: {
    courseId: string;
    topicId?: string | null;
    currentTaskId?: string | null;
    conversationId?: string | null;
    message: string;
    studentAttempt?: string | null;
    resourceIds: string[];
    language: Language;
    suspectedAssessedWork: boolean;
  }): Promise<TutorResponse> {
    return this.request("/api/ai/tutor", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  generatePractice(input: {
    courseId: string;
    topicTitle: string;
    difficulty: number;
    resourceIds: string[];
    language: Language;
  }): Promise<{ questionId: string; topicId: string }> {
    return this.request("/api/ai/practice", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  resources(): Promise<{ resources: LearningResource[] }> {
    return this.request("/api/resources");
  }

  resource(resourceId: string): Promise<{ resource: LearningResource }> {
    return this.request(`/api/resources/${resourceId}`);
  }

  uploadResource(input: {
    courseId: string;
    resourceType: string;
    uri: string;
    fileName: string;
    mimeType: string;
  }): Promise<{ resource: LearningResource }> {
    const form = new FormData();
    form.append("courseId", input.courseId);
    form.append("resourceType", input.resourceType);
    form.append(
      "file",
      {
        uri: input.uri,
        name: input.fileName,
        type: input.mimeType,
      } as unknown as Blob,
    );
    return this.request("/api/resources", {
      method: "POST",
      body: form,
    });
  }

  uploadTextResource(input: {
    courseId: string;
    resourceType: string;
    text: string;
    fileName?: string;
  }): Promise<{ resource: LearningResource }> {
    return this.request("/api/resources", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  processResource(resourceId: string): Promise<{ resource: LearningResource }> {
    return this.request(`/api/resources/${resourceId}/process`, {
      method: "POST",
    });
  }

  confirmResource(
    resourceId: string,
    input: {
      assessmentIndexes: number[];
      classSessionIndexes: number[];
      topicIndexes: number[];
    },
  ): Promise<{
    assessmentCount: number;
    classSessionCount: number;
    topicCount: number;
    skippedDuplicateCount: number;
  }> {
    return this.request(`/api/resources/${resourceId}/confirm`, {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  deleteResource(resourceId: string): Promise<{ deleted: boolean }> {
    return this.request(`/api/resources/${resourceId}`, {
      method: "DELETE",
    });
  }

  profileSettings(): Promise<{ settings: AccountSettings }> {
    return this.request("/api/settings/profile");
  }

  updateProfile(input: {
    displayName: string | null;
    preferredLanguage: Language;
    timezone: string;
  }): Promise<{ updated: boolean }> {
    return this.request("/api/settings/profile", {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  }

  updateStudySettings(input: {
    dailyStudyMinutes: number;
    preferredStudyStartTime: string | null;
    weekStartsOn: number;
    reminderEnabled: boolean;
    academicIntegrityMode: boolean;
    aiExplanationLanguage: Language;
  }): Promise<{ updated: boolean }> {
    return this.request("/api/settings/study", {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  }

  notificationSettings(): Promise<{
    settings: NotificationPreferences;
  }> {
    return this.request("/api/settings/notifications");
  }

  updateNotificationSettings(
    input: Omit<NotificationPreferences, "unsubscribedAt">,
  ): Promise<{ updated: boolean }> {
    return this.request("/api/settings/notifications", {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  }

  notifications(): Promise<{ notifications: NotificationRecord[] }> {
    return this.request("/api/notifications");
  }

  markNotificationRead(
    notificationId: string,
  ): Promise<{ updated: boolean }> {
    return this.request(`/api/notifications/${notificationId}/read`, {
      method: "POST",
    });
  }

  billing(): Promise<BillingOverview> {
    return this.request("/api/billing");
  }

  createBillingPortal(): Promise<{ portalUrl: string }> {
    return this.request("/api/billing/portal", { method: "POST" });
  }

  weeklyReport(): Promise<WeeklyReport> {
    return this.request("/api/reports/weekly");
  }

  exportData(): Promise<Record<string, unknown>> {
    return this.request("/api/account/export");
  }

  deleteAccount(): Promise<{ deleted: boolean }> {
    return this.request("/api/account", {
      method: "DELETE",
      body: JSON.stringify({ confirmation: "DELETE" }),
    });
  }

  practiceOverview(): Promise<PracticeOverviewResponse> {
    return this.request("/api/practice");
  }

  mastery(): Promise<MasteryOverviewResponse> {
    return this.request("/api/mastery");
  }

  startFocusSession(input: {
    taskId: string;
    plannedMinutes: number;
  }): Promise<{ session: TodayResponse["activeFocusSession"] }> {
    return this.request("/api/focus-sessions", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  completeFocusSession(
    sessionId: string,
    input: {
      completionStatus: "completed" | "partial" | "abandoned";
      difficulty: number;
      needsMorePractice: boolean;
      confidenceAfter: number;
    },
  ): Promise<{ actualSeconds: number }> {
    return this.request(`/api/focus-sessions/${sessionId}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  }

  createPrivateQuestion(input: {
    courseId: string;
    topicTitle: string;
    difficulty: number;
    prompt: string;
    options: string[];
    correctChoiceIndex: number;
    hint1: string;
    hint2?: string | null;
    hint3?: string | null;
    explanation: string;
    language: Language;
  }): Promise<{ questionId: string; topicId: string }> {
    return this.request("/api/practice/questions", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  startPracticeSession(input: {
    courseId: string;
    topicId?: string | null;
    studyTaskId?: string | null;
    confidenceBefore?: number | null;
  }): Promise<{ session: SafePracticeSession; resumed: boolean }> {
    return this.request("/api/practice/sessions", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }

  async practiceSession(sessionId: string): Promise<SafePracticeSession> {
    const result = await this.request<{ session: SafePracticeSession }>(
      `/api/practice/sessions/${sessionId}`,
    );
    return result.session;
  }

  requestHint(
    sessionId: string,
  ): Promise<{ hint: string; hintsUsed: number }> {
    return this.request(`/api/practice/sessions/${sessionId}/hint`, {
      method: "POST",
    });
  }

  submitPracticeAnswer(
    sessionId: string,
    answer: string,
  ): Promise<PracticeAttemptResponse> {
    return this.request(`/api/practice/sessions/${sessionId}/attempt`, {
      method: "POST",
      body: JSON.stringify({ answer }),
    });
  }

  saveAttemptReflection(
    attemptId: string,
    input: { errorType: string; confidenceAfter: number },
  ): Promise<{ updated: boolean }> {
    return this.request(`/api/practice/attempts/${attemptId}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  }

  completeOnboarding(input: {
    displayName: string | null;
    language: Language;
    timezone: string;
    dailyStudyMinutes: number;
    semester: {
      institutionId: null;
      institutionName: string;
      name: string;
      startDate: string;
      endDate: string;
    };
    course: {
      templateId: null;
      courseCode: string | null;
      courseName: string;
      colourKey: string;
      instructorName: null;
    };
    classSessions: {
      sessionType: string;
      title: string;
      dayOfWeek: number;
      startTime: string;
      endTime: string;
      location: string | null;
      mapUrl: null;
    }[];
    assessments: {
      title: string;
      assessmentType: string;
      dueAt: string | null;
      weightPercent: number | null;
      estimatedMinutes: number | null;
      notes: null;
    }[];
  }): Promise<{
    semesterId: string;
    courseId: string;
    taskCount: number;
  }> {
    return this.request("/api/onboarding", {
      method: "POST",
      body: JSON.stringify(input),
    });
  }
}

export type { CompletedAttemptResponse };
