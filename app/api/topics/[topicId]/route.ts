import { getAcademicRepository } from "@/src/application/runtime";
import { requireUserFromRequest } from "@/src/application/session";
import {
  ApiError,
  errorResponse,
  jsonOk,
  requestId,
} from "@/src/lib/api-errors";
import { assertSameOrigin } from "@/src/lib/request-security";
import { topicInputSchema } from "@/src/lib/schemas";

interface RouteContext {
  params: Promise<{ topicId: string }>;
}

export async function PATCH(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const id = requestId(request);
  try {
    assertSameOrigin(request);
    const user = await requireUserFromRequest(request);
    const parsed = topicInputSchema.safeParse(await request.json());
    if (!parsed.success) {
      throw new ApiError(
        "VALIDATION_ERROR",
        400,
        parsed.error.issues[0]?.message ?? "Check the topic details.",
      );
    }
    const { topicId } = await context.params;
    if (
      !(await getAcademicRepository().updateTopic({
        id: topicId,
        userId: user.id,
        ...parsed.data,
        description: parsed.data.description?.trim() || null,
        weekNumber: parsed.data.weekNumber ?? null,
        now: new Date().toISOString(),
      }))
    ) {
      throw new ApiError("TOPIC_NOT_FOUND", 404, "Topic not found.");
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
    const { topicId } = await context.params;
    if (!(await getAcademicRepository().deleteTopic(user.id, topicId))) {
      throw new ApiError(
        "TOPIC_IN_USE",
        409,
        "This topic has learning evidence and cannot be deleted.",
      );
    }
    return jsonOk({ deleted: true }, 200, { "x-request-id": id });
  } catch (error) {
    return errorResponse(error, id);
  }
}
