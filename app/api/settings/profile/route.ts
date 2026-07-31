import {
  getAccountService,
} from "@/src/application/runtime";
import { requireUserFromRequest } from "@/src/application/session";
import {
  ApiError,
  errorResponse,
  jsonOk,
  requestId,
} from "@/src/lib/api-errors";
import { assertSameOrigin } from "@/src/lib/request-security";
import { profileSettingsSchema } from "@/src/lib/schemas";

export async function GET(request: Request): Promise<Response> {
  const id = requestId(request);
  try {
    const user = await requireUserFromRequest(request);
    const settings = await getAccountService().settings(user.id);
    return jsonOk({ settings }, 200, { "x-request-id": id });
  } catch (error) {
    return errorResponse(error, id);
  }
}

export async function PATCH(request: Request): Promise<Response> {
  const id = requestId(request);
  try {
    assertSameOrigin(request);
    const user = await requireUserFromRequest(request);
    const parsed = profileSettingsSchema.safeParse(
      await request.json().catch(() => null),
    );
    if (!parsed.success) {
      throw new ApiError(
        "VALIDATION_ERROR",
        400,
        parsed.error.issues[0]?.message ?? "Check the profile details.",
      );
    }
    await getAccountService().updateProfile({
      userId: user.id,
      displayName: parsed.data.displayName ?? null,
      preferredLanguage: parsed.data.preferredLanguage,
      timezone: parsed.data.timezone,
    });
    return jsonOk({ updated: true }, 200, { "x-request-id": id });
  } catch (error) {
    return errorResponse(error, id);
  }
}
