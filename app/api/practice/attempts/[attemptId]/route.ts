import { getLearningLoopService } from "@/src/application/runtime";
import { requireUserFromRequest } from "@/src/application/session";
import {
  ApiError,
  errorResponse,
  jsonOk,
  requestId,
} from "@/src/lib/api-errors";
import { assertSameOrigin } from "@/src/lib/request-security";
import { practiceAttemptMetadataSchema } from "@/src/lib/schemas";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ attemptId: string }> },
): Promise<Response> {
  const id = requestId(request);
  try {
    assertSameOrigin(request);
    const user = await requireUserFromRequest(request);
    const { attemptId } = await context.params;
    const parsed = practiceAttemptMetadataSchema.safeParse(
      await request.json().catch(() => null),
    );
    if (!parsed.success) {
      throw new ApiError(
        "VALIDATION_ERROR",
        400,
        parsed.error.issues[0]?.message ?? "Check the attempt reflection.",
      );
    }
    await getLearningLoopService().updateAttemptMetadata(
      user.id,
      attemptId,
      parsed.data,
    );
    return jsonOk({ updated: true }, 200, { "x-request-id": id });
  } catch (error) {
    return errorResponse(error, id);
  }
}
