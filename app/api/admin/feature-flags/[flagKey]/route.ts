import { getAdminService } from "@/src/application/runtime";
import { requireAdminFromRequest } from "@/src/application/session";
import {
  ApiError,
  errorResponse,
  jsonOk,
  requestId,
} from "@/src/lib/api-errors";
import { assertSameOrigin } from "@/src/lib/request-security";
import { adminFeatureFlagSchema } from "@/src/lib/schemas";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ flagKey: string }> },
): Promise<Response> {
  const id = requestId(request);
  try {
    assertSameOrigin(request);
    const admin = await requireAdminFromRequest(request);
    const parsed = adminFeatureFlagSchema.safeParse(
      await request.json().catch(() => null),
    );
    if (!parsed.success) {
      throw new ApiError(
        "VALIDATION_ERROR",
        400,
        parsed.error.issues[0]?.message ?? "Check the feature flag.",
      );
    }
    const { flagKey } = await context.params;
    await getAdminService().setFeatureFlag({
      actorUserId: admin.id,
      key: flagKey,
      enabled: parsed.data.enabled,
    });
    return jsonOk({ updated: true }, 200, { "x-request-id": id });
  } catch (error) {
    return errorResponse(error, id);
  }
}
