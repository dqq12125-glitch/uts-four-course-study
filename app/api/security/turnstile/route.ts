import { getRuntimeEnvironment } from "@/src/infrastructure/environment";
import { jsonOk, requestId } from "@/src/lib/api-errors";

export async function GET(request: Request): Promise<Response> {
  const id = requestId(request);
  const env = getRuntimeEnvironment();
  return jsonOk(
    {
      enabled: Boolean(
        env.TURNSTILE_REQUIRED === "true" &&
          env.PUBLIC_TURNSTILE_SITE_KEY &&
          env.TURNSTILE_SECRET_KEY,
      ),
      siteKey:
        env.TURNSTILE_REQUIRED === "true" &&
        env.PUBLIC_TURNSTILE_SITE_KEY &&
        env.TURNSTILE_SECRET_KEY
          ? env.PUBLIC_TURNSTILE_SITE_KEY
          : null,
    },
    200,
    {
      "Cache-Control": "public, max-age=300",
      "x-request-id": id,
    },
  );
}
