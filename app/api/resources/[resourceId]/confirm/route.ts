import { getResourceService } from "@/src/application/runtime";
import { requireUserFromRequest } from "@/src/application/session";
import {
  ApiError,
  errorResponse,
  jsonOk,
  requestId,
} from "@/src/lib/api-errors";
import { assertSameOrigin } from "@/src/lib/request-security";
import { resourceConfirmationSchema } from "@/src/lib/schemas";

export async function POST(
  request: Request,
  context: { params: Promise<{ resourceId: string }> },
): Promise<Response> {
  const id = requestId(request);
  try {
    assertSameOrigin(request);
    const user = await requireUserFromRequest(request);
    const parsed = resourceConfirmationSchema.safeParse(
      await request.json().catch(() => null),
    );
    if (!parsed.success) {
      throw new ApiError(
        "VALIDATION_ERROR",
        400,
        parsed.error.issues[0]?.message ?? "Check the selected items.",
      );
    }
    const { resourceId } = await context.params;
    const result = await getResourceService().confirm({
      userId: user.id,
      resourceId,
      timezone: user.timezone,
      ...parsed.data,
    });
    return jsonOk(result, 201, { "x-request-id": id });
  } catch (error) {
    return errorResponse(error, id);
  }
}
