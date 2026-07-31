export type Language = "zh-CN" | "en";

export interface SessionUser {
  id: string;
  email: string;
  displayName: string | null;
  preferredLanguage: Language;
  timezone: string;
  onboardingCompleted: boolean;
}

export interface SessionResponse {
  user: SessionUser | null;
}

export interface MobileExchangeResponse {
  sessionToken: string;
  expiresAt: string;
  user: SessionUser;
}

export interface Course {
  id: string;
  userSemesterId: string;
  courseTemplateId: string | null;
  courseCode: string | null;
  courseName: string;
  colourKey: string;
  instructorName: string | null;
  sourceType: "template" | "manual" | "imported";
  assessmentCount?: number;
}

export interface TodayTask {
  id: string;
  courseId: string | null;
  topicId: string | null;
  courseCode: string | null;
  courseName: string | null;
  title: string;
  description: string | null;
  completionCriteria: string;
  reason: string;
  priority: "low" | "medium" | "high" | "critical";
  estimatedMinutes: number;
  status: "queued" | "active" | "completed" | "skipped" | "overdue";
  taskType: string;
  dueAt: string | null;
}

export interface FocusSession {
  id: string;
  studyTaskId: string | null;
  plannedMinutes: number;
  actualSeconds: number | null;
  startedAt: string;
  endedAt: string | null;
  completionStatus: "active" | "completed" | "partial" | "abandoned";
  difficulty: number | null;
  needsMorePractice: number;
  confidenceAfter: number | null;
}

export interface TodayResponse {
  serverNow: string;
  dateKey: string;
  user: {
    displayName: string | null;
    preferredLanguage: Language;
    timezone: string;
  };
  semester: {
    name: string;
    startDate: string;
    endDate: string;
  } | null;
  settings: { dailyStudyMinutes: number };
  currentTask: TodayTask | null;
  queue: TodayTask[];
  classSessions: {
    id: string;
    courseCode: string | null;
    courseName: string;
    sessionType: string;
    title: string;
    startTime: string;
    endTime: string;
    location: string | null;
    mapUrl: string | null;
  }[];
  assessments: {
    id: string;
    courseCode: string | null;
    courseName: string;
    title: string;
    dueAt: string | null;
  }[];
  dueReviewCount: number;
  studyStreak: number;
  plannedMinutes: number;
  activeFocusSession: FocusSession | null;
}

export interface Assessment {
  id: string;
  courseId: string;
  title: string;
  assessmentType: string;
  dueAt: string | null;
  weightPercent: number | null;
  estimatedMinutes: number | null;
  status: string;
  notes: string | null;
}

export interface ClassSession {
  id: string;
  courseId: string;
  courseCode: string | null;
  courseName: string;
  sessionType: string;
  title: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  location: string | null;
  mapUrl: string | null;
  startDate: string | null;
  endDate: string | null;
  recurrenceRule: string | null;
}

export interface Topic {
  id: string;
  courseId: string;
  title: string;
  description: string | null;
  weekNumber: number | null;
  sequenceNumber: number;
  masteryScore: number | null;
  nextReviewAt: string | null;
  attemptCount: number;
}

export interface PlanTask extends TodayTask {
  colourKey: string | null;
  assessmentId: string | null;
  priorityScore: number;
  sortOrder: number;
  scheduledFor: string;
  generatedBy: string;
  completedAt: string | null;
}

export interface PlanResponse {
  startDate: string;
  endDate: string;
  tasks: PlanTask[];
  days: {
    date: string;
    tasks: PlanTask[];
    plannedMinutes: number;
  }[];
}

export interface AccountSettings {
  id: string;
  email: string;
  displayName: string | null;
  preferredLanguage: Language;
  timezone: string;
  createdAt: string;
  dailyStudyMinutes: number;
  preferredStudyStartTime: string | null;
  weekStartsOn: number;
  reminderEnabled: number | boolean;
  academicIntegrityMode: number | boolean;
  aiExplanationLanguage: Language;
}

export interface NotificationPreferences {
  tomorrowClasses: number | boolean;
  deadlineApproaching: number | boolean;
  dailyPlan: number | boolean;
  reviewDue: number | boolean;
  weeklyReport: number | boolean;
  marketing: number | boolean;
  unsubscribedAt: string | null;
}

export interface NotificationRecord {
  id: string;
  notificationType: string;
  title: string;
  body: string;
  actionUrl: string | null;
  scheduledFor: string;
  readAt: string | null;
}

