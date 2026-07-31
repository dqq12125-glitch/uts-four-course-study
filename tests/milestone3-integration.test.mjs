import assert from "node:assert/strict";
import test from "node:test";
import { BillingService } from "../src/application/billing-service.ts";
import { EntitlementService } from "../src/application/entitlement-service.ts";
import { FeatureFlagService } from "../src/application/feature-flag-service.ts";
import { OnboardingService } from "../src/application/onboarding-service.ts";
import { CommerceRepository } from "../src/repositories/commerce-repository.ts";
import { FeatureFlagRepository } from "../src/repositories/feature-flag-repository.ts";
import { LearningRepository } from "../src/repositories/learning-repository.ts";
import { MockStripeGateway } from "../src/services/payments/stripe-gateway.ts";
import {
  createMigratedDatabase,
  seedVerifiedUser,
} from "./helpers/sqlite-d1.mjs";

function onboardingPayload(courseName) {
  return {
    displayName: "Paid Student",
    language: "en",
    timezone: "Australia/Sydney",
    dailyStudyMinutes: 60,
    semester: {
      institutionId: null,
      institutionName: "Open Course University",
      name: "Spring 2026",
      startDate: "2026-07-20",
      endDate: "2026-11-30",
    },
    course: {
      templateId: null,
      courseCode: null,
      courseName,
      colourKey: "forest",
      instructorName: null,
    },
    classSessions: [],
    assessments: [],
  };
}

async function fixture() {
  const db = createMigratedDatabase();
  const userId = "billing_user";
  seedVerifiedUser(db, {
    id: userId,
    email: "billing@example.com",
  });
  const learning = new LearningRepository(db);
  await new OnboardingService(learning).complete(
    userId,
    onboardingPayload("Open Oceanography"),
    new Date("2026-08-01T00:00:00.000Z"),
  );
  const commerce = new CommerceRepository(db);
  const entitlement = new EntitlementService(commerce, learning);
  const flags = new FeatureFlagService(
    new FeatureFlagRepository(db),
    "test",
  );
  const billing = new BillingService(
    commerce,
    learning,
    entitlement,
    flags,
    new MockStripeGateway(),
    {
      appBaseUrl: "http://localhost",
      foundingPassEndAt: "2026-12-01T00:00:00+11:00",
      priceIds: {
        founding_pass: "price_test_founding",
        semester_pass: "price_test_semester",
        exam_sprint: "price_test_sprint",
      },
    },
  );
  return { db, userId, learning, commerce, entitlement, billing };
}

