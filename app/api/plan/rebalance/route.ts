import {
  getLearningRepository,
  getPlanRebalanceService,
} from "@/src/application/runtime";
import { requireUserFromRequest } from "@/src/application/session";
import {
  ApiError,
  errorResponse,
  jsonOk,
  requestId,
} from "@/src/lib/api-errors";
import { assertSameOrigin } from "@/src/lib/request-security";
import { planRebalanceSchema } from "@/src/lib/schemas";
import { localDateKey } from "@/src/lib/timezone";

export async function POST(request: Request): Promise<Response> {
  const id = requestId(request);
  try {
    assertSameOrigin(request);
    const user = await requireUserFromRequest(request);
    const parsed = planRebalanceSchema.safeParse(
      await request.json().catch(() => ({})),
    );
    if (!parsed.success) {
      throw new ApiError(
        "VALIDATION_ERROR",
        400,
        parsed.error.issues[0]?.message ?? "Check the rebalance request.",
      );
    }
    const result = await getPlanRebalanceService().rebalance(user.id, {
      startDate: localDateKey(new Date(), user.timezone),
      dailyCapacityMinutes:
        await getLearningRepository().dailyStudyMinutes(user.id),
      confirmCritical: parsed.data.confirmCritical,
    });
    return jsonOk(result, 200, { "x-request-id": id });
  } catch (error) {
    return errorResponse(error, id);
  }
}
