import {
  getLearningLoopRepository,
  getLearningLoopService,
} from "@/src/application/runtime";
import { requireUserFromRequest } from "@/src/application/session";
import { errorResponse, jsonOk, requestId } from "@/src/lib/api-errors";

export async function GET(request: Request): Promise<Response> {
  const id = requestId(request);
  try {
    const user = await requireUserFromRequest(request);
    const repository = getLearningLoopRepository();
    const [courses, active] = await Promise.all([
      repository.listPracticeCourses(user.id),
      repository.findActivePracticeSession(user.id),
    ]);
    const activeSession = active
      ? await getLearningLoopService().getPracticeSession(
          user.id,
          active.sessionId,
        )
      : null;
    return jsonOk(
      { courses, activeSession },
      200,
      {
        "Cache-Control": "no-store",
        "x-request-id": id,
      },
    );
  } catch (error) {
    return errorResponse(error, id);
  }
}
