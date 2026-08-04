import { z } from "zod";
import { languageSchema } from "@deepstudy/shared-types";

const dateOnly = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD.");
const localDateTime = z
  .string()
  .regex(
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?$/,
    "Use a local date and time.",
  );
const optionalText = (maximum: number) =>
  z.string().trim().max(maximum).nullable().optional();

export const colourKeySchema = z.enum([
  "ocean",
  "forest",
  "amber",
  "violet",
  "rose",
  "slate",
]);

export const assessmentTypeSchema = z.enum([
  "quiz",
  "assignment",
  "skills_test",
  "exam",
  "lab",
  "project",
  "presentation",
  "other",
]);

export const assessmentStatusSchema = z.enum([
  "not_started",
  "in_progress",
  "submitted",
  "completed",
  "overdue",
]);

export const assessmentInputSchema = z.object({
  title: z.string().trim().min(1).max(160),
  assessmentType: assessmentTypeSchema.default("other"),
  dueLocal: localDateTime.nullable().optional(),
  dueAt: z.string().datetime({ offset: true }).nullable().optional(),
  weightPercent: z.number().min(0).max(100).nullable().optional(),
  estimatedMinutes: z.number().int().min(5).max(10_080).nullable().optional(),
  notes: optionalText(2_000),
  status: assessmentStatusSchema.optional(),
});

export const courseInputSchema = z.object({
  templateId: optionalText(80),
  courseCode: optionalText(32),
  courseName: optionalText(160),
  colourKey: colourKeySchema.default("ocean"),
  instructorName: optionalText(120),
});

export const onboardingInputSchema = z.object({
  displayName: optionalText(80),
  language: languageSchema,
  timezone: z.string().trim().min(1).max(100),
  dailyStudyMinutes: z.number().int().min(15).max(720),
  semester: z.object({
    institutionId: optionalText(80),
    institutionName: z.string().trim().min(1).max(160),
    name: z.string().trim().min(1).max(100),
    startDate: dateOnly,
    endDate: dateOnly,
  }),
  course: courseInputSchema,
  classSessions: z
    .array(
      z.object({
        sessionType: z.enum([
          "lecture",
          "tutorial",
          "workshop",
          "lab",
          "practical",
          "other",
        ]),
        title: z.string().trim().min(1).max(120),
        dayOfWeek: z.number().int().min(0).max(6),
        startTime: z.string().regex(/^\d{2}:\d{2}$/),
        endTime: z.string().regex(/^\d{2}:\d{2}$/),
        location: optionalText(160),
        mapUrl: z.string().url().max(500).nullable().optional(),
      }),
    )
    .max(20)
    .default([]),
  assessments: z.array(assessmentInputSchema).max(10).default([]),
});

export const courseUpdateSchema = z.object({
  courseCode: optionalText(32),
  courseName: z.string().trim().min(1).max(160),
  colourKey: colourKeySchema,
  instructorName: optionalText(120),
});

export const semesterInputSchema = z.object({
  institutionId: optionalText(80),
  institutionName: z.string().trim().min(1).max(160),
  name: z.string().trim().min(1).max(100),
  startDate: dateOnly,
  endDate: dateOnly,
  status: z.enum(["draft", "active", "completed"]).default("active"),
});

export const semesterCreateSchema = semesterInputSchema.extend({
  status: z.enum(["draft", "active"]).default("active"),
});

export const focusSessionStartSchema = z.object({
  taskId: z.string().trim().min(1).max(120),
  plannedMinutes: z.number().int().min(5).max(180),
});

export const focusSessionCompleteSchema = z.object({
  completionStatus: z.enum(["completed", "partial", "abandoned"]),
  difficulty: z.number().int().min(1).max(5).nullable().optional(),
  needsMorePractice: z.boolean().default(false),
  confidenceAfter: z.number().int().min(1).max(5).nullable().optional(),
});

export const errorTypeSchema = z.enum([
  "concept",
  "formula",
  "algebra",
  "units",
  "sign",
  "interpretation",
  "syntax",
  "logic",
  "careless",
  "unknown",
]);

export const privatePracticeQuestionSchema = z
  .object({
    courseId: z.string().trim().min(1).max(120),
    topicTitle: z.string().trim().min(1).max(160),
    difficulty: z.number().int().min(1).max(5),
    prompt: z.string().trim().min(1).max(2_000),
    options: z
      .array(z.string().trim().min(1).max(500))
      .min(2)
      .max(5),
    correctChoiceIndex: z.number().int().min(0).max(4),
    hint1: z.string().trim().min(1).max(1_000),
    hint2: optionalText(1_000),
    hint3: optionalText(1_000),
    explanation: z.string().trim().min(1).max(3_000),
    language: languageSchema,
  })
  .superRefine((input, context) => {
    if (input.correctChoiceIndex >= input.options.length) {
      context.addIssue({
        code: "custom",
        path: ["correctChoiceIndex"],
        message: "The correct choice must exist in the options.",
      });
    }
    if (
      new Set(input.options.map((option) => option.toLocaleLowerCase())).size !==
      input.options.length
    ) {
      context.addIssue({
        code: "custom",
        path: ["options"],
        message: "Answer choices must be unique.",
      });
    }
  });

