import { getAdminService } from "@/src/application/runtime";
import { requireAdminFromRequest } from "@/src/application/session";
import {
  ApiError,
  errorResponse,
  jsonOk,
  requestId,
} from "@/src/lib/api-errors";
import { assertSameOrigin } from "@/src/lib/request-security";
import { adminQuestionReviewSchema } from "@/src/lib/schemas";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ questionId: string }> },
): Promise<Response> {
  const id = requestId(request);
  try {
    assertSameOrigin(request);
    const admin = await requireAdminFromRequest(request);
    const parsed = adminQuestionReviewSchema.safeParse(
      await request.json().catch(() => null),
    );
    if (!parsed.success) {
      throw new ApiError(
        "VALIDATION_ERROR",
        400,
        parsed.error.issues[0]?.message ?? "Check the review status.",
      );
    }
    const { questionId } = await context.params;
    await getAdminService().updateQuestionReview({
      actorUserId: admin.id,
      id: questionId,
      reviewStatus: parsed.data.reviewStatus,
    });
    return jsonOk({ updated: true }, 200, { "x-request-id": id });
  } catch (error) {
    return errorResponse(error, id);
  }
}
