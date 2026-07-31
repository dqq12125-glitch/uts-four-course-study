import { getResourceService } from "@/src/application/runtime";
import { resourceDto } from "@/src/application/resource-dto";
import { requireUserFromRequest } from "@/src/application/session";
import {
  ApiError,
  errorResponse,
  jsonOk,
  requestId,
} from "@/src/lib/api-errors";
import { assertSameOrigin } from "@/src/lib/request-security";
import {
  resourceTextUploadSchema,
  resourceTypeSchema,
} from "@/src/lib/schemas";
import { MAX_UPLOAD_BYTES } from "@/src/services/resources/file-validation";

export async function GET(request: Request): Promise<Response> {
  const id = requestId(request);
  try {
    const user = await requireUserFromRequest(request);
    const resources = await getResourceService().list(user.id);
    return jsonOk(
      { resources: resources.map((resource) => resourceDto(resource)) },
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
    if (
      request.headers
        .get("content-type")
        ?.toLowerCase()
        .includes("application/json")
    ) {
      const parsed = resourceTextUploadSchema.safeParse(
        await request.json().catch(() => null),
      );
      if (!parsed.success) {
        throw new ApiError(
          "VALIDATION_ERROR",
          400,
          parsed.error.issues[0]?.message ??
            "Check the pasted resource text.",
        );
      }
      const resource = await getResourceService().upload({
        userId: user.id,
        role: user.role,
        courseId: parsed.data.courseId,
        fileName:
          parsed.data.fileName ??
          `timetable-paste-${new Date().toISOString().slice(0, 10)}.txt`,
        mimeType: "text/plain",
        bytes: new TextEncoder().encode(parsed.data.text),
        resourceType: parsed.data.resourceType,
        language: user.preferredLanguage,
        timezone: user.timezone,
      });
      return jsonOk(
        { resource: resourceDto(resource, true) },
        201,
        { "x-request-id": id },
      );
    }
    const contentLength = Number(request.headers.get("content-length") ?? 0);
    if (contentLength > MAX_UPLOAD_BYTES + 512_000) {
      throw new ApiError(
        "UPLOAD_SIZE_INVALID",
        413,
        "Files must be no larger than 10 MB.",
      );
    }
    const form = await request.formData();
    const file = form.get("file");
    const courseId = form.get("courseId");
    const parsedType = resourceTypeSchema.safeParse(
      form.get("resourceType"),
    );
    if (
      !(file instanceof File) ||
      typeof courseId !== "string" ||
      !courseId.trim() ||
      !parsedType.success
    ) {
      throw new ApiError(
        "VALIDATION_ERROR",
        400,
        "Choose a course, resource type, and file.",
      );
    }
    const bytes = new Uint8Array(await file.arrayBuffer());
    const resource = await getResourceService().upload({
      userId: user.id,
      role: user.role,
      courseId: courseId.trim(),
      fileName: file.name,
      mimeType: file.type,
      bytes,
      resourceType: parsedType.data,
      language: user.preferredLanguage,
      timezone: user.timezone,
    });
    return jsonOk(
      { resource: resourceDto(resource, true) },
      201,
      { "x-request-id": id },
    );
  } catch (error) {
    return errorResponse(error, id);
  }
}
