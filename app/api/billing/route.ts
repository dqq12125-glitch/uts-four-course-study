import { getBillingService } from "@/src/application/runtime";
import { requireUserFromRequest } from "@/src/application/session";
import {
  errorResponse,
  jsonOk,
  requestId,
} from "@/src/lib/api-errors";

export async function GET(request: Request): Promise<Response> {
  const id = requestId(request);
  try {
    const user = await requireUserFromRequest(request);
    const overview = await getBillingService().overview(
      user.id,
      user.role,
    );
    return jsonOk(overview, 200, { "x-request-id": id });
  } catch (error) {
    return errorResponse(error, id);
  }
}
