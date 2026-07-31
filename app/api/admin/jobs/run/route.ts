import { getScheduledJobService } from "@/src/application/runtime";
import { requireAdminFromRequest } from "@/src/application/session";
import {
  errorResponse,
  jsonOk,
  requestId,
} from "@/src/lib/api-errors";
import { assertSameOrigin } from "@/src/lib/request-security";

export async function POST(request: Request): Promise<Response> {
  const id = requestId(request);
  try {
    assertSameOrigin(request);
    await requireAdminFromRequest(request);
    const result = await getScheduledJobService().run(Date.now());
    return jsonOk(result, 200, { "x-request-id": id });
  } catch (error) {
    return errorResponse(error, id);
  }
}
