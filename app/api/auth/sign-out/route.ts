import { getAuthService, appEnvironment } from "@/src/application/runtime";
import { sessionTokenFromRequest } from "@/src/application/session";
import { errorResponse, jsonOk, requestId } from "@/src/lib/api-errors";
import {
  expiredSessionCookie,
} from "@/src/lib/cookies";
import { assertSameOrigin } from "@/src/lib/request-security";

export async function POST(request: Request): Promise<Response> {
  const id = requestId(request);
  try {
    assertSameOrigin(request);
    await getAuthService().signOut(sessionTokenFromRequest(request));
    return jsonOk(
      { signedOut: true },
      200,
      {
        "Set-Cookie": expiredSessionCookie(
          appEnvironment() === "production",
        ),
        "x-request-id": id,
      },
    );
  } catch (error) {
    return errorResponse(error, id);
  }
}
