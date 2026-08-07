import {
  getAcademicService,
} from "@/src/application/runtime";
import { requireUserFromRequest } from "@/src/application/session";
import {
  ApiError,
  errorResponse,
  jsonOk,
  requestId,
} from "@/src/lib/api-errors";
import { assertSameOrigin } from "@/src/lib/request-security";
import { customStudyTaskSchema } from "@/src/lib/schemas";

export async function POST(request: Request): Promise<Response> {
  const id = requestId(request);
  try {
    assertSameOrigin(request);
    const user = await requireUserFromRequest(request);
    const parsed = customStudyTaskSchema.safeParse(await request.json());
    if (!parsed.success) {
      throw new ApiError(
        "VALIDATION_ERROR",
        400,
        parsed.error.issues[0]?.message ?? "Check the task details.",
      );
    }
    const taskId = await getAcademicService().createTask({
      userId: user.id,
      courseId: parsed.data.courseId ?? null,
      topicId: parsed.data.topicId ?? null,
      assessmentId: parsed.data.assessmentId ?? null,
      title: parsed.data.title,
      description: parsed.data.description?.trim() || null,
      completionCriteria: parsed.data.completionCriteria,
      taskType: parsed.data.taskType,
      priority: parsed.data.priority,
      estimatedMinutes: parsed.data.estimatedMinutes,
      scheduledFor: parsed.data.scheduledFor,
      dueAt: parsed.data.dueAt
        ? new Date(parsed.data.dueAt).toISOString()
        : null,
    });
    return jsonOk({ taskId }, 201, { "x-request-id": id });
  } catch (error) {
    return errorResponse(error, id);
  }
}
