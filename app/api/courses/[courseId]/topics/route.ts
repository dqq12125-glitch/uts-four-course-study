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
import { topicInputSchema } from "@/src/lib/schemas";

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
        topics: await getAcademicRepository().listTopics(user.id, courseId),
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
    const parsed = topicInputSchema.safeParse(await request.json());
    if (!parsed.success) {
      throw new ApiError(
        "VALIDATION_ERROR",
        400,
        parsed.error.issues[0]?.message ?? "Check the topic details.",
      );
    }
    const topicId = createId("topic");
    if (
      !(await getAcademicRepository().createTopic({
        id: topicId,
        userId: user.id,
        courseId,
        ...parsed.data,
        description: parsed.data.description?.trim() || null,
        weekNumber: parsed.data.weekNumber ?? null,
        now: new Date().toISOString(),
      }))
    ) {
      throw new ApiError("COURSE_NOT_FOUND", 404, "Course not found.");
    }
    return jsonOk({ topicId }, 201, { "x-request-id": id });
  } catch (error) {
    return errorResponse(error, id);
  }
}
