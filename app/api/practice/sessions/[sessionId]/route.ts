import { getLearningLoopService } from "@/src/application/runtime";
import { requireUserFromRequest } from "@/src/application/session";
import {
  errorResponse,
  jsonOk,
  requestId,
} from "@/src/lib/api-errors";

export async function GET(
  request: Request,
  context: { params: Promise<{ sessionId: string }> },
): Promise<Response> {
  const id = requestId(request);
  try {
    const user = await requireUserFromRequest(request);
    const { sessionId } = await context.params;
    const session = await getLearningLoopService().getPracticeSession(
      user.id,
      sessionId,
    );
    return jsonOk({ session }, 200, { "x-request-id": id });
  } catch (error) {
    return errorResponse(error, id);
  }
}
