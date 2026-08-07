import { getResourceService } from "@/src/application/runtime";
import { requireUserFromRequest } from "@/src/application/session";
import { errorResponse, jsonOk, requestId } from "@/src/lib/api-errors";

export async function GET(
  request: Request,
  context: { params: Promise<{ resourceId: string }> },
): Promise<Response> {
  const id = requestId(request);
  try {
    const user = await requireUserFromRequest(request);
    const { resourceId } = await context.params;
    const resource = await getResourceService().detail(user.id, resourceId);
    return jsonOk(
      {
        resourceId: resource.id,
        processingStatus: resource.processingStatus,
        failureCode: resource.failureCode,
        ingestion: resource.ingestion ?? null,
      },
      200,
      { "x-request-id": id },
    );
  } catch (error) {
    return errorResponse(error, id);
  }
}
