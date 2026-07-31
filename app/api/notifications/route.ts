import { getNotificationService } from "@/src/application/runtime";
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
    const notifications = await getNotificationService().list(user.id);
    return jsonOk({ notifications }, 200, { "x-request-id": id });
  } catch (error) {
    return errorResponse(error, id);
  }
}
