import { getAdminService } from "@/src/application/runtime";
import { requireAdminFromRequest } from "@/src/application/session";
import {
  ApiError,
  errorResponse,
  jsonOk,
  requestId,
} from "@/src/lib/api-errors";
import { assertSameOrigin } from "@/src/lib/request-security";
import { adminCourseTemplateSchema } from "@/src/lib/schemas";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ templateId: string }> },
): Promise<Response> {
  const id = requestId(request);
  try {
    assertSameOrigin(request);
    const admin = await requireAdminFromRequest(request);
    const parsed = adminCourseTemplateSchema.safeParse(
      await request.json().catch(() => null),
    );
    if (!parsed.success) {
      throw new ApiError(
        "VALIDATION_ERROR",
        400,
        parsed.error.issues[0]?.message ?? "Check the course template.",
      );
    }
    const { templateId } = await context.params;
    await getAdminService().updateCourseTemplate({
      actorUserId: admin.id,
      id: templateId,
      courseCode: parsed.data.courseCode?.trim() || null,
      courseName: parsed.data.courseName,
      description: parsed.data.description?.trim() || null,
      defaultLanguage: parsed.data.defaultLanguage,
      isActive: parsed.data.isActive,
    });
    return jsonOk({ updated: true }, 200, { "x-request-id": id });
  } catch (error) {
    return errorResponse(error, id);
  }
}
