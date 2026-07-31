import { getAcademicService } from "@/src/application/runtime";
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
    return jsonOk(
      await getAcademicService().weeklyReport({
        userId: user.id,
        role: user.role,
      }),
      200,
      { "Cache-Control": "no-store", "x-request-id": id },
    );
  } catch (error) {
    return errorResponse(error, id);
  }
}