test("checkout creates one pending purchase and duplicate webhook activates it once", async () => {
  const context = await fixture();
  const now = new Date("2026-08-01T01:00:00.000Z");
  const checkout = await context.billing.createCheckout({
    userId: context.userId,
    email: "billing@example.com",
    productKey: "founding_pass",
    now,
  });
  assert.match(checkout.checkoutUrl, /^https:\/\/checkout\.stripe\.test\//);
  const pending = context.db.database
    .prepare(
      `SELECT status, amount_minor, currency
       FROM purchases
       WHERE provider_checkout_session_id = ?`,
    )
    .get(checkout.checkoutSessionId);
  assert.deepEqual({ ...pending }, {
    status: "pending",
    amount_minor: 1_900,
    currency: "aud",
  });

  const event = {
    id: "evt_checkout_once",
    type: "checkout.session.completed",
    data: {
      object: {
        id: checkout.checkoutSessionId,
        client_reference_id: context.userId,
        payment_intent: "pi_paid",
        amount_total: 1_900,
        currency: "aud",
        metadata: {
          user_id: context.userId,
          product_key: "founding_pass",
          access_end_at: "2026-11-30T13:00:00.000Z",
        },
      },
    },
  };
  const rawPayload = JSON.stringify(event);
  assert.deepEqual(
    await context.billing.handleStripeEvent(event, rawPayload, now),
    { duplicate: false, handled: true },
  );
  assert.deepEqual(
    await context.billing.handleStripeEvent(event, rawPayload, now),
    { duplicate: true, handled: true },
  );
  assert.equal(
    context.db.database
      .prepare("SELECT count(*) AS count FROM purchases")
      .get().count,
    1,
  );
  assert.equal(
    context.db.database
      .prepare(
        `SELECT status FROM purchases
         WHERE provider_checkout_session_id = ?`,
      )
      .get(checkout.checkoutSessionId).status,
    "active",
  );
  assert.equal(
    context.db.database
      .prepare(
        `SELECT attempts FROM payment_webhook_events
         WHERE provider_event_id = ?`,
      )
      .get(event.id).attempts,
    1,
  );
  const entitlement = await context.entitlement.snapshot(
    context.userId,
    "student",
    now,
  );
  assert.equal(entitlement.planKey, "founding_pass");
  assert.equal(entitlement.courseLimit, 4);
  context.db.close();
});

test("checkout amount mismatch fails closed and can retry only the same event payload", async () => {
  const context = await fixture();
  const now = new Date("2026-08-01T01:00:00.000Z");
  const event = {
    id: "evt_wrong_amount",
    type: "checkout.session.completed",
    data: {
      object: {
        id: "cs_wrong",
        client_reference_id: context.userId,
        amount_total: 1,
        currency: "aud",
        metadata: {
          user_id: context.userId,
          product_key: "founding_pass",
          access_end_at: "2026-11-30T13:00:00.000Z",
        },
      },
    },
  };
  const rawPayload = JSON.stringify(event);
  await assert.rejects(
    context.billing.handleStripeEvent(event, rawPayload, now),
    (error) => error.code === "STRIPE_CHECKOUT_AMOUNT_MISMATCH",
  );
  assert.deepEqual(
    {
      ...context.db.database
        .prepare(
          `SELECT status, attempts, last_error
           FROM payment_webhook_events
           WHERE provider_event_id = ?`,
        )
        .get(event.id),
    },
    {
      status: "failed",
      attempts: 1,
      last_error: "STRIPE_CHECKOUT_AMOUNT_MISMATCH",
    },
  );
  await assert.rejects(
    context.billing.handleStripeEvent(event, rawPayload, now),
    (error) => error.code === "STRIPE_CHECKOUT_AMOUNT_MISMATCH",
  );
  assert.equal(
    context.db.database
      .prepare(
        `SELECT attempts FROM payment_webhook_events
         WHERE provider_event_id = ?`,
      )
      .get(event.id).attempts,
    2,
  );
  context.db.close();
});

test("paid entitlements remain isolated to the purchasing user", async () => {
  const context = await fixture();
  seedVerifiedUser(context.db, {
    id: "other_billing_user",
    email: "other-billing@example.com",
  });
  context.db.database
    .prepare(
      `INSERT INTO purchases (
         id, user_id, provider, provider_payment_id,
         provider_checkout_session_id, product_key, amount_minor,
         currency, status, access_start_at, access_end_at,
         created_at, updated_at
       ) VALUES (
         'purchase_isolated', ?, 'stripe', 'pi_isolated', 'cs_isolated',
         'founding_pass', 1900, 'aud', 'active', ?, ?, ?, ?
       )`,
    )
    .run(
      context.userId,
      "2026-08-01T00:00:00.000Z",
      "2026-11-30T13:00:00.000Z",
      "2026-08-01T00:00:00.000Z",
      "2026-08-01T00:00:00.000Z",
    );
  const owner = await context.entitlement.snapshot(
    context.userId,
    "student",
    new Date("2026-08-02T00:00:00.000Z"),
  );
  const other = await context.entitlement.snapshot(
    "other_billing_user",
    "student",
    new Date("2026-08-02T00:00:00.000Z"),
  );
  assert.equal(owner.courseLimit, 4);
  assert.equal(other.courseLimit, 1);
  context.db.close();
});
