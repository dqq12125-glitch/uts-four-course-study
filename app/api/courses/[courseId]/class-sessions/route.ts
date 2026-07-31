import { getAcademicRepository } from "@/src/application/runtime";
import { requireUserFromRequest } from "@/src/application/session";
import {
  ApiError,
  errorResponse,
  jsonOk,
  requestId,
} from "@/src/lib/api-errors";
import { createId } from "@/src/lib/ids";
import { assertSameOrigin } from "@/src/lib/request-security";
import { classSessionInputSchema } from "@/src/lib/schemas";

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
    return jsonOk(
      {
        classSessions: await getAcademicRepository().listClassSessions(
          user.id,
          courseId,
        ),
      },
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
    const parsed = classSessionInputSchema.safeParse(await request.json());
    if (!parsed.success) {
      throw new ApiError(
        "VALIDATION_ERROR",
        400,
        parsed.error.issues[0]?.message ?? "Check the class details.",
      );
    }
    const classSessionId = createId("class");
    const created = await getAcademicRepository().createClassSession({
      id: classSessionId,
      userId: user.id,
      courseId,
      ...parsed.data,
      location: parsed.data.location?.trim() || null,
      mapUrl: parsed.data.mapUrl ?? null,
      startDate: parsed.data.startDate ?? null,
      endDate: parsed.data.endDate ?? null,
      recurrenceRule: parsed.data.recurrenceRule?.trim() || null,
      now: new Date().toISOString(),
    });
    if (!created) {
      throw new ApiError("COURSE_NOT_FOUND", 404, "Course not found.");
    }
    return jsonOk({ classSessionId }, 201, { "x-request-id": id });
  } catch (error) {
    return errorResponse(error, id);
  }
}
