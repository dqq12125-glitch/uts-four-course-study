import { currentUserFromRequest } from "@/src/application/session";
import { errorResponse, jsonOk, requestId } from "@/src/lib/api-errors";

export async function GET(request: Request): Promise<Response> {
  const id = requestId(request);
  try {
    const user = await currentUserFromRequest(request);
    return jsonOk(
      {
        user: user
          ? {
              id: user.id,
              email: user.email,
              displayName: user.displayName,
              preferredLanguage: user.preferredLanguage,
              timezone: user.timezone,
              onboardingCompleted:
                user.onboardingCompletedAt !== null,
            }
          : null,
      },
      200,
      { "x-request-id": id },
    );
  } catch (error) {
    return errorResponse(error, id);
  }
}