export const practiceSessionStartSchema = z.object({
  courseId: z.string().trim().min(1).max(120),
  topicId: z.string().trim().min(1).max(120).nullable().optional(),
  studyTaskId: z.string().trim().min(1).max(120).nullable().optional(),
  confidenceBefore: z.number().int().min(1).max(5).nullable().optional(),
});

export const practiceAttemptSubmitSchema = z.object({
  answer: z.string().trim().min(1).max(2_000),
});

export const practiceAttemptMetadataSchema = z.object({
  errorType: errorTypeSchema,
  confidenceAfter: z.number().int().min(1).max(5),
});

export const planRebalanceSchema = z.object({
  confirmCritical: z.boolean().default(false),
});

export const classSessionTypeSchema = z.enum([
  "lecture",
  "tutorial",
  "workshop",
  "lab",
  "practical",
  "other",
]);

export const classSessionInputSchema = z
  .object({
    sessionType: classSessionTypeSchema.default("other"),
    title: z.string().trim().min(1).max(120),
    dayOfWeek: z.number().int().min(0).max(6),
    startTime: z.string().regex(/^\d{2}:\d{2}$/),
    endTime: z.string().regex(/^\d{2}:\d{2}$/),
    location: optionalText(160),
    mapUrl: z.string().url().max(500).nullable().optional(),
    startDate: dateOnly.nullable().optional(),
    endDate: dateOnly.nullable().optional(),
    recurrenceRule: optionalText(500),
  })
  .superRefine((input, context) => {
    if (input.endTime <= input.startTime) {
      context.addIssue({
        code: "custom",
        path: ["endTime"],
        message: "Class end time must be after its start time.",
      });
    }
    if (input.startDate && input.endDate && input.endDate < input.startDate) {
      context.addIssue({
        code: "custom",
        path: ["endDate"],
        message: "Class end date must be after its start date.",
      });
    }
  });

export const topicInputSchema = z
  .object({
    title: z.string().trim().min(1).max(160),
    description: optionalText(2_000),
    weekNumber: z.number().int().min(1).max(80).nullable().optional(),
    sequenceNumber: z.number().int().min(0).max(1_000).default(0),
  })
  .strict();

export const taskTypeSchema = z.enum([
  "preview",
  "review",
  "practice",
  "assessment",
  "revision",
  "retest",
  "reading",
  "custom",
]);

export const taskPrioritySchema = z.enum([
  "low",
  "medium",
  "high",
  "critical",
]);

export const customStudyTaskSchema = z
  .object({
    courseId: z.string().trim().min(1).max(120).nullable().optional(),
    topicId: z.string().trim().min(1).max(120).nullable().optional(),
    assessmentId: z.string().trim().min(1).max(120).nullable().optional(),
    title: z.string().trim().min(1).max(180),
    description: optionalText(2_000),
    completionCriteria: z.string().trim().min(1).max(1_500),
    taskType: taskTypeSchema.default("custom"),
    priority: taskPrioritySchema.default("medium"),
    estimatedMinutes: z.number().int().min(5).max(720),
    scheduledFor: dateOnly,
    dueAt: z.string().datetime({ offset: true }).nullable().optional(),
  })
  .strict();

export const taskScheduleSchema = z
  .object({ scheduledFor: dateOnly })
  .strict();

export const taskReorderSchema = z
  .object({
    scheduledFor: dateOnly,
    taskIds: z
      .array(z.string().trim().min(1).max(120))
      .min(1)
      .max(50)
      .refine((values) => new Set(values).size === values.length, {
        message: "Task order cannot contain duplicates.",
      }),
  })
  .strict();

export const checkoutInputSchema = z
  .object({
    productKey: z.enum([
      "founding_pass",
      "semester_pass",
      "exam_sprint",
    ]),
  })
  .strict();

export const aiTutorInputSchema = z
  .object({
    courseId: z.string().trim().min(1).max(120),
    topicId: optionalText(120),
    currentTaskId: optionalText(120),
    conversationId: optionalText(120),
    message: z.string().trim().min(1).max(4_000),
    studentAttempt: optionalText(4_000),
    resourceIds: z
      .array(z.string().trim().min(1).max(120))
      .max(5)
      .default([]),
    language: languageSchema,
    suspectedAssessedWork: z.boolean().default(false),
  })
  .strict();

