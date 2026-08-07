import { getLearningRepository } from "@/src/application/runtime";
import { requireUserFromRequest } from "@/src/application/session";
import {
  ApiError,
  errorResponse,
  jsonOk,
  requestId,
} from "@/src/lib/api-errors";
import { assertSameOrigin } from "@/src/lib/request-security";
import { semesterInputSchema } from "@/src/lib/schemas";

interface RouteContext {
  params: Promise<{ semesterId: string }>;
}

export async function GET(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const id = requestId(request);
  try {
    const user = await requireUserFromRequest(request);
    const { semesterId } = await context.params;
    const semester = await getLearningRepository().findUserSemester(
      user.id,
      semesterId,
    );
    if (!semester) {
      throw new ApiError(
        "SEMESTER_NOT_FOUND",
        404,
        "Semester not found.",
      );
    }
    return jsonOk({ semester }, 200, { "x-request-id": id });
  } catch (error) {
    return errorResponse(error, id);
  }
}

export async function PATCH(
  request: Request,
  context: RouteContext,
): Promise<Response> {
  const id = requestId(request);
  try {
    assertSameOrigin(request);
    const user = await requireUserFromRequest(request);
    const { semesterId } = await context.params;
    const parsed = semesterInputSchema.safeParse(await request.json());
    if (!parsed.success) {
      throw new ApiError(
        "VALIDATION_ERROR",
        400,
        parsed.error.issues[0]?.message ?? "Check the semester details.",
      );
    }
    if (parsed.data.endDate < parsed.data.startDate) {
      throw new ApiError(
        "INVALID_SEMESTER_DATES",
        400,
        "Semester end date must be after its start date.",
      );
    }

    const repository = getLearningRepository();
    const current = await repository.findUserSemester(
      user.id,
      semesterId,
    );
    if (!current) {
      throw new ApiError(
        "SEMESTER_NOT_FOUND",
        404,
        "Semester not found.",
      );
    }
    if (
      parsed.data.institutionId &&
      !(await repository.institutionExists(parsed.data.institutionId))
    ) {
      throw new ApiError(
        "INSTITUTION_NOT_FOUND",
        404,
        "That institution is no longer available.",
      );
    }
    const activeId = await repository.activeSemesterId(user.id);
    if (
      parsed.data.status === "active" &&
      activeId &&
      activeId !== semesterId
    ) {
      throw new ApiError(
        "SEMESTER_LIMIT_REACHED",
        403,
        "Your current plan supports one active semester.",
      );
    }

    const updated = await repository.updateUserSemester(
      user.id,
      semesterId,
      {
        institutionId: parsed.data.institutionId ?? null,
        institutionName: parsed.data.institutionName,
        name: parsed.data.name,
        startDate: parsed.data.startDate,
        endDate: parsed.data.endDate,
        status: parsed.data.status,
        now: new Date().toISOString(),
      },
    );
    if (!updated) {
      throw new ApiError(
        "SEMESTER_NOT_FOUND",
        404,
        "Semester not found.",
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
    const { semesterId } = await context.params;
    const archived = await getLearningRepository().archiveUserSemester(
      user.id,
      semesterId,
      new Date().toISOString(),
    );
    if (!archived) {
      throw new ApiError(
        "SEMESTER_NOT_FOUND",
        404,
        "Semester not found.",
      );
    }
    return jsonOk({ archived: true }, 200, { "x-request-id": id });
  } catch (error) {
    return errorResponse(error, id);
  }
}
