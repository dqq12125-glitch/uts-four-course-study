import { getAccountService } from "@/src/application/runtime";
import { requireUserFromRequest } from "@/src/application/session";
import {
  errorResponse,
  requestId,
} from "@/src/lib/api-errors";

export async function GET(request: Request): Promise<Response> {
  const id = requestId(request);
  try {
    const user = await requireUserFromRequest(request);
    const payload = await getAccountService().exportData(user.id);
    const date = new Date().toISOString().slice(0, 10);
    return new Response(JSON.stringify(payload, null, 2), {
      status: 200,
      headers: {
        "content-type": "application/json; charset=utf-8",
        "content-disposition": `attachment; filename="deepstudy-data-${date}.json"`,
        "cache-control": "private, no-store",
        "x-content-type-options": "nosniff",
        "x-request-id": id,
      },
    });
  } catch (error) {
    return errorResponse(error, id);
  }
}
