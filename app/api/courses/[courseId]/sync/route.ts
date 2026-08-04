import { getCourseSyncService } from "@/src/application/runtime";
import { requireUserFromRequest } from "@/src/application/session";
import { errorResponse, jsonOk, requestId } from "@/src/lib/api-errors";
import { assertSameOrigin } from "@/src/lib/request-security";

export async function POST(
  request: Request,
  context: { params: Promise<{ courseId: string }> },
): Promise<Response> {
  const id = requestId(request);
  try {
    assertSameOrigin(request);
    const user = await requireUserFromRequest(request);
    const { courseId } = await context.params;
    const result = await getCourseSyncService().sync({
      userId: user.id,
      role: user.role,
      courseId,
      language: user.preferredLanguage,
      timezone: user.timezone,
    });
    return jsonOk(result, 200, { "x-request-id": id });
  } catch (error) {
    return errorResponse(error, id);
  }
}
