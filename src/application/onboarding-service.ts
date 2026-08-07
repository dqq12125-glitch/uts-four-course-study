import { ApiError } from "../lib/api-errors.ts";
import { createId } from "../lib/ids.ts";
import {
  isValidTimeZone,
  zonedDateTimeToUtc,
} from "../lib/timezone.ts";
import { generateDailyPlan } from "../domain/planning/plan-generator.ts";
import type { LearningRepository } from "../repositories/learning-repository.ts";

export interface OnboardingInput {
  displayName?: string | null;
  language: "zh-CN" | "en";
  timezone: string;
  dailyStudyMinutes: number;
  semester: {
    institutionId?: string | null;
    institutionName: string;
    name: string;
    startDate: string;
    endDate: string;
  };
  course: {
    templateId?: string | null;
    courseCode?: string | null;
    courseName?: string | null;
    colourKey: string;
    instructorName?: string | null;
  };
  classSessions: Array<{
    sessionType:
      | "lecture"
      | "tutorial"
      | "workshop"
      | "lab"
      | "practical"
      | "other";
    title: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    location?: string | null;
    mapUrl?: string | null;
  }>;
  assessments: Array<{
    title: string;
    assessmentType: string;
    dueLocal?: string | null;
    dueAt?: string | null;
    weightPercent?: number | null;
    estimatedMinutes?: number | null;
    notes?: string | null;
  }>;
}

export class OnboardingService {
  private readonly repository: LearningRepository;

  constructor(repository: LearningRepository) {
    this.repository = repository;
  }

  async complete(
    userId: string,
    input: OnboardingInput,
    now = new Date(),
  ): Promise<{
    semesterId: string;
    courseId: string;
    taskCount: number;
    estimatedMinutes: number;
    overload: boolean;
  }> {
    if (!isValidTimeZone(input.timezone)) {
      throw new ApiError(
        "INVALID_TIMEZONE",
        400,
        "Please select a valid time zone.",
      );
    }
    if (input.semester.endDate < input.semester.startDate) {
      throw new ApiError(
        "INVALID_SEMESTER_DATES",
        400,
        "Semester end date must be after its start date.",
      );
    }
    if (await this.repository.hasCompletedOnboarding(userId)) {
      throw new ApiError(
        "ONBOARDING_ALREADY_COMPLETED",
        409,
        "Onboarding has already been completed.",
      );
    }
    if (
      input.semester.institutionId &&
      !(await this.repository.institutionExists(
        input.semester.institutionId,
      ))
    ) {
      throw new ApiError(
        "INSTITUTION_NOT_FOUND",
        404,
        "That institution is no longer available.",
      );
    }

    const template = input.course.templateId
      ? await this.repository.findCourseTemplate(input.course.templateId)
      : null;
    if (input.course.templateId && !template) {
      throw new ApiError(
        "COURSE_TEMPLATE_NOT_FOUND",
        404,
        "That course template is no longer available.",
      );
    }

    const courseName = (
      template?.courseName ??
      input.course.courseName ??
      ""
    ).trim();
    if (!courseName) {
      throw new ApiError(
        "COURSE_NAME_REQUIRED",
        400,
        "Course name is required.",
      );
    }

    const semesterId = createId("semester");
    const courseId = createId("course");
    const assessments = input.assessments.map((assessment) => ({
      id: createId("assessment"),
      title: assessment.title.trim(),
      assessmentType: assessment.assessmentType,
      dueAt: assessment.dueAt
        ? new Date(assessment.dueAt).toISOString()
        : assessment.dueLocal
          ? zonedDateTimeToUtc(
              assessment.dueLocal,
              input.timezone,
            ).toISOString()
          : null,
      weightPercent: assessment.weightPercent ?? null,
      estimatedMinutes: assessment.estimatedMinutes ?? null,
      notes: assessment.notes?.trim() || null,
    }));
    const course = {
      id: courseId,
      courseTemplateId: template?.id ?? null,
      courseCode:
        template?.courseCode ?? (input.course.courseCode?.trim() || null),
      courseName,
      colourKey: input.course.colourKey,
      instructorName: input.course.instructorName?.trim() || null,
      sourceType: template ? ("template" as const) : ("manual" as const),
      assessments,
      classSessions: input.classSessions.map((session) => ({
        id: createId("class"),
        sessionType: session.sessionType,
        title: session.title.trim(),
        dayOfWeek: session.dayOfWeek,
        startTime: session.startTime,
        endTime: session.endTime,
        location: session.location?.trim() || null,
        mapUrl: session.mapUrl ?? null,
      })),
    };
    const plan = generateDailyPlan({
      courses: [
        {
          id: courseId,
          courseCode: course.courseCode,
          courseName,
        },
      ],
      assessments: assessments.map((assessment) => ({
        ...assessment,
        courseId,
        courseName,
      })),
      dailyStudyMinutes: input.dailyStudyMinutes,
      timezone: input.timezone,
      language: input.language,
      now,
    });

    await this.repository.completeOnboarding({
      userId,
      displayName: input.displayName?.trim() || null,
      language: input.language,
      timezone: input.timezone,
      dailyStudyMinutes: input.dailyStudyMinutes,
      semester: {
        id: semesterId,
        institutionId: input.semester.institutionId ?? null,
        institutionName: input.semester.institutionName.trim(),
        name: input.semester.name.trim(),
        startDate: input.semester.startDate,
        endDate: input.semester.endDate,
      },
      courses: [course],
      tasks: plan.tasks.map((task) => ({
        ...task,
        id: createId("task"),
      })),
      now: now.toISOString(),
    });

    return {
      semesterId,
      courseId,
      taskCount: plan.tasks.length,
      estimatedMinutes: plan.estimatedMinutes,
      overload: plan.overload,
    };
  }
}
