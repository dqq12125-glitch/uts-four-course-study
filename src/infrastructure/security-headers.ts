import type { RuntimeEnvironment } from "./environment.ts";

const BASE_SECURITY_HEADERS = {
  "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
  "Permissions-Policy": "camera=(), geolocation=(), microphone=(self), usb=()",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
} as const;

export function withSecurityHeaders(
  response: Response,
  requestUrl: string,
  environment: RuntimeEnvironment,
): Response {
  const headers = new Headers(response.headers);
  for (const [name, value] of Object.entries(BASE_SECURITY_HEADERS)) {
    if (!headers.has(name)) headers.set(name, value);
  }
  if (
    environment.APP_ENV === "production" &&
    new URL(requestUrl).protocol === "https:"
  ) {
    headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains",
    );
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
