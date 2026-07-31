import assert from "node:assert/strict";
import test from "node:test";
import { createMigratedDatabase } from "./helpers/sqlite-d1.mjs";

async function loadWorker() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set(
    "milestone3-http",
    `${process.pid}-${Date.now()}`,
  );
  return (await import(workerUrl.href)).default;
}

function executionContext() {
  return { waitUntil() {}, passThroughOnException() {} };
}

async function stripeSignature(payload, timestamp, secret) {
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

test("HTTP free paywall, mock checkout, signed webhook, and paid course entitlement", async () => {
  const worker = await loadWorker();
  const db = createMigratedDatabase();
  const webhookSecret = "whsec_http_test";
  const environment = {
    DB: db,
    APP_ENV: "development",
    APP_BASE_URL: "http://localhost",
    IP_HASH_SECRET: "http-e2e-secret",
    PAYMENTS_MOCK_ENABLED: "true",
    STRIPE_FOUNDING_PASS_PRICE_ID: "price_test_founding",
    STRIPE_WEBHOOK_SECRET: webhookSecret,
    FOUNDING_PASS_ACCESS_END_AT: "2035-12-01T00:00:00+11:00",
    ASSETS: {
      fetch: async () => new Response("Not found", { status: 404 }),
    },
  };

  async function request(path, init = {}) {
    return worker.fetch(
      new Request(`http://localhost${path}`, init),
      environment,
      executionContext(),
    );
  }

  const suffix = `${process.pid}-${Date.now()}`;
  const email = `paid-${suffix}@example.com`;
  const requested = await request("/api/auth/request-link", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "http://localhost",
    },
    body: JSON.stringify({
      email,
      intent: "sign-up",
      language: "en",
    }),
  });
  assert.equal(requested.status, 202);
  const preview = await requested.json();
  const verifyUrl = new URL(preview.developmentPreviewUrl);
  const verified = await request(`${verifyUrl.pathname}${verifyUrl.search}`);
  const cookie = verified.headers.get("set-cookie")?.split(";")[0];
  assert.ok(cookie);

  const onboarding = await request("/api/onboarding", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "http://localhost",
      cookie,
    },
    body: JSON.stringify({
      displayName: "Paid HTTP Student",
      language: "en",
      timezone: "Australia/Sydney",
      dailyStudyMinutes: 60,
      semester: {
        institutionId: null,
        institutionName: "Any University",
        name: "Open Semester",
        startDate: "2026-07-20",
        endDate: "2035-11-30",
      },
      course: {
        templateId: null,
        courseCode: "OPEN101",
        courseName: "Open Learning One",
        colourKey: "ocean",
        instructorName: null,
      },
      classSessions: [],
      assessments: [],
    }),
  });
  assert.equal(onboarding.status, 201);

  const blockedSecondCourse = await request("/api/courses", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "http://localhost",
      cookie,
    },
    body: JSON.stringify({
      templateId: null,
      courseCode: "OPEN102",
      courseName: "Open Learning Two",
      colourKey: "forest",
      instructorName: null,
    }),
  });
  assert.equal(blockedSecondCourse.status, 403);
  assert.equal(
    (await blockedSecondCourse.json()).error.code,
    "COURSE_LIMIT_REACHED",
  );

  const checkout = await request("/api/billing/checkout", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "http://localhost",
      cookie,
    },
    body: JSON.stringify({ productKey: "founding_pass" }),
  });
  assert.equal(checkout.status, 201);
  const checkoutBody = await checkout.json();
  assert.match(checkoutBody.checkoutUrl, /checkout\.stripe\.test/);

  const session = db.database
    .prepare(
      `SELECT user_id, access_end_at
       FROM purchases
       WHERE provider_checkout_session_id = ?`,
    )
    .get(checkoutBody.checkoutSessionId);
  assert.ok(session.user_id);
  const event = {
    id: `evt_${suffix}`,
    type: "checkout.session.completed",
    data: {
      object: {
        id: checkoutBody.checkoutSessionId,
        client_reference_id: session.user_id,
        payment_intent: `pi_${suffix}`,
        amount_total: 1_900,
        currency: "aud",
        metadata: {
          user_id: session.user_id,
          product_key: "founding_pass",
          access_end_at: session.access_end_at,
        },
      },
    },
  };
  const payload = JSON.stringify(event);
  const timestamp = Math.floor(Date.now() / 1_000);
  const signature = await stripeSignature(
    payload,
    timestamp,
    webhookSecret,
  );
  const webhook = await request("/api/webhooks/stripe", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "stripe-signature": `t=${timestamp},v1=${signature}`,
    },
    body: payload,
  });
  assert.equal(webhook.status, 200);
  assert.deepEqual(await webhook.json(), {
    duplicate: false,
    handled: true,
  });

  const duplicate = await request("/api/webhooks/stripe", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "stripe-signature": `t=${timestamp},v1=${signature}`,
    },
    body: payload,
  });
  assert.deepEqual(await duplicate.json(), {
    duplicate: true,
    handled: true,
  });

  const entitlement = await request("/api/entitlements", {
    headers: { cookie },
  });
  assert.equal(entitlement.status, 200);
  assert.equal(
    (await entitlement.json()).entitlement.courseLimit,
    4,
  );
  const allowedSecondCourse = await request("/api/courses", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "http://localhost",
      cookie,
    },
    body: JSON.stringify({
      templateId: null,
      courseCode: "OPEN102",
      courseName: "Open Learning Two",
      colourKey: "forest",
      instructorName: null,
    }),
  });
  assert.equal(allowedSecondCourse.status, 201);
  assert.equal(
    db.database.prepare("SELECT count(*) AS count FROM courses").get()
      .count,
    2,
  );
  db.close();
});
