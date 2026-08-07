import {
  PRODUCT_CATALOG,
  priceIdEnvironmentKey,
  productAccessEnd,
  productDefinition,
  type ProductKey,
} from "../domain/commerce/products.ts";
import { ApiError } from "../lib/api-errors.ts";
import { createId, sha256 } from "../lib/ids.ts";
import type { CommerceRepository } from "../repositories/commerce-repository.ts";
import type { LearningRepository } from "../repositories/learning-repository.ts";
import type {
  FeatureFlagKey,
  FeatureFlagService,
} from "./feature-flag-service.ts";
import type {
  StripeEvent,
  StripeGateway,
} from "../services/payments/stripe-gateway.ts";
import type { EntitlementService } from "./entitlement-service.ts";

export interface BillingConfiguration {
  appBaseUrl: string;
  foundingPassEndAt: string;
  priceIds: Partial<Record<ProductKey, string>>;
}

function stringValue(value: unknown): string | null {
  return typeof value === "string" && value ? value : null;
}

function numberValue(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function metadata(object: Record<string, unknown>): Record<string, unknown> {
  const value = object.metadata;
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

function secondsToIso(value: unknown): string | null {
  const seconds = numberValue(value);
  return seconds === null ? null : new Date(seconds * 1_000).toISOString();
}

function subscriptionStatus(
  value: unknown,
  deleted: boolean,
): "active" | "past_due" | "cancelled" | "expired" {
  if (deleted) return "cancelled";
  if (value === "active" || value === "trialing") return "active";
  if (value === "past_due" || value === "unpaid") return "past_due";
  if (value === "canceled") return "cancelled";
  return "expired";
}

export class BillingService {
  private readonly commerce: CommerceRepository;
  private readonly learning: LearningRepository;
  private readonly entitlementService: EntitlementService;
  private readonly flags: FeatureFlagService;
  private readonly stripe: StripeGateway;
  private readonly config: BillingConfiguration;

  constructor(
    commerce: CommerceRepository,
    learning: LearningRepository,
    entitlementService: EntitlementService,
    flags: FeatureFlagService,
    stripe: StripeGateway,
    config: BillingConfiguration,
  ) {
    this.commerce = commerce;
    this.learning = learning;
    this.entitlementService = entitlementService;
    this.flags = flags;
    this.stripe = stripe;
    this.config = config;
  }

  async overview(
    userId: string,
    role: "student" | "admin",
  ): Promise<{
    entitlement: Awaited<ReturnType<EntitlementService["snapshot"]>>;
    purchases: Awaited<ReturnType<CommerceRepository["listPurchases"]>>;
    products: Array<{
      key: ProductKey;
      name: string;
      amountMinor: number;
      currency: string;
      available: boolean;
    }>;
  }> {
    const [entitlement, purchases] = await Promise.all([
      this.entitlementService.snapshot(userId, role),
      this.commerce.listPurchases(userId),
    ]);
    const products = await Promise.all(
      (Object.values(PRODUCT_CATALOG) as Array<
        (typeof PRODUCT_CATALOG)[ProductKey]
      >)
        .filter((product) => product.key !== "free")
        .map(async (product) => ({
          key: product.key,
          name: product.name,
          amountMinor: product.amountMinor,
          currency: product.currency,
          available:
            (await this.flags.enabled("payments_enabled")) &&
            (!product.publicFlag ||
              (await this.flags.enabled(
                product.publicFlag as FeatureFlagKey,
              ))),
        })),
    );
    return { entitlement, purchases, products };
  }

  async createCheckout(input: {
    userId: string;
    email: string;
    productKey: string;
    now?: Date;
  }): Promise<{ checkoutUrl: string; checkoutSessionId: string }> {
    await this.flags.require("payments_enabled");
    const product = productDefinition(input.productKey);
    if (!product || product.key === "free") {
      throw new ApiError(
        "PRODUCT_NOT_FOUND",
        404,
        "That product is not available.",
      );
    }
    if (
      product.publicFlag &&
      !(await this.flags.enabled(product.publicFlag))
    ) {
      throw new ApiError(
        "PRODUCT_NOT_AVAILABLE",
        404,
        "That product is not currently available.",
      );
    }
    const priceId = this.config.priceIds[product.key];
    if (!priceId) {
      throw new ApiError(
        "PAYMENTS_NOT_CONFIGURED",
        503,
        `${priceIdEnvironmentKey(product.key)} is not configured.`,
      );
    }

    const now = input.now ?? new Date();
    const semesterEndDate =
      await this.learning.activeSemesterEndDate(input.userId);
    const accessEnd = productAccessEnd(product.key, {
      now,
      foundingPassEndAt: this.config.foundingPassEndAt,
      activeSemesterEndDate: semesterEndDate,
    });
    if (!accessEnd || accessEnd <= now) {
      throw new ApiError(
        "PRODUCT_ACCESS_PERIOD_INVALID",
        409,
        "This pass no longer has a valid access period.",
      );
    }

    const purchaseId = createId("purchase");
    const checkout = await this.stripe.createCheckout({
      idempotencyKey: purchaseId,
      priceId,
      userId: input.userId,
      email: input.email,
      productKey: product.key,
      accessEndAt: accessEnd.toISOString(),
      successUrl: new URL(
        "/app/settings/billing?checkout=success",
        this.config.appBaseUrl,
      ).toString(),
      cancelUrl: new URL(
        "/pricing?checkout=cancelled",
        this.config.appBaseUrl,
      ).toString(),
    });
    await this.commerce.createPendingPurchase({
      id: purchaseId,
      userId: input.userId,
      checkoutSessionId: checkout.id,
      productKey: product.key,
      amountMinor: product.amountMinor,
      currency: product.currency,
      accessEndAt: accessEnd.toISOString(),
      now: now.toISOString(),
    });
    await this.commerce.recordCommerceEvent({
      id: createId("event"),
      userId: input.userId,
      eventName: "checkout_started",
      productKey: product.key,
      status: "pending",
      now: now.toISOString(),
    });
    return { checkoutUrl: checkout.url, checkoutSessionId: checkout.id };
  }

  async createPortal(userId: string): Promise<{ portalUrl: string }> {
    await this.flags.require("payments_enabled");
    const customerId = await this.commerce.customerId(userId);
    if (!customerId) {
      throw new ApiError(
        "BILLING_PORTAL_UNAVAILABLE",
        409,
        "No subscription customer record is available for this account.",
      );
    }
    const portal = await this.stripe.createCustomerPortal(
      customerId,
      new URL(
        "/app/settings/billing",
        this.config.appBaseUrl,
      ).toString(),
    );
    return { portalUrl: portal.url };
  }

  async handleStripeEvent(
    event: StripeEvent,
    rawPayload: string,
    now = new Date(),
  ): Promise<{ duplicate: boolean; handled: boolean }> {
    const payloadHash = await sha256(rawPayload);
    const started = await this.commerce.beginWebhook({
      id: createId("webhook"),
      providerEventId: event.id,
      eventType: event.type,
      payloadHash,
      now: now.toISOString(),
    });
    if (!started) return { duplicate: true, handled: true };

    try {
      const object = event.data.object;
      let handled = true;
      if (event.type === "checkout.session.completed") {
        await this.handleCheckoutCompleted(object, now);
      } else if (event.type === "payment_intent.succeeded") {
        const paymentId = stringValue(object.id);
        if (paymentId) {
          await this.commerce.updatePaymentStatus(
            paymentId,
            "active",
            now.toISOString(),
          );
        }
      } else if (event.type === "payment_intent.payment_failed") {
        const paymentId = stringValue(object.id);
        if (paymentId) {
          await this.commerce.updatePaymentStatus(
            paymentId,
            "failed",
            now.toISOString(),
          );
        }
        const failedMetadata = metadata(object);
        await this.commerce.recordCommerceEvent({
          id: createId("event"),
          userId: stringValue(failedMetadata.user_id),
          eventName: "purchase_failed",
          productKey: productDefinition(
            stringValue(failedMetadata.product_key) ?? "",
          )?.key ?? null,
          status: "failed",
          now: now.toISOString(),
        });
      } else if (event.type === "charge.refunded") {
        const paymentId = stringValue(object.payment_intent);
        if (paymentId) {
          await this.commerce.updatePaymentStatus(
            paymentId,
            "refunded",
            now.toISOString(),
          );
        }
      } else if (
        event.type === "customer.subscription.updated" ||
        event.type === "customer.subscription.deleted"
      ) {
        await this.handleSubscription(
          object,
          event.type.endsWith(".deleted"),
          now,
        );
      } else {
        handled = false;
      }
      await this.commerce.completeWebhook(
        event.id,
        handled ? "processed" : "ignored",
        now.toISOString(),
      );
      return { duplicate: false, handled };
    } catch (error) {
      await this.commerce.completeWebhook(
        event.id,
        "failed",
        now.toISOString(),
        error instanceof ApiError ? error.code : "INTERNAL_ERROR",
      );
      throw error;
    }
  }

  private async handleCheckoutCompleted(
    object: Record<string, unknown>,
    now: Date,
  ): Promise<void> {
    const eventMetadata = metadata(object);
    const userId =
      stringValue(eventMetadata.user_id) ??
      stringValue(object.client_reference_id);
    const product = productDefinition(
      stringValue(eventMetadata.product_key) ?? "",
    );
    const checkoutSessionId = stringValue(object.id);
    if (!userId || !product || !checkoutSessionId || product.key === "free") {
      throw new ApiError(
        "STRIPE_CHECKOUT_METADATA_INVALID",
        400,
        "Checkout metadata is invalid.",
      );
    }
    const amountMinor = numberValue(object.amount_total);
    const currency = stringValue(object.currency)?.toLowerCase();
    if (
      amountMinor !== product.amountMinor ||
      currency !== product.currency
    ) {
      throw new ApiError(
        "STRIPE_CHECKOUT_AMOUNT_MISMATCH",
        400,
        "Checkout amount does not match the server product.",
      );
    }
    const accessEndAt = stringValue(eventMetadata.access_end_at);
    if (!accessEndAt || Date.parse(accessEndAt) <= now.getTime()) {
      throw new ApiError(
        "STRIPE_CHECKOUT_ACCESS_INVALID",
        400,
        "Checkout access period is invalid.",
      );
    }
    await this.commerce.activateCheckout({
      userId,
      checkoutSessionId,
      paymentId: stringValue(object.payment_intent),
      productKey: product.key,
      amountMinor,
      currency,
      accessStartAt: now.toISOString(),
      accessEndAt,
      now: now.toISOString(),
    });
    await this.commerce.recordCommerceEvent({
      id: createId("event"),
      userId,
      eventName: "purchase_completed",
      productKey: product.key,
      status: "active",
      now: now.toISOString(),
    });
  }

  private async handleSubscription(
    object: Record<string, unknown>,
    deleted: boolean,
    now: Date,
  ): Promise<void> {
    const eventMetadata = metadata(object);
    const userId = stringValue(eventMetadata.user_id);
    const product = productDefinition(
      stringValue(eventMetadata.product_key) ?? "",
    );
    const subscriptionId = stringValue(object.id);
    if (!userId || !product || !subscriptionId || product.key === "free") {
      throw new ApiError(
        "STRIPE_SUBSCRIPTION_METADATA_INVALID",
        400,
        "Subscription metadata is invalid.",
      );
    }
    await this.commerce.upsertSubscription({
      userId,
      providerCustomerId: stringValue(object.customer),
      providerSubscriptionId: subscriptionId,
      productKey: product.key,
      status: subscriptionStatus(object.status, deleted),
      currentPeriodStart: secondsToIso(object.current_period_start),
      currentPeriodEnd: secondsToIso(object.current_period_end),
      cancelAtPeriodEnd: object.cancel_at_period_end === true,
      now: now.toISOString(),
    });
  }
}
