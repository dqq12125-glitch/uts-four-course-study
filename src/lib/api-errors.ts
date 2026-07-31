import { createId } from "./ids.ts";

export class ApiError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(
    code: string,
    status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
  }
}

export function requestId(request: Request): string {
  return (
    request.headers.get("x-request-id") ??
    request.headers.get("cf-ray") ??
    createId("req")
  );
}

export function jsonOk(
  data: unknown,
  status = 200,
  headers?: HeadersInit,
): Response {
  return Response.json(data, { status, headers });
}

export function errorResponse(error: unknown, id: string): Response {
  const known =
    error instanceof ApiError
      ? error
      : new ApiError(
          "INTERNAL_ERROR",
          500,
          "Something went wrong. Please try again.",
        );

  if (!(error instanceof ApiError)) {
    console.error(
      JSON.stringify({
        level: "error",
        event: "api_request_failed",
        requestId: id,
        errorName: error instanceof Error ? error.name : "UnknownError",
      }),
    );
  }

  return Response.json(
    {
      error: {
        code: known.code,
        message: known.message,
        requestId: id,
      },
    },
    {
      status: known.status,
      headers: { "x-request-id": id },
    },
  );
}
