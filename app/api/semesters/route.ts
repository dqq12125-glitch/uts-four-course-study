import { getLearningRepository } from "@/src/application/runtime";
import { requireUserFromRequest } from "@/src/application/session";
import {
  ApiError,
  errorResponse,
  jsonOk,
  requestId,
} from "@/src/lib/api-errors";
import { createId } from "@/src/lib/ids";
import { assertSameOrigin } from "@/src/lib/request-security";
import { semesterCreateSchema } from "@/src/lib/schemas";

export async function GET(request: Request): Promise<Response> {
  const id = requestId(request);
  try {
    const user = await requireUserFromRequest(request);
    return jsonOk(
      {
        semesters:
          await getLearningRepository().listUserSemesters(user.id),
      },
      200,
      { "x-request-id": id },
    );
  } catch (error) {
    return errorResponse(error, id);
  }
}

export async function POST(request: Request): Promise<Response> {
  const id = requestId(request);
  try {
    assertSameOrigin(request);
    const user = await requireUserFromRequest(request);
    const parsed = semesterCreateSchema.safeParse(await request.json());
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
    if (
      parsed.data.status === "active" &&
      (await repository.activeSemesterId(user.id))
    ) {
      throw new ApiError(
        "SEMESTER_LIMIT_REACHED",
        403,
        "Your current plan supports one active semester.",
      );
    }

    const semesterId = createId("semester");
    await repository.createUserSemester(user.id, {
      id: semesterId,
      institutionId: parsed.data.institutionId ?? null,
      institutionName: parsed.data.institutionName,
      name: parsed.data.name,
      startDate: parsed.data.startDate,
      endDate: parsed.data.endDate,
      status: parsed.data.status,
      now: new Date().toISOString(),
    });
    return jsonOk({ semesterId }, 201, { "x-request-id": id });
  } catch (error) {
    return errorResponse(error, id);
  }
}
