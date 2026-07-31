import { getAuthService, appEnvironment } from "@/src/application/runtime";
import {
  ApiError,
  errorResponse,
  requestId,
} from "@/src/lib/api-errors";
import { sessionCookie } from "@/src/lib/cookies";

export async function GET(request: Request): Promise<Response> {
  const id = requestId(request);
  try {
    const url = new URL(request.url);
    const token = url.searchParams.get("token");
    if (!token || token.length > 256) {
      throw new ApiError(
        "AUTH_LINK_INVALID",
        400,
        "This sign-in link is invalid or has expired.",
      );
    }

    const result = await getAuthService().verifyMagicLink(token);
    const destination = result.user.onboardingCompletedAt
      ? "/app/today"
      : "/onboarding";
    return new Response(null, {
      status: 303,
      headers: {
        Location: new URL(destination, request.url).toString(),
        "Set-Cookie": sessionCookie(
        result.sessionToken,
        result.expiresAt,
        appEnvironment() === "production",
        ),
        "x-request-id": id,
      },
    });
  } catch (error) {
    if (error instanceof ApiError) {
      const destination = new URL("/auth/verify", request.url);
      destination.searchParams.set("error", error.code);
      return Response.redirect(destination, 303);
    }
    return errorResponse(error, id);
  }
}
