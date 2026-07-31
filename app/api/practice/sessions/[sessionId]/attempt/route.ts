import { getLearningLoopService } from "@/src/application/runtime";
import { requireUserFromRequest } from "@/src/application/session";
import {
  ApiError,
  errorResponse,
  jsonOk,
  requestId,
} from "@/src/lib/api-errors";
import { assertSameOrigin } from "@/src/lib/request-security";
import { practiceAttemptSubmitSchema } from "@/src/lib/schemas";

export async function POST(
  request: Request,
  context: { params: Promise<{ sessionId: string }> },
): Promise<Response> {
  const id = requestId(request);
  try {
    assertSameOrigin(request);
    const user = await requireUserFromRequest(request);
    const { sessionId } = await context.params;
    const parsed = practiceAttemptSubmitSchema.safeParse(
      await request.json().catch(() => null),
    );
    if (!parsed.success) {
      throw new ApiError(
        "VALIDATION_ERROR",
        400,
        parsed.error.issues[0]?.message ?? "Enter an answer.",
      );
    }
    const result = await getLearningLoopService().submitAttempt(
      user.id,
      sessionId,
      parsed.data.answer,
      user.timezone,
    );
    return jsonOk(result, result.retryAllowed ? 200 : 201, {
      "x-request-id": id,
    });
  } catch (error) {
    return errorResponse(error, id);
  }
}
