import { getResourceService } from "@/src/application/runtime";
import { requireUserFromRequest } from "@/src/application/session";
import {
  errorResponse,
  requestId,
} from "@/src/lib/api-errors";

export async function GET(
  request: Request,
  context: { params: Promise<{ resourceId: string }> },
): Promise<Response> {
  const id = requestId(request);
  try {
    const user = await requireUserFromRequest(request);
    const { resourceId } = await context.params;
    const { resource, bytes } = await getResourceService().download(
      user.id,
      resourceId,
    );
    const fallback = resource.fileName.replace(/[^\x20-\x7e]/g, "_");
    const body = new Uint8Array(bytes).buffer as ArrayBuffer;
    return new Response(body, {
      status: 200,
      headers: {
        "content-type": resource.mimeType,
        "content-length": String(bytes.byteLength),
        "content-disposition": `attachment; filename="${fallback.replaceAll('"', "_")}"; filename*=UTF-8''${encodeURIComponent(resource.fileName)}`,
        "cache-control": "private, no-store",
        "x-content-type-options": "nosniff",
        "x-request-id": id,
      },
    });
  } catch (error) {
    return errorResponse(error, id);
  }
}
