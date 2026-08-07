import {
  appEnvironment,
  getAccountService,
} from "@/src/application/runtime";
import { requireUserFromRequest } from "@/src/application/session";
import {
  ApiError,
  errorResponse,
  jsonOk,
  requestId,
} from "@/src/lib/api-errors";
import { expiredSessionCookie } from "@/src/lib/cookies";
import { assertSameOrigin } from "@/src/lib/request-security";
import { accountDeletionSchema } from "@/src/lib/schemas";

export async function DELETE(request: Request): Promise<Response> {
  const id = requestId(request);
  try {
    assertSameOrigin(request);
    const user = await requireUserFromRequest(request);
    const parsed = accountDeletionSchema.safeParse(
      await request.json().catch(() => null),
    );
    if (!parsed.success) {
      throw new ApiError(
        "ACCOUNT_DELETE_CONFIRMATION_INVALID",
        400,
        "Type DELETE to confirm account deletion.",
      );
    }
    await getAccountService().deleteAccount(
      user.id,
      parsed.data.confirmation,
    );
    return jsonOk(
      { deleted: true },
      200,
      {
        "Set-Cookie": expiredSessionCookie(
          appEnvironment() === "production",
        ),
        "x-request-id": id,
      },
    );
  } catch (error) {
    return errorResponse(error, id);
  }
}