export interface Entitlement {
  planKey: "free" | "founding_pass" | "semester_pass" | "exam_sprint";
  activeProducts: string[];
  isFoundingUser: boolean;
  courseLimit: number;
  activeSemesterLimit: number;
  dailyAiMessageLimit: number;
  weeklyPracticeGenerationLimit: number;
  aiContextCharacterLimit: number;
  monthlyAiCostLimitMinorUsd: number;
  canUseAiTutor: boolean;
  canGeneratePractice: boolean;
  canUploadResource: boolean;
  canViewAdvancedMastery: boolean;
  canAccessWeeklyReport: boolean;
}

export interface Purchase {
  id: string;
  productKey: string;
  amountMinor: number;
  currency: string;
  status: string;
  accessStartAt: string | null;
  accessEndAt: string | null;
  createdAt: string;
}

export interface BillingOverview {
  entitlement: Entitlement;
  purchases: Purchase[];
  products: {
    key: string;
    name: string;
    amountMinor: number;
    currency: string;
    available: boolean;
  }[];
}

export interface ResourceProposal {
  assessments?: {
    title: string;
    assessmentType: string;
    dueLocal: string | null;
    notes?: string | null;
  }[];
  classSessions?: {
    title: string;
    sessionType: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    location: string | null;
    mapUrl?: string | null;
    startDate?: string | null;
    endDate?: string | null;
    recurrenceRule?: string | null;
  }[];
  topics?: string[];
  warnings?: string[];
}

export interface LearningResource {
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
  proposal?: ResourceProposal | null;
}

export interface TutorResponse {
  conversationId: string;
  reply: string;
  safetyMode: string;
  remainingToday: number;
  academicIntegrityNotice: string;
}

export interface WeeklyReport {
  from: string;
  to: string;
  completedTasks: number;
  focusMinutes: number;
  practiceAttempts: number;
  correctAttempts: number;
  reviewsCompleted: number;
  dueReviews: number;
  courses: {
    courseId: string;
    courseCode: string | null;
    courseName: string;
    colourKey: string;
    completedTasks: number;
    focusMinutes: number;
    practiceAttempts: number;
    correctAttempts: number;
    reviewsCompleted: number;
  }[];
  weakTopics: {
    courseName: string;
    topicTitle: string;
    masteryScore: number;
    nextReviewAt: string | null;
    lastErrorType: string | null;
  }[];
}

export interface SafePracticeSession {
  sessionId: string;
  courseId: string;
  courseCode: string | null;
  courseName: string;
  topicId: string;
  topicTitle: string;
  questionId: string;
  questionType: string;
  difficulty: number;
  prompt: string;
  options: string[];
  language: Language;
  status: "active" | "completed" | "abandoned";
  hintsUsed: number;
  incorrectAttempts: number;
  revealedHints: string[];
  confidenceBefore: number | null;
  startedAt: string;
}

export interface PracticeOverviewResponse {
  courses: {
    id: string;
    courseCode: string | null;
    courseName: string;
    colourKey: string;
    questionCount: number;
    dueReviewCount: number;
  }[];
  activeSession: SafePracticeSession | null;
}

export interface RetryAttemptResponse {
  isCorrect: false;
  retryAllowed: true;
  masteryUpdated: false;
  hintsUsed: number;
  incorrectAttempts: number;
  message: string;
}

export interface CompletedAttemptResponse {
  attemptId: string;
  isCorrect: boolean;
  retryAllowed: false;
  masteryUpdated: true;
  hadIncorrectAttempt: boolean;
  correctAnswer: string;
  explanation: string;
  masteryBand: string;
  nextReviewAt: string;
  reviewIntervalHours: number;
  hintsUsed: number;
  timeSpentSeconds: number;
}

export type PracticeAttemptResponse =
  | RetryAttemptResponse
  | CompletedAttemptResponse;

export interface MasteryOverviewResponse {
  serverNow: string;
  timezone: string;
  dueCount: number;
  stableCount: number;
  topics: {
    id: string;
    courseId: string;
    courseCode: string | null;
    courseName: string;
    colourKey: string;
    topicId: string;
    topicTitle: string;
    band:
      | "not_started"
      | "building"
      | "basic"
      | "stable"
      | "review_due";
    isReviewDue: boolean;
    nextReviewAt: string | null;
    consecutiveCorrect: number;
    attemptCount: number;
    lastErrorType: string | null;
    reviewTaskId: string | null;
  }[];
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    requestId?: string;
  };
}
