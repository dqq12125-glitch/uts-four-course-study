import {
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
import { assessmentInputSchema } from "@/src/lib/schemas";
import { zonedDateTimeToUtc } from "@/src/lib/timezone";

interface RouteContext {
  params: Promise<{ courseId: string }>;
}

export async function GET(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const id = requestId(request);
  try {
    const user = await requireUserFromRequest(request);
    const { courseId } = await context.params;
    const repository = getLearningRepository();
    if (!(await repository.findCourse(user.id, courseId))) {
      throw new ApiError("COURSE_NOT_FOUND", 404, "Course not found.");
    }
    return jsonOk(
      { assessments: await repository.listAssessments(user.id, courseId) },
      200,
      { "x-request-id": id },
    );
  } catch (error) {
    return errorResponse(error, id);
  }
}

export async function POST(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const id = requestId(request);
  try {
    assertSameOrigin(request);
    const user = await requireUserFromRequest(request);
    const { courseId } = await context.params;
    const parsed = assessmentInputSchema.safeParse(await request.json());
    if (!parsed.success) {
      throw new ApiError(
        "VALIDATION_ERROR",
        400,
        parsed.error.issues[0]?.message ?? "Check the assessment details.",
      );
    }
    const dueAt = parsed.data.dueAt
      ? new Date(parsed.data.dueAt).toISOString()
      : parsed.data.dueLocal
        ? zonedDateTimeToUtc(
            parsed.data.dueLocal,
            user.timezone,
          ).toISOString()
        : null;
    const assessmentId = createId("assessment");
    const created = await getLearningRepository().createAssessment(user.id, {
      id: assessmentId,
      courseId,
      title: parsed.data.title,
      assessmentType: parsed.data.assessmentType,
      dueAt,
      weightPercent: parsed.data.weightPercent ?? null,
      estimatedMinutes: parsed.data.estimatedMinutes ?? null,
      notes: parsed.data.notes?.trim() || null,
      now: new Date().toISOString(),
    });
    if (!created) {
      throw new ApiError("COURSE_NOT_FOUND", 404, "Course not found.");
    }
    await getAnalyticsService().recordBestEffort(
      user.id,
      "assessment_created",
      { source: "manual" },
    );
    return jsonOk({ assessmentId }, 201, { "x-request-id": id });
  } catch (error) {
    return errorResponse(error, id);
  }
}
