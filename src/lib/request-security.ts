import { ApiError } from "@/src/lib/api-errors";

export function assertSameOrigin(request: Request): void {
  const authorization = request.headers.get("authorization");
  if (/^Bearer\s+\S+$/i.test(authorization ?? "")) {
    return;
  }
  const origin = request.headers.get("origin");
  if (!origin) {
    return;
  }

  const requestUrl = new URL(request.url);
  if (new URL(origin).origin !== requestUrl.origin) {
    throw new ApiError(
      "INVALID_REQUEST_ORIGIN",
      403,
      "This request could not be verified.",
    );
  }
}

export function clientIp(request: Request): string {
  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}
