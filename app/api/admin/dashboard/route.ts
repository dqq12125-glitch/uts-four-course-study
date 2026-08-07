import {
  getAdminService,
  getFeatureFlagService,
} from "@/src/application/runtime";
import { requireAdminFromRequest } from "@/src/application/session";
import {
  errorResponse,
  jsonOk,
  requestId,
} from "@/src/lib/api-errors";

export async function GET(request: Request): Promise<Response> {
  const id = requestId(request);
  try {
    await requireAdminFromRequest(request);
    await getFeatureFlagService().require("admin_dashboard_enabled");
    const dashboard = await getAdminService().dashboard();
    return jsonOk(dashboard, 200, { "x-request-id": id });
  } catch (error) {
    return errorResponse(error, id);
  }
}
