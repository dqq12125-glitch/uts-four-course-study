import assert from "node:assert/strict";
import test from "node:test";
import {
  PRODUCT_CATALOG,
  productAccessEnd,
} from "../src/domain/commerce/products.ts";
import {
  canCreateCourse,
  canGeneratePractice,
  canUseAiTutor,
  resolveEntitlements,
} from "../src/domain/commerce/entitlements.ts";
import {
  verifyStripeWebhook,
} from "../src/services/payments/stripe-gateway.ts";
import { checkoutInputSchema } from "../src/lib/schemas.ts";

async function sign(payload, timestamp, secret) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const bytes = new Uint8Array(
    await crypto.subtle.sign(
      "HMAC",
      key,
      new TextEncoder().encode(`${timestamp}.${payload}`),
    ),
  );
  return [...bytes]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

test("server product catalogue stores exact AUD minor-unit prices", () => {
  assert.equal(PRODUCT_CATALOG.free.amountMinor, 0);
  assert.equal(PRODUCT_CATALOG.founding_pass.amountMinor, 1_900);
  assert.equal(PRODUCT_CATALOG.semester_pass.amountMinor, 3_990);
  assert.equal(PRODUCT_CATALOG.exam_sprint.amountMinor, 1_190);
  assert.equal(PRODUCT_CATALOG.founding_pass.currency, "aud");
});

test("entitlements enforce free and paid limits without UI trust", () => {
  const free = resolveEntitlements([]);
  assert.equal(canCreateCourse(free, 0), true);
  assert.equal(canCreateCourse(free, 1), false);
  assert.equal(canUseAiTutor(free, 2), true);
  assert.equal(canUseAiTutor(free, 3), false);
  assert.equal(canGeneratePractice(free, 5), false);

  const paid = resolveEntitlements(["founding_pass"]);
  assert.equal(paid.courseLimit, 4);
  assert.equal(paid.isFoundingUser, true);
  assert.equal(paid.canUploadResource, true);
  assert.equal(canCreateCourse(paid, 3), true);
  assert.equal(canCreateCourse(paid, 4), false);
});

test("product access periods are calculated on the server", () => {
  const now = new Date("2026-08-01T00:00:00.000Z");
  assert.equal(
    productAccessEnd("exam_sprint", {
      now,
      foundingPassEndAt: "2026-12-01T00:00:00+11:00",
    })?.toISOString(),
    "2026-08-15T00:00:00.000Z",
  );
  assert.equal(
    productAccessEnd("founding_pass", {
      now,
      foundingPassEndAt: "2026-12-01T00:00:00+11:00",
    })?.toISOString(),
    "2026-11-30T13:00:00.000Z",
  );
});

test("checkout validation accepts product keys and never accepts an amount", () => {
  assert.equal(
    checkoutInputSchema.safeParse({
      productKey: "founding_pass",
    }).success,
    true,
  );
  assert.equal(
    checkoutInputSchema.safeParse({
      productKey: "founding_pass",
      amountMinor: 1,
    }).success,
    false,
  );
  assert.equal(
    checkoutInputSchema.safeParse({
      productKey: "made_up_product",
      amountMinor: 1_900,
    }).success,
    false,
  );
});

test("Stripe webhook verifier accepts a fresh signature and rejects tampering", async () => {
  const now = new Date("2026-08-01T00:00:00.000Z");
  const timestamp = Math.floor(now.getTime() / 1_000);
  const secret = "whsec_unit_test";
  const payload = JSON.stringify({
    id: "evt_test",
    type: "checkout.session.completed",
    data: { object: { id: "cs_test" } },
  });
  const signature = await sign(payload, timestamp, secret);
  const event = await verifyStripeWebhook(
    payload,
    `t=${timestamp},v1=${signature}`,
    secret,
    now,
  );
  assert.equal(event.id, "evt_test");

  await assert.rejects(
    verifyStripeWebhook(
      `${payload} `,
      `t=${timestamp},v1=${signature}`,
      secret,
      now,
    ),
    (error) => error.code === "STRIPE_SIGNATURE_INVALID",
  );
  await assert.rejects(
    verifyStripeWebhook(
      payload,
      `t=${timestamp - 301},v1=${signature}`,
      secret,
      now,
    ),
    (error) => error.code === "STRIPE_SIGNATURE_EXPIRED",
  );
});
