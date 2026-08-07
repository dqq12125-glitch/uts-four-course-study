import { ApiError } from "../../lib/api-errors.ts";

interface TurnstileResponse {
  success?: boolean;
  "error-codes"?: string[];
}

export class TurnstileVerifier {
  private readonly secretKey: string | undefined;
  private readonly required: boolean;

  constructor(secretKey: string | undefined, required: boolean) {
    this.secretKey = secretKey;
    this.required = required;
  }

  configured(): boolean {
    return Boolean(this.secretKey);
  }

  async verify(input: {
    token?: string | null;
    remoteIp: string;
    idempotencyKey: string;
  }): Promise<void> {
    if (!this.secretKey) {
      if (this.required) {
        throw new ApiError(
          "TURNSTILE_NOT_CONFIGURED",
          503,
          "Registration protection is temporarily unavailable.",
        );
      }
      return;
    }
    if (!input.token && !this.required) return;
    if (!input.token || input.token.length > 2_048) {
      throw new ApiError(
        "TURNSTILE_REQUIRED",
        400,
        "Please complete the security check.",
      );
    }
    const body = new URLSearchParams({
      secret: this.secretKey,
      response: input.token,
      remoteip: input.remoteIp,
      idempotency_key: input.idempotencyKey,
    });
    let response: Response;
    try {
      response = await fetch(
        "https://challenges.cloudflare.com/turnstile/v0/siteverify",
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body,
        },
      );
    } catch {
      throw new ApiError(
        "TURNSTILE_UNAVAILABLE",
        503,
        "The security check is temporarily unavailable.",
      );
    }
    const result = (await response.json()) as TurnstileResponse;
    if (!response.ok || !result.success) {
      throw new ApiError(
        "TURNSTILE_FAILED",
        400,
        "The security check could not be verified. Please try again.",
      );
    }
  }
}
