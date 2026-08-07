import { getLearningLoopService } from "@/src/application/runtime";
import { requireUserFromRequest } from "@/src/application/session";
import {
  ApiError,
  errorResponse,
  jsonOk,
  requestId,
} from "@/src/lib/api-errors";
import { assertSameOrigin } from "@/src/lib/request-security";
import { privatePracticeQuestionSchema } from "@/src/lib/schemas";

export async function POST(request: Request): Promise<Response> {
  const id = requestId(request);
  try {
    assertSameOrigin(request);
    const user = await requireUserFromRequest(request);
    const parsed = privatePracticeQuestionSchema.safeParse(
      await request.json().catch(() => null),
    );
    if (!parsed.success) {
      throw new ApiError(
        "VALIDATION_ERROR",
        400,
        parsed.error.issues[0]?.message ?? "Check the practice question.",
      );
    }
    const result = await getLearningLoopService().createPrivateQuestion(
      user.id,
      parsed.data,
    );
    return jsonOk(result, 201, { "x-request-id": id });
  } catch (error) {
    return errorResponse(error, id);
  }
}
