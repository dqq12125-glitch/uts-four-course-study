import { getBillingService } from "@/src/application/runtime";
import { requireUserFromRequest } from "@/src/application/session";
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
    const user = await requireUserFromRequest(request);
    const portal = await getBillingService().createPortal(user.id);
    return jsonOk(portal, 201, { "x-request-id": id });
  } catch (error) {
    return errorResponse(error, id);
  }
}
