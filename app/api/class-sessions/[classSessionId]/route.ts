import { getAcademicRepository } from "@/src/application/runtime";
import { requireUserFromRequest } from "@/src/application/session";
import {
  ApiError,
  errorResponse,
  jsonOk,
  requestId,
} from "@/src/lib/api-errors";
import { assertSameOrigin } from "@/src/lib/request-security";
import { classSessionInputSchema } from "@/src/lib/schemas";

interface RouteContext {
  params: Promise<{ classSessionId: string }>;
}

export async function PATCH(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const id = requestId(request);
  try {
    assertSameOrigin(request);
    const user = await requireUserFromRequest(request);
    const parsed = classSessionInputSchema.safeParse(await request.json());
    if (!parsed.success) {
      throw new ApiError(
        "VALIDATION_ERROR",
        400,
        parsed.error.issues[0]?.message ?? "Check the class details.",
      );
    }
    const { classSessionId } = await context.params;
    const updated = await getAcademicRepository().updateClassSession({
      id: classSessionId,
      userId: user.id,
      ...parsed.data,
      location: parsed.data.location?.trim() || null,
      mapUrl: parsed.data.mapUrl ?? null,
      startDate: parsed.data.startDate ?? null,
      endDate: parsed.data.endDate ?? null,
      recurrenceRule: parsed.data.recurrenceRule?.trim() || null,
      now: new Date().toISOString(),
    });
    if (!updated) {
      throw new ApiError(
        "CLASS_SESSION_NOT_FOUND",
        404,
        "Class session not found.",
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
    const { classSessionId } = await context.params;
    if (
      !(await getAcademicRepository().deleteClassSession(
        user.id,
        classSessionId,
      ))
    ) {
      throw new ApiError(
        "CLASS_SESSION_NOT_FOUND",
        404,
        "Class session not found.",
      );
    }
    return jsonOk({ deleted: true }, 200, { "x-request-id": id });
  } catch (error) {
    return errorResponse(error, id);
  }
}
