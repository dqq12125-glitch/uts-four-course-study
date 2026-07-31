import { OnboardingService } from "@/src/application/onboarding-service";
import { getLearningRepository } from "@/src/application/runtime";
import { requireUserFromRequest } from "@/src/application/session";
import {
  ApiError,
  errorResponse,
  jsonOk,
  requestId,
} from "@/src/lib/api-errors";
import { assertSameOrigin } from "@/src/lib/request-security";
import { onboardingInputSchema } from "@/src/lib/schemas";

export async function POST(request: Request): Promise<Response> {
  const id = requestId(request);
  try {
    assertSameOrigin(request);
    const user = await requireUserFromRequest(request);
    const parsed = onboardingInputSchema.safeParse(await request.json());
    if (!parsed.success) {
      throw new ApiError(
        "VALIDATION_ERROR",
        400,
        parsed.error.issues[0]?.message ?? "Please check your details.",
      );
    }

    const result = await new OnboardingService(
      getLearningRepository(),
    ).complete(user.id, parsed.data);
    return jsonOk(result, 201, { "x-request-id": id });
  } catch (error) {
    return errorResponse(error, id);
  }
}
