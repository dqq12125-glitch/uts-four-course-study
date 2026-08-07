import {
  getAccountRepository,
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
import { studySettingsSchema } from "@/src/lib/schemas";

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
    const parsed = studySettingsSchema.safeParse(
      await request.json().catch(() => null),
    );
    if (!parsed.success) {
      throw new ApiError(
        "VALIDATION_ERROR",
        400,
        parsed.error.issues[0]?.message ?? "Check the study settings.",
      );
    }
    const updated = await getAccountRepository().updateStudySettings({
      userId: user.id,
      ...parsed.data,
      now: new Date().toISOString(),
    });
    if (!updated) {
      throw new ApiError(
        "ACCOUNT_NOT_FOUND",
        404,
        "The account was not found.",
      );
    }
    return jsonOk({ updated: true }, 200, { "x-request-id": id });
  } catch (error) {
    return errorResponse(error, id);
  }
}
