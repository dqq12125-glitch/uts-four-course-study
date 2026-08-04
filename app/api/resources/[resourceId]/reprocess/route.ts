import { getResourceService } from "@/src/application/runtime";
import { resourceDto } from "@/src/application/resource-dto";
import { requireUserFromRequest } from "@/src/application/session";
import { errorResponse, jsonOk, requestId } from "@/src/lib/api-errors";
import { assertSameOrigin } from "@/src/lib/request-security";

export async function POST(
  request: Request,
  context: { params: Promise<{ resourceId: string }> },
): Promise<Response> {
  const id = requestId(request);
  try {
    assertSameOrigin(request);
    const user = await requireUserFromRequest(request);
    const { resourceId } = await context.params;
    const resource = await getResourceService().retryProcessing({
      userId: user.id,
      resourceId,
      language: user.preferredLanguage,
      timezone: user.timezone,
    });
    return jsonOk(
      { resource: resourceDto(resource, true) },
      200,
      { "x-request-id": id },
    );
  } catch (error) {
    return errorResponse(error, id);
  }
}
