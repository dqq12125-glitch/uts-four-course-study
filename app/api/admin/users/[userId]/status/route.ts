import { getAdminService } from "@/src/application/runtime";
import { requireAdminFromRequest } from "@/src/application/session";
import {
  ApiError,
  errorResponse,
  jsonOk,
  requestId,
} from "@/src/lib/api-errors";
import { assertSameOrigin } from "@/src/lib/request-security";
import { adminUserStatusSchema } from "@/src/lib/schemas";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ userId: string }> },
): Promise<Response> {
  const id = requestId(request);
  try {
    assertSameOrigin(request);
    const admin = await requireAdminFromRequest(request);
    const parsed = adminUserStatusSchema.safeParse(
      await request.json().catch(() => null),
    );
    if (!parsed.success) {
      throw new ApiError(
        "VALIDATION_ERROR",
        400,
        parsed.error.issues[0]?.message ?? "Check the account status.",
      );
    }
    const { userId } = await context.params;
    await getAdminService().updateUserStatus({
      actorUserId: admin.id,
      targetUserId: userId,
      status: parsed.data.status,
    });
    return jsonOk({ updated: true }, 200, { "x-request-id": id });
  } catch (error) {
    return errorResponse(error, id);
  }
}
