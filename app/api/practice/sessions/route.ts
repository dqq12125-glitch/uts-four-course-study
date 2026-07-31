import {
  getAnalyticsService,
  getLearningLoopService,
} from "@/src/application/runtime";
import { requireUserFromRequest } from "@/src/application/session";
import {
  ApiError,
  errorResponse,
  jsonOk,
  requestId,
} from "@/src/lib/api-errors";
import { assertSameOrigin } from "@/src/lib/request-security";
import { practiceSessionStartSchema } from "@/src/lib/schemas";

export async function POST(request: Request): Promise<Response> {
  const id = requestId(request);
  try {
    assertSameOrigin(request);
    const user = await requireUserFromRequest(request);
    const parsed = practiceSessionStartSchema.safeParse(
      await request.json().catch(() => null),
    );
    if (!parsed.success) {
      throw new ApiError(
        "VALIDATION_ERROR",
        400,
        parsed.error.issues[0]?.message ?? "Check the practice session.",
      );
    }
    const result = await getLearningLoopService().startPracticeSession(
      user.id,
      parsed.data,
    );
    if (!result.resumed) {
      await getAnalyticsService().recordBestEffort(
        user.id,
        "practice_started",
      );
    }
    return jsonOk(result, result.resumed ? 200 : 201, {
      "x-request-id": id,
    });
  } catch (error) {
    return errorResponse(error, id);
  }
}
