import { z } from "zod";
import {
  getAuthService,
  getTurnstileVerifier,
} from "@/src/application/runtime";
import {
  errorResponse,
  jsonOk,
  requestId,
  ApiError,
} from "@/src/lib/api-errors";
import { assertSameOrigin, clientIp } from "@/src/lib/request-security";

const inputSchema = z.object({
  email: z.string().trim().email().max(254),
  intent: z.enum(["sign-up", "sign-in"]).default("sign-in"),
  language: z.enum(["zh-CN", "en"]).default("zh-CN"),
  client: z.enum(["web", "mobile"]).default("web"),
  turnstileToken: z.string().max(2_048).nullable().optional(),
});

export async function POST(request: Request): Promise<Response> {
  const id = requestId(request);
  try {
    assertSameOrigin(request);
    const body = inputSchema.safeParse(await request.json());
    if (!body.success) {
      throw new ApiError(
        "VALIDATION_ERROR",
        400,
        "Please enter a valid email address.",
      );
    }

    await getTurnstileVerifier().verify({
      token: body.data.turnstileToken,
      remoteIp: clientIp(request),
      idempotencyKey: id,
    });
    const delivery = await getAuthService().requestMagicLink({
      ...body.data,
      ipAddress: clientIp(request),
    });
    return jsonOk(
      {
        message:
          "If the address can be used, a secure sign-in link is on its way.",
        ...(delivery.previewUrl
          ? { developmentPreviewUrl: delivery.previewUrl }
          : {}),
      },
      202,
      { "x-request-id": id },
    );
  } catch (error) {
    return errorResponse(error, id);
  }
}
