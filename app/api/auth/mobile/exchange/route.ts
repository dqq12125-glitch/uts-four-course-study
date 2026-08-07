import { z } from "zod";
import { getAuthService } from "@/src/application/runtime";
import {
  ApiError,
  errorResponse,
  jsonOk,
  requestId,
} from "@/src/lib/api-errors";

const inputSchema = z.object({
  token: z.string().trim().min(32).max(256),
});

export async function POST(request: Request): Promise<Response> {
  const id = requestId(request);
  try {
    const parsed = inputSchema.safeParse(
      await request.json().catch(() => null),
    );
    if (!parsed.success) {
      throw new ApiError(
        "AUTH_LINK_INVALID",
        400,
        "This sign-in link is invalid or has expired.",
      );
    }
    const result = await getAuthService().verifyMagicLink(
      parsed.data.token,
    );
    return jsonOk(
      {
        sessionToken: result.sessionToken,
        expiresAt: result.expiresAt.toISOString(),
        user: {
          id: result.user.id,
          email: result.user.email,
          displayName: result.user.displayName,
          preferredLanguage: result.user.preferredLanguage,
          timezone: result.user.timezone,
          onboardingCompleted:
            result.user.onboardingCompletedAt !== null,
        },
      },
      200,
      {
        "Cache-Control": "no-store",
        Pragma: "no-cache",
        "x-request-id": id,
      },
    );
  } catch (error) {
    return errorResponse(error, id);
  }
}
