import { getLearningLoopService } from "@/src/application/runtime";
import { requireUserFromRequest } from "@/src/application/session";
import {
  errorResponse,
  jsonOk,
  requestId,
} from "@/src/lib/api-errors";
import { assertSameOrigin } from "@/src/lib/request-security";

export async function POST(
  request: Request,
  context: { params: Promise<{ sessionId: string }> },
): Promise<Response> {
  const id = requestId(request);
  try {
    assertSameOrigin(request);
    const user = await requireUserFromRequest(request);
    const { sessionId } = await context.params;
    const result = await getLearningLoopService().requestHint(
      user.id,
      sessionId,
    );
    return jsonOk(result, 200, { "x-request-id": id });
  } catch (error) {
    return errorResponse(error, id);
  }
}
