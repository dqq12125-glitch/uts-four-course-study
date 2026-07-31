import { getAdminService } from "@/src/application/runtime";
import { requireAdminFromRequest } from "@/src/application/session";
import {
  ApiError,
  errorResponse,
  jsonOk,
  requestId,
} from "@/src/lib/api-errors";
import { assertSameOrigin } from "@/src/lib/request-security";
import { adminPublicQuestionSchema } from "@/src/lib/schemas";

export async function POST(request: Request): Promise<Response> {
  const id = requestId(request);
  try {
    assertSameOrigin(request);
    const user = await requireAdminFromRequest(request);
    const parsed = adminPublicQuestionSchema.safeParse(await request.json());
    if (!parsed.success) {
      throw new ApiError(
        "VALIDATION_ERROR",
        400,
        parsed.error.issues[0]?.message ?? "Check the question details.",
      );
    }
    const questionId = await getAdminService().createPublicQuestion({
      actorUserId: user.id,
      ...parsed.data,
      hint1: parsed.data.hint1?.trim() || null,
      hint2: parsed.data.hint2?.trim() || null,
      hint3: parsed.data.hint3?.trim() || null,
    });
    return jsonOk({ questionId }, 201, { "x-request-id": id });
  } catch (error) {
    return errorResponse(error, id);
  }
}
