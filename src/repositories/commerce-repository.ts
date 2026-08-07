import type { ProductKey } from "../domain/commerce/products.ts";
import type { D1DatabaseLike } from "./types.ts";

export interface PurchaseRecord {
  id: string;
  productKey: ProductKey;
  amountMinor: number;
  currency: string;
  status: "pending" | "active" | "failed" | "refunded" | "expired";
  providerPaymentId: string | null;
  providerCheckoutSessionId: string | null;
  accessStartAt: string | null;
  accessEndAt: string | null;
  createdAt: string;
}

export interface BillingAccessRecord {
  productKey: ProductKey;
  source: "purchase" | "subscription";
  accessEndAt: string | null;
}

export class CommerceRepository {
  private readonly db: D1DatabaseLike;

  constructor(db: D1DatabaseLike) {
    this.db = db;
  }

  async listActiveAccess(
    userId: string,
    now: string,
  ): Promise<BillingAccessRecord[]> {
    const result = await this.db
      .prepare(
        `SELECT
           product_key AS productKey,
           'purchase' AS source,
           access_end_at AS accessEndAt
         FROM purchases
         WHERE user_id = ?
           AND status = 'active'
           AND (access_start_at IS NULL OR access_start_at <= ?)
           AND (access_end_at IS NULL OR access_end_at > ?)
         UNION ALL
         SELECT
           product_key AS productKey,
           'subscription' AS source,
           current_period_end AS accessEndAt
         FROM subscriptions
         WHERE user_id = ?
           AND status = 'active'
           AND (current_period_start IS NULL OR current_period_start <= ?)
           AND (current_period_end IS NULL OR current_period_end > ?)`,
      )
      .bind(userId, now, now, userId, now, now)
      .all<BillingAccessRecord>();
    return result.results ?? [];
  }

  async listPurchases(userId: string): Promise<PurchaseRecord[]> {
    const result = await this.db
      .prepare(
        `SELECT
           id,
           product_key AS productKey,
           amount_minor AS amountMinor,
           currency,
           status,
           provider_payment_id AS providerPaymentId,
           provider_checkout_session_id AS providerCheckoutSessionId,
           access_start_at AS accessStartAt,
           access_end_at AS accessEndAt,
           created_at AS createdAt
         FROM purchases
         WHERE user_id = ?
         ORDER BY created_at DESC`,
      )
      .bind(userId)
      .all<PurchaseRecord>();
    return result.results ?? [];
  }

  async createPendingPurchase(input: {
    id: string;
    userId: string;
    checkoutSessionId: string;
    productKey: ProductKey;
    amountMinor: number;
    currency: string;
    accessEndAt: string | null;
    now: string;
  }): Promise<void> {
    await this.db
      .prepare(
        `INSERT INTO purchases (
           id, user_id, provider, provider_checkout_session_id,
           product_key, amount_minor, currency, status,
           access_end_at, created_at, updated_at
         ) VALUES (?, ?, 'stripe', ?, ?, ?, ?, 'pending', ?, ?, ?)`,
      )
      .bind(
        input.id,
        input.userId,
        input.checkoutSessionId,
        input.productKey,
        input.amountMinor,
        input.currency,
        input.accessEndAt,
        input.now,
        input.now,
      )
      .run();
  }

  async customerId(userId: string): Promise<string | null> {
    const row = await this.db
      .prepare(
        `SELECT provider_customer_id AS customerId
         FROM subscriptions
         WHERE user_id = ? AND provider_customer_id IS NOT NULL
         UNION ALL
         SELECT NULL AS customerId
         FROM purchases
         WHERE user_id = ?
         LIMIT 1`,
      )
      .bind(userId, userId)
      .first<{ customerId: string | null }>();
    return row?.customerId ?? null;
  }

  async beginWebhook(input: {
    id: string;
    providerEventId: string;
    eventType: string;
    payloadHash: string;
    now: string;
  }): Promise<boolean> {
    const result = await this.db
      .prepare(
        `INSERT INTO payment_webhook_events (
           id, provider, provider_event_id, event_type, status,
           payload_hash, attempts, received_at
         ) VALUES (?, 'stripe', ?, ?, 'processing', ?, 1, ?)
         ON CONFLICT(provider, provider_event_id) DO UPDATE SET
           status = 'processing',
           attempts = payment_webhook_events.attempts + 1,
           last_error = NULL
         WHERE payment_webhook_events.status = 'failed'
           AND payment_webhook_events.payload_hash = excluded.payload_hash`,
      )
      .bind(
        input.id,
        input.providerEventId,
        input.eventType,
        input.payloadHash,
        input.now,
      )
      .run();
    return Number(result.meta.changes ?? 0) > 0;
  }

