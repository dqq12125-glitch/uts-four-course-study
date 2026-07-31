import {
  getLearningLoopRepository,
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
import { focusSessionStartSchema } from "@/src/lib/schemas";

export async function GET(request: Request): Promise<Response> {
  const id = requestId(request);
  try {
    const user = await requireUserFromRequest(request);
    const taskId = new URL(request.url).searchParams.get("taskId");
    const session =
      await getLearningLoopRepository().findActiveFocusSession(
        user.id,
        taskId,
      );
    return jsonOk({ session }, 200, { "x-request-id": id });
  } catch (error) {
    return errorResponse(error, id);
  }
}

export async function POST(request: Request): Promise<Response> {
  const id = requestId(request);
  try {
    assertSameOrigin(request);
    const user = await requireUserFromRequest(request);
    const parsed = focusSessionStartSchema.safeParse(
      await request.json().catch(() => null),
    );
    if (!parsed.success) {
      throw new ApiError(
        "VALIDATION_ERROR",
        400,
        parsed.error.issues[0]?.message ?? "Check the focus session.",
      );
    }
    const session = await getLearningLoopService().startFocusSession(
      user.id,
      parsed.data,
    );
    return jsonOk({ session }, 201, { "x-request-id": id });
  } catch (error) {
    return errorResponse(error, id);
  }
}
