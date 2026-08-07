import { ApiError } from "../../lib/api-errors.ts";

export interface StripeCheckoutInput {
  idempotencyKey: string;
  priceId: string;
  userId: string;
  email: string;
  productKey: string;
  accessEndAt: string | null;
  successUrl: string;
  cancelUrl: string;
}

export interface StripeCheckoutResult {
  id: string;
  url: string;
}

export interface StripePortalResult {
  url: string;
}

export interface StripeGateway {
  createCheckout(input: StripeCheckoutInput): Promise<StripeCheckoutResult>;
  createCustomerPortal(
    customerId: string,
    returnUrl: string,
  ): Promise<StripePortalResult>;
}

interface StripeErrorResponse {
  error?: { type?: string; message?: string };
}

async function stripeRequest<T>(
  secretKey: string,
  path: string,
  body: URLSearchParams,
  idempotencyKey?: string,
): Promise<T> {
  const response = await fetch(`https://api.stripe.com/v1${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
      ...(idempotencyKey
        ? { "Idempotency-Key": idempotencyKey }
        : {}),
    },
    body,
  });
  const payload = (await response.json().catch(() => null)) as
    | T
    | StripeErrorResponse
    | null;
  if (!response.ok) {
    throw new ApiError(
      "PAYMENT_PROVIDER_ERROR",
      502,
      payload &&
        typeof payload === "object" &&
        "error" in payload &&
        payload.error?.message
        ? "Stripe could not start the payment. Please try again."
        : "The payment provider is temporarily unavailable.",
    );
  }
  return payload as T;
}

export class HttpStripeGateway implements StripeGateway {
  private readonly secretKey: string;

  constructor(secretKey: string) {
    this.secretKey = secretKey;
  }

  async createCheckout(
    input: StripeCheckoutInput,
  ): Promise<StripeCheckoutResult> {
    const body = new URLSearchParams({
      mode: "payment",
      "line_items[0][price]": input.priceId,
      "line_items[0][quantity]": "1",
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
      customer_email: input.email,
      client_reference_id: input.userId,
      "metadata[user_id]": input.userId,
      "metadata[product_key]": input.productKey,
      "metadata[access_end_at]": input.accessEndAt ?? "",
      "payment_intent_data[metadata][user_id]": input.userId,
      "payment_intent_data[metadata][product_key]": input.productKey,
    });
    const result = await stripeRequest<{
      id?: unknown;
      url?: unknown;
    }>(
      this.secretKey,
      "/checkout/sessions",
      body,
      input.idempotencyKey,
    );
    if (typeof result.id !== "string" || typeof result.url !== "string") {
      throw new ApiError(
        "PAYMENT_PROVIDER_RESPONSE_INVALID",
        502,
        "The payment provider returned an invalid checkout session.",
      );
    }
    return { id: result.id, url: result.url };
  }

  async createCustomerPortal(
    customerId: string,
    returnUrl: string,
  ): Promise<StripePortalResult> {
    const result = await stripeRequest<{ url?: unknown }>(
      this.secretKey,
      "/billing_portal/sessions",
      new URLSearchParams({
        customer: customerId,
        return_url: returnUrl,
      }),
    );
    if (typeof result.url !== "string") {
      throw new ApiError(
        "PAYMENT_PROVIDER_RESPONSE_INVALID",
        502,
        "The payment provider returned an invalid portal session.",
      );
    }
    return { url: result.url };
  }
}

export class MockStripeGateway implements StripeGateway {
  async createCheckout(
    input: StripeCheckoutInput,
  ): Promise<StripeCheckoutResult> {
    const id = `cs_test_${input.idempotencyKey.replaceAll("_", "")}`;
    return {
      id,
      url: `https://checkout.stripe.test/${encodeURIComponent(id)}`,
    };
  }

  async createCustomerPortal(
    customerId: string,
  ): Promise<StripePortalResult> {
    return {
      url: `https://billing.stripe.test/${encodeURIComponent(customerId)}`,
    };
  }
}

export class UnavailableStripeGateway implements StripeGateway {
  async createCheckout(): Promise<StripeCheckoutResult> {
    throw new ApiError(
      "PAYMENTS_NOT_CONFIGURED",
      503,
      "Stripe is not configured for this environment.",
    );
  }

  async createCustomerPortal(): Promise<StripePortalResult> {
    throw new ApiError(
      "PAYMENTS_NOT_CONFIGURED",
      503,
      "Stripe is not configured for this environment.",
    );
  }
}

export interface StripeEvent {
  id: string;
  type: string;
  created?: number;
  data: { object: Record<string, unknown> };
}

function hexToBytes(value: string): Uint8Array | null {
  if (!/^[a-f0-9]{64}$/i.test(value)) return null;
  const bytes = new Uint8Array(32);
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Number.parseInt(value.slice(index * 2, index * 2 + 2), 16);
  }
  return bytes;
}

function constantTimeEqual(left: Uint8Array, right: Uint8Array): boolean {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= (left[index] ?? 0) ^ (right[index] ?? 0);
  }
  return difference === 0;
}

export async function verifyStripeWebhook(
  payload: string,
  signatureHeader: string | null,
  webhookSecret: string,
  now = new Date(),
  toleranceSeconds = 300,
): Promise<StripeEvent> {
  if (!signatureHeader) {
    throw new ApiError(
      "STRIPE_SIGNATURE_MISSING",
      400,
      "The webhook signature is missing.",
    );
  }
  const parts = signatureHeader.split(",").map((part) => part.trim());
  const timestamp = parts
    .find((part) => part.startsWith("t="))
    ?.slice(2);
  const signatures = parts
    .filter((part) => part.startsWith("v1="))
    .map((part) => part.slice(3));
  if (!timestamp || signatures.length === 0 || !/^\d+$/.test(timestamp)) {
    throw new ApiError(
      "STRIPE_SIGNATURE_INVALID",
      400,
      "The webhook signature is invalid.",
    );
  }
  const signedAtSeconds = Number(timestamp);
  if (
    Math.abs(Math.floor(now.getTime() / 1_000) - signedAtSeconds) >
    toleranceSeconds
  ) {
    throw new ApiError(
      "STRIPE_SIGNATURE_EXPIRED",
      400,
      "The webhook signature timestamp is outside the allowed window.",
    );
  }

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(webhookSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const expected = new Uint8Array(
    await crypto.subtle.sign(
      "HMAC",
      key,
      new TextEncoder().encode(`${timestamp}.${payload}`),
    ),
  );
  const valid = signatures.some((signature) => {
    const candidate = hexToBytes(signature);
    return candidate ? constantTimeEqual(expected, candidate) : false;
  });
  if (!valid) {
    throw new ApiError(
      "STRIPE_SIGNATURE_INVALID",
      400,
      "The webhook signature is invalid.",
    );
  }

  const parsed = JSON.parse(payload) as unknown;
  if (
    !parsed ||
    typeof parsed !== "object" ||
    typeof (parsed as { id?: unknown }).id !== "string" ||
    typeof (parsed as { type?: unknown }).type !== "string" ||
    !(parsed as { data?: unknown }).data ||
    typeof (parsed as { data?: unknown }).data !== "object" ||
    !(parsed as { data: { object?: unknown } }).data.object ||
    typeof (parsed as { data: { object?: unknown } }).data.object !== "object"
  ) {
    throw new ApiError(
      "STRIPE_EVENT_INVALID",
      400,
      "The webhook event is invalid.",
    );
  }
  return parsed as StripeEvent;
}
