import { getBillingService } from "@/src/application/runtime";
import { getRuntimeEnvironment } from "@/src/infrastructure/environment";
import {
  ApiError,
  errorResponse,
  jsonOk,
  requestId,
} from "@/src/lib/api-errors";
import { verifyStripeWebhook } from "@/src/services/payments/stripe-gateway";

export async function POST(request: Request): Promise<Response> {
  const id = requestId(request);
  try {
    const webhookSecret = getRuntimeEnvironment().STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new ApiError(
        "PAYMENTS_NOT_CONFIGURED",
        503,
        "Stripe webhooks are not configured for this environment.",
      );
    }
    const rawPayload = await request.text();
    if (rawPayload.length > 512_000) {
      throw new ApiError(
        "PAYLOAD_TOO_LARGE",
        413,
        "The webhook payload is too large.",
      );
    }
    const event = await verifyStripeWebhook(
      rawPayload,
      request.headers.get("stripe-signature"),
      webhookSecret,
    );
    const result = await getBillingService().handleStripeEvent(
      event,
      rawPayload,
    );
    return jsonOk(result, 200, { "x-request-id": id });
  } catch (error) {
    return errorResponse(error, id);
  }
}
