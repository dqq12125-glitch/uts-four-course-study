import { z } from "zod";
import {
  getAnalyticsService,
  getLearningRepository,
} from "@/src/application/runtime";
import { requireUserFromRequest } from "@/src/application/session";
import {
  ApiError,
  errorResponse,
  jsonOk,
  requestId,
} from "@/src/lib/api-errors";
import { assertSameOrigin } from "@/src/lib/request-security";

const schema = z.object({
  status: z.enum(["active", "completed", "skipped"]),
});

export async function PATCH(
  request: Request,
  context: { params: Promise<{ taskId: string }> },
): Promise<Response> {
  const id = requestId(request);
  try {
    assertSameOrigin(request);
    const user = await requireUserFromRequest(request);
    const { taskId } = await context.params;
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) {
      throw new ApiError(
        "VALIDATION_ERROR",
        400,
        "Choose a valid task status.",
      );
    }
    const updated = await getLearningRepository().updateTaskStatus(
      user.id,
      taskId,
      parsed.data.status,
      new Date().toISOString(),
    );
    if (!updated) {
      throw new ApiError("TASK_NOT_FOUND", 404, "Study task not found.");
    }
    if (
      parsed.data.status === "active" ||
      parsed.data.status === "completed"
    ) {
      await getAnalyticsService().recordBestEffort(
        user.id,
        parsed.data.status === "active"
          ? "study_task_started"
          : "study_task_completed",
      );
    }
    return jsonOk({ updated: true }, 200, { "x-request-id": id });
  } catch (error) {
    return errorResponse(error, id);
  }
}
