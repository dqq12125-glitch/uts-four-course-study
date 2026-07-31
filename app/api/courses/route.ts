import {
  getEntitlementService,
  getAnalyticsService,
  getLearningRepository,
} from "@/src/application/runtime";
import { requireUserFromRequest } from "@/src/application/session";
import {
  ApiError,
  errorResponse,
  jsonOk,
  requestId,
} from "@/src/lib/api-errors";
import { createId } from "@/src/lib/ids";
import { assertSameOrigin } from "@/src/lib/request-security";
import { courseInputSchema } from "@/src/lib/schemas";
import { generateDailyPlan } from "@/src/domain/planning/plan-generator";

export async function GET(request: Request): Promise<Response> {
  const id = requestId(request);
  try {
    const user = await requireUserFromRequest(request);
    const courses = await getLearningRepository().listCourses(user.id);
    return jsonOk({ courses }, 200, { "x-request-id": id });
  } catch (error) {
    return errorResponse(error, id);
  }
}

export async function POST(request: Request): Promise<Response> {
  const id = requestId(request);
  try {
    assertSameOrigin(request);
    const user = await requireUserFromRequest(request);
    const parsed = courseInputSchema.safeParse(await request.json());
    if (!parsed.success) {
      throw new ApiError(
        "VALIDATION_ERROR",
        400,
        parsed.error.issues[0]?.message ?? "Please check the course details.",
      );
    }

    const repository = getLearningRepository();
    await getEntitlementService().assertCanCreateCourse(
      user.id,
      user.role,
    );
    const semesterId = await repository.activeSemesterId(user.id);
    if (!semesterId) {
      throw new ApiError(
        "ACTIVE_SEMESTER_REQUIRED",
        409,
        "Create an active semester before adding a course.",
      );
    }

    const template = parsed.data.templateId
      ? await repository.findCourseTemplate(parsed.data.templateId)
      : null;
    if (parsed.data.templateId && !template) {
      throw new ApiError(
        "COURSE_TEMPLATE_NOT_FOUND",
        404,
        "That course template is no longer available.",
      );
    }
    const courseName = (
      template?.courseName ??
      parsed.data.courseName ??
      ""
    ).trim();
    if (!courseName) {
      throw new ApiError(
        "COURSE_NAME_REQUIRED",
        400,
        "Course name is required.",
      );
    }

    const courseId = createId("course");
    const now = new Date();
    const plan = generateDailyPlan({
      courses: [
        {
          id: courseId,
          courseCode:
            template?.courseCode ??
            (parsed.data.courseCode?.trim() || null),
          courseName,
        },
      ],
      assessments: [],
      dailyStudyMinutes: await repository.dailyStudyMinutes(user.id),
      timezone: user.timezone,
      language: user.preferredLanguage,
      now,
    });
    const starterTask = plan.tasks[0];
    if (!starterTask) {
      throw new ApiError(
        "PLAN_GENERATION_FAILED",
        500,
        "The first study task could not be generated.",
      );
    }
    const created = await repository.createCourse(user.id, {
      id: courseId,
      userSemesterId: semesterId,
      courseTemplateId: template?.id ?? null,
      courseCode:
        template?.courseCode ?? (parsed.data.courseCode?.trim() || null),
      courseName,
      colourKey: parsed.data.colourKey,
      instructorName: parsed.data.instructorName?.trim() || null,
      sourceType: template ? "template" : "manual",
      now: now.toISOString(),
      starterTask: {
        ...starterTask,
        id: createId("task"),
      },
    });
    if (!created) {
      throw new ApiError(
        "COURSE_CREATE_FAILED",
        409,
        "The course could not be created.",
      );
    }
    await getAnalyticsService().recordBestEffort(
      user.id,
      "course_created",
      { source: template ? "template" : "manual" },
    );
    return jsonOk({ courseId }, 201, { "x-request-id": id });
  } catch (error) {
    return errorResponse(error, id);
  }
}
