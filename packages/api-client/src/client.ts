import { apiErrorBodySchema } from "@deepstudy/shared-types";
import type { z } from "zod";

export class DeepStudyApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly requestId: string | null;

  constructor(
    code: string,
    status: number,
    message: string,
    requestId: string | null = null,
  ) {
    super(message);
    this.name = "DeepStudyApiError";
    this.code = code;
    this.status = status;
    this.requestId = requestId;
  }
}

export function normalizeApiBaseUrl(value: string): string {
  const trimmed = value.trim().replace(/\/+$/, "");
  const parsed = new URL(trimmed);
  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("DeepStudy API URL must use HTTP or HTTPS.");
  }
  return parsed.toString().replace(/\/$/, "");
}

export function buildApiUrl(baseUrl: string, path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${normalizeApiBaseUrl(baseUrl)}${normalizedPath}`;
}

export type ApiFetch = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;

export class ApiClientCore {
  private readonly baseUrl: string;
  private readonly fetcher: ApiFetch;
  private sessionToken: string | null = null;

  constructor(baseUrl: string, fetcher: ApiFetch = fetch) {
    this.baseUrl = normalizeApiBaseUrl(baseUrl);
    this.fetcher = fetcher;
  }

  setSessionToken(token: string | null): void {
    this.sessionToken = token;
  }

  async request<T>(
    path: string,
    init: RequestInit = {},
    authenticated = true,
    responseSchema?: z.ZodType<T>,
  ): Promise<T> {
    const headers = new Headers(init.headers);
    headers.set("Accept", "application/json");
    if (
      init.body !== undefined &&
      !headers.has("Content-Type") &&
      !(typeof FormData !== "undefined" && init.body instanceof FormData)
    ) {
      headers.set("Content-Type", "application/json");
    }
    if (authenticated) {
      if (!this.sessionToken) {
        throw new DeepStudyApiError(
          "AUTHENTICATION_REQUIRED",
          401,
          "Please sign in to continue.",
        );
      }
      headers.set("Authorization", `Bearer ${this.sessionToken}`);
    }

    const response = await this.fetcher(buildApiUrl(this.baseUrl, path), {
      ...init,
      headers,
    });
    const payload: unknown = await response.json().catch(() => null);
    if (!response.ok) {
      const parsedError = apiErrorBodySchema.safeParse(payload);
      if (parsedError.success) {
        throw new DeepStudyApiError(
          parsedError.data.error.code,
          response.status,
          parsedError.data.error.message,
          parsedError.data.error.requestId ?? null,
        );
      }
      throw new DeepStudyApiError(
        "NETWORK_RESPONSE_INVALID",
        response.status,
        "DeepStudy returned an unreadable response.",
      );
    }
    if (responseSchema) {
      const parsedResponse = responseSchema.safeParse(payload);
      if (!parsedResponse.success) {
        throw new DeepStudyApiError(
          "NETWORK_RESPONSE_INVALID",
          502,
          "DeepStudy returned an unreadable response.",
        );
      }
      return parsedResponse.data;
    }
    return payload as T;
  }
}
