import { getLearningRepository } from "@/src/application/runtime";
import { errorResponse, jsonOk, requestId } from "@/src/lib/api-errors";

export async function GET(request: Request): Promise<Response> {
  const id = requestId(request);
  try {
    const templates = await getLearningRepository().listCourseTemplates();
    return jsonOk({ templates }, 200, { "x-request-id": id });
  } catch (error) {
    return errorResponse(error, id);
  }
}
