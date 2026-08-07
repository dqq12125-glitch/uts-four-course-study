import { getAdminService } from "@/src/application/runtime";
import { requireAdminFromRequest } from "@/src/application/session";
import {
  ApiError,
  errorResponse,
  jsonOk,
  requestId,
} from "@/src/lib/api-errors";
import { assertSameOrigin } from "@/src/lib/request-security";
import { adminCourseTemplateCreateSchema } from "@/src/lib/schemas";

export async function POST(request: Request): Promise<Response> {
  const id = requestId(request);
  try {
    assertSameOrigin(request);
    const user = await requireAdminFromRequest(request);
    const parsed = adminCourseTemplateCreateSchema.safeParse(
      await request.json(),
    );
    if (!parsed.success) {
      throw new ApiError(
        "VALIDATION_ERROR",
        400,
        parsed.error.issues[0]?.message ?? "Check the template details.",
      );
    }
    const templateId = await getAdminService().createCourseTemplate({
      actorUserId: user.id,
      institutionId: parsed.data.institutionId?.trim() || null,
      courseCode: parsed.data.courseCode?.trim() || null,
      courseName: parsed.data.courseName,
      description: parsed.data.description?.trim() || null,
      defaultLanguage: parsed.data.defaultLanguage,
      colourKey: parsed.data.colourKey,
    });
    return jsonOk({ templateId }, 201, { "x-request-id": id });
  } catch (error) {
    return errorResponse(error, id);
  }
}
