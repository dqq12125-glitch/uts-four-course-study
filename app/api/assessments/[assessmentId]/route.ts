import { getLearningRepository } from "@/src/application/runtime";
import { requireUserFromRequest } from "@/src/application/session";
import {
  ApiError,
  errorResponse,
  jsonOk,
  requestId,
} from "@/src/lib/api-errors";
import { assertSameOrigin } from "@/src/lib/request-security";
import { assessmentInputSchema } from "@/src/lib/schemas";
import { zonedDateTimeToUtc } from "@/src/lib/timezone";

interface RouteContext {
  params: Promise<{ assessmentId: string }>;
}

export async function PATCH(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const id = requestId(request);
  try {
    assertSameOrigin(request);
    const user = await requireUserFromRequest(request);
    const { assessmentId } = await context.params;
    const parsed = assessmentInputSchema.safeParse(await request.json());
    if (!parsed.success) {
      throw new ApiError(
        "VALIDATION_ERROR",
        400,
        parsed.error.issues[0]?.message ?? "Check the assessment details.",
      );
    }
    const dueAt = parsed.data.dueAt
      ? new Date(parsed.data.dueAt).toISOString()
      : parsed.data.dueLocal
        ? zonedDateTimeToUtc(
            parsed.data.dueLocal,
            user.timezone,
          ).toISOString()
        : null;
    const updated = await getLearningRepository().updateAssessment(
      user.id,
      assessmentId,
      {
        title: parsed.data.title,
        assessmentType: parsed.data.assessmentType,
        dueAt,
        weightPercent: parsed.data.weightPercent ?? null,
        estimatedMinutes: parsed.data.estimatedMinutes ?? null,
        status: parsed.data.status ?? "not_started",
        notes: parsed.data.notes?.trim() || null,
        now: new Date().toISOString(),
      },
    );
    if (!updated) {
      throw new ApiError(
        "ASSESSMENT_NOT_FOUND",
        404,
        "Assessment not found.",
      );
    }
    return jsonOk({ updated: true }, 200, { "x-request-id": id });
  } catch (error) {
    return errorResponse(error, id);
  }
}

export async function DELETE(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const id = requestId(request);
  try {
    assertSameOrigin(request);
    const user = await requireUserFromRequest(request);
    const { assessmentId } = await context.params;
    const deleted = await getLearningRepository().deleteAssessment(
      user.id,
      assessmentId,
    );
    if (!deleted) {
      throw new ApiError(
        "ASSESSMENT_NOT_FOUND",
        404,
        "Assessment not found.",
      );
    }
    return jsonOk({ deleted: true }, 200, { "x-request-id": id });
  } catch (error) {
    return errorResponse(error, id);
  }
}