export const resourceTypeSchema = z.enum([
  "lecture_notes",
  "subject_information",
  "assessment_information",
  "personal_notes",
  "timetable",
  "other",
]);

export const resourceTextUploadSchema = z
  .object({
    courseId: z.string().trim().min(1).max(120),
    resourceType: resourceTypeSchema,
    text: z.string().trim().min(1).max(200_000),
    fileName: z
      .string()
      .trim()
      .min(1)
      .max(120)
      .regex(/\.(?:txt|md)$/i)
      .optional(),
  })
  .strict();

export const resourceConfirmationSchema = z
  .object({
    assessmentIndexes: z.array(z.number().int().min(0).max(39)).max(40),
    classSessionIndexes: z.array(z.number().int().min(0).max(39)).max(40),
    topicIndexes: z.array(z.number().int().min(0).max(79)).max(80),
  })
  .strict();

export const aiPracticeGenerationSchema = z
  .object({
    courseId: z.string().trim().min(1).max(120),
    topicTitle: z.string().trim().min(1).max(160),
    difficulty: z.number().int().min(1).max(5),
    resourceIds: z
      .array(z.string().trim().min(1).max(120))
      .max(5)
      .default([]),
    language: languageSchema,
  })
  .strict();

export const profileSettingsSchema = z
  .object({
    displayName: optionalText(80),
    preferredLanguage: languageSchema,
    timezone: z.string().trim().min(1).max(100),
  })
  .strict();

export const studySettingsSchema = z
  .object({
    dailyStudyMinutes: z.number().int().min(15).max(720),
    preferredStudyStartTime: z
      .string()
      .regex(/^\d{2}:\d{2}$/)
      .nullable(),
    weekStartsOn: z.number().int().min(0).max(6),
    reminderEnabled: z.boolean(),
    academicIntegrityMode: z.boolean(),
    aiExplanationLanguage: languageSchema,
  })
  .strict();

export const notificationSettingsSchema = z
  .object({
    tomorrowClasses: z.boolean(),
    deadlineApproaching: z.boolean(),
    dailyPlan: z.boolean(),
    reviewDue: z.boolean(),
    weeklyReport: z.boolean(),
    marketing: z.boolean(),
  })
  .strict();

export const accountDeletionSchema = z
  .object({
    confirmation: z.literal("DELETE"),
  })
  .strict();

export const clientAnalyticsEventSchema = z
  .object({
    eventName: z.enum(["onboarding_started", "paywall_viewed"]),
    properties: z
      .record(
        z.string().max(60),
        z.union([
          z.string().max(120),
          z.number().finite(),
          z.boolean(),
          z.null(),
        ]),
      )
      .default({}),
  })
  .strict();

export const adminFeatureFlagSchema = z
  .object({ enabled: z.boolean() })
  .strict();

export const adminUserStatusSchema = z
  .object({ status: z.enum(["active", "suspended"]) })
  .strict();

export const adminCourseTemplateSchema = z
  .object({
    courseCode: optionalText(32),
    courseName: z.string().trim().min(1).max(160),
    description: optionalText(2_000),
    defaultLanguage: languageSchema,
    isActive: z.boolean(),
  })
  .strict();

export const adminQuestionReviewSchema = z
  .object({
    reviewStatus: z.enum(["draft", "reviewed", "rejected"]),
  })
  .strict();

export const adminCourseTemplateCreateSchema = adminCourseTemplateSchema
  .extend({
    institutionId: optionalText(80),
    colourKey: colourKeySchema.default("ocean"),
  })
  .strict();

export const adminPublicQuestionSchema = z
  .object({
    courseTemplateId: z.string().trim().min(1).max(120),
    questionType: z.enum([
      "single_choice",
      "multiple_choice",
      "short_answer",
      "numeric",
    ]),
    difficulty: z.number().int().min(1).max(5),
    prompt: z.string().trim().min(1).max(2_000),
    options: z.array(z.string().trim().min(1).max(500)).max(6).default([]),
    solution: z.string().trim().min(1).max(2_000),
    hint1: optionalText(1_000),
    hint2: optionalText(1_000),
    hint3: optionalText(1_000),
    explanation: z.string().trim().min(1).max(3_000),
    language: languageSchema,
  })
  .strict()
  .superRefine((input, context) => {
    if (
      ["single_choice", "multiple_choice"].includes(input.questionType) &&
      input.options.length < 2
    ) {
      context.addIssue({
        code: "custom",
        path: ["options"],
        message: "Choice questions require at least two options.",
      });
    }
  });