  async completeWebhook(
    providerEventId: string,
    status: "processed" | "failed" | "ignored",
    now: string,
    lastError: string | null = null,
  ): Promise<void> {
    await this.db
      .prepare(
        `UPDATE payment_webhook_events
         SET status = ?, processed_at = ?, last_error = ?
         WHERE provider = 'stripe' AND provider_event_id = ?`,
      )
      .bind(status, now, lastError, providerEventId)
      .run();
  }

  async activateCheckout(input: {
    userId: string;
    checkoutSessionId: string;
    paymentId: string | null;
    productKey: ProductKey;
    amountMinor: number;
    currency: string;
    accessStartAt: string;
    accessEndAt: string | null;
    now: string;
  }): Promise<void> {
    await this.db
      .prepare(
        `INSERT INTO purchases (
           id, user_id, provider, provider_payment_id,
           provider_checkout_session_id, product_key, amount_minor,
           currency, status, access_start_at, access_end_at,
           created_at, updated_at
         ) VALUES (
           ?, ?, 'stripe', ?, ?, ?, ?, ?, 'active', ?, ?, ?, ?
         )
         ON CONFLICT(provider, provider_checkout_session_id) DO UPDATE SET
           provider_payment_id = COALESCE(
             excluded.provider_payment_id,
             purchases.provider_payment_id
           ),
           status = 'active',
           access_start_at = excluded.access_start_at,
           access_end_at = excluded.access_end_at,
           updated_at = excluded.updated_at
         WHERE purchases.user_id = excluded.user_id
           AND purchases.product_key = excluded.product_key`,
      )
      .bind(
        `purchase_${crypto.randomUUID().replaceAll("-", "")}`,
        input.userId,
        input.paymentId,
        input.checkoutSessionId,
        input.productKey,
        input.amountMinor,
        input.currency,
        input.accessStartAt,
        input.accessEndAt,
        input.now,
        input.now,
      )
      .run();
  }

  async updatePaymentStatus(
    providerPaymentId: string,
    status: "active" | "failed" | "refunded",
    now: string,
  ): Promise<void> {
    await this.db
      .prepare(
        `UPDATE purchases
         SET status = ?,
             access_end_at = CASE
               WHEN ? = 'refunded' THEN ?
               ELSE access_end_at
             END,
             updated_at = ?
         WHERE provider = 'stripe' AND provider_payment_id = ?`,
      )
      .bind(status, status, now, now, providerPaymentId)
      .run();
  }

  async upsertSubscription(input: {
    userId: string;
    providerCustomerId: string | null;
    providerSubscriptionId: string;
    productKey: ProductKey;
    status: "active" | "past_due" | "cancelled" | "expired";
    currentPeriodStart: string | null;
    currentPeriodEnd: string | null;
    cancelAtPeriodEnd: boolean;
    now: string;
  }): Promise<void> {
    await this.db
      .prepare(
        `INSERT INTO subscriptions (
           id, user_id, provider, provider_customer_id,
           provider_subscription_id, product_key, status,
           current_period_start, current_period_end, cancel_at_period_end,
           created_at, updated_at
         ) VALUES (?, ?, 'stripe', ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(provider, provider_subscription_id) DO UPDATE SET
           provider_customer_id = excluded.provider_customer_id,
           status = excluded.status,
           current_period_start = excluded.current_period_start,
           current_period_end = excluded.current_period_end,
           cancel_at_period_end = excluded.cancel_at_period_end,
           updated_at = excluded.updated_at
         WHERE subscriptions.user_id = excluded.user_id`,
      )
      .bind(
        `subscription_${crypto.randomUUID().replaceAll("-", "")}`,
        input.userId,
        input.providerCustomerId,
        input.providerSubscriptionId,
        input.productKey,
        input.status,
        input.currentPeriodStart,
        input.currentPeriodEnd,
        input.cancelAtPeriodEnd ? 1 : 0,
        input.now,
        input.now,
      )
      .run();
  }

  async recordCommerceEvent(input: {
    id: string;
    userId: string | null;
    eventName: "checkout_started" | "purchase_completed" | "purchase_failed";
    productKey: ProductKey | null;
    status: string;
    now: string;
  }): Promise<void> {
    await this.db
      .prepare(
        `INSERT INTO usage_events (
           id, user_id, event_name, event_category, properties_json,
           created_at
         ) VALUES (?, ?, ?, 'commerce', ?, ?)`,
      )
      .bind(
        input.id,
        input.userId,
        input.eventName,
        JSON.stringify({
          productKey: input.productKey,
          provider: "stripe",
          status: input.status,
        }),
        input.now,
      )
      .run();
  }
}
