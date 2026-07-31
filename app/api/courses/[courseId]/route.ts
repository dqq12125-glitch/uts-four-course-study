import { getLearningRepository } from "@/src/application/runtime";
import { requireUserFromRequest } from "@/src/application/session";
import {
  ApiError,
  errorResponse,
  jsonOk,
  requestId,
} from "@/src/lib/api-errors";
import { assertSameOrigin } from "@/src/lib/request-security";
import { courseUpdateSchema } from "@/src/lib/schemas";

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
    const course = await repository.findCourse(user.id, courseId);
    if (!course) {
      throw new ApiError("COURSE_NOT_FOUND", 404, "Course not found.");
    }
    const assessments = await repository.listAssessments(user.id, courseId);
    return jsonOk(
      { course, assessments },
      200,
      { "x-request-id": id },
    );
  } catch (error) {
    return errorResponse(error, id);
  }
}

export async function PATCH(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const id = requestId(request);
  try {
    assertSameOrigin(request);
    const user = await requireUserFromRequest(request);
    const { courseId } = await context.params;
    const parsed = courseUpdateSchema.safeParse(await request.json());
    if (!parsed.success) {
      throw new ApiError(
        "VALIDATION_ERROR",
        400,
        parsed.error.issues[0]?.message ?? "Please check the course details.",
      );
    }
    const updated = await getLearningRepository().updateCourse(
      user.id,
      courseId,
      {
        courseCode: parsed.data.courseCode?.trim() || null,
        courseName: parsed.data.courseName,
        colourKey: parsed.data.colourKey,
        instructorName: parsed.data.instructorName?.trim() || null,
        now: new Date().toISOString(),
      },
    );
    if (!updated) {
      throw new ApiError("COURSE_NOT_FOUND", 404, "Course not found.");
    }
    return jsonOk({ updated: true }, 200, { "x-request-id": id });
  } catch (error) {
    return errorResponse(error, id);
  }
}

export async function DELETE(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const id = requestId(request);
  try {
    assertSameOrigin(request);
    const user = await requireUserFromRequest(request);
    const { courseId } = await context.params;
    const archived = await getLearningRepository().archiveCourse(
      user.id,
      courseId,
      new Date().toISOString(),
    );
    if (!archived) {
      throw new ApiError("COURSE_NOT_FOUND", 404, "Course not found.");
    }
    return jsonOk({ archived: true }, 200, { "x-request-id": id });
  } catch (error) {
    return errorResponse(error, id);
  }
}
