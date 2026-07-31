import { getAnalyticsService } from "@/src/application/runtime";
import { requireUserFromRequest } from "@/src/application/session";
import {
  ApiError,
  errorResponse,
  jsonOk,
  requestId,
} from "@/src/lib/api-errors";
import { assertSameOrigin } from "@/src/lib/request-security";
import { clientAnalyticsEventSchema } from "@/src/lib/schemas";

export async function POST(request: Request): Promise<Response> {
  const id = requestId(request);
  try {
    assertSameOrigin(request);
    const user = await requireUserFromRequest(request);
    const parsed = clientAnalyticsEventSchema.safeParse(
      await request.json().catch(() => null),
    );
    if (!parsed.success) {
      throw new ApiError(
        "VALIDATION_ERROR",
        400,
        parsed.error.issues[0]?.message ?? "Check the event.",
      );
    }
    await getAnalyticsService().recordClient(
      user.id,
      parsed.data.eventName,
      parsed.data.properties,
    );
    return jsonOk({ recorded: true }, 202, { "x-request-id": id });
  } catch (error) {
    return errorResponse(error, id);
  }
}
