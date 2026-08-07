import assert from "node:assert/strict";
import test from "node:test";
import { calculateStudyStreak } from "../src/domain/planning/study-streak.ts";
import { TurnstileVerifier } from "../src/services/security/turnstile-verifier.ts";
import {
  createUnsubscribeToken,
  verifyUnsubscribeToken,
} from "../src/services/email/unsubscribe-token.ts";

test("study streak respects a user's local date and permits an inactive today", () => {
  const now = new Date("2026-10-04T00:30:00.000Z");
  assert.equal(
    calculateStudyStreak({
      timezone: "Australia/Sydney",
      now,
      activityInstants: [
        "2026-10-03T23:00:00.000Z",
        "2026-10-02T22:30:00.000Z",
        "2026-10-01T23:30:00.000Z",
      ],
    }),
    3,
  );
  assert.equal(
    calculateStudyStreak({
      timezone: "Australia/Sydney",
      now: new Date("2026-10-05T00:30:00.000Z"),
      activityInstants: [
        "2026-10-03T23:00:00.000Z",
        "2026-10-02T22:30:00.000Z",
      ],
    }),
    2,
  );
});

test("study streak ignores malformed evidence and breaks at a missing day", () => {
  assert.equal(
    calculateStudyStreak({
      timezone: "Australia/Sydney",
      now: new Date("2026-08-05T12:00:00.000Z"),
      activityInstants: [
        "not-a-date",
        "2026-08-05T01:00:00.000Z",
        "2026-08-03T01:00:00.000Z",
      ],
    }),
    1,
  );
});

test("Turnstile fails closed when required and accepts only verified tokens", async () => {
  await assert.rejects(
    new TurnstileVerifier(undefined, true).verify({
      token: null,
      remoteIp: "203.0.113.5",
      idempotencyKey: "request-1",
    }),
    (error) => error.code === "TURNSTILE_NOT_CONFIGURED",
  );
  await assert.rejects(
    new TurnstileVerifier("secret", true).verify({
      token: null,
      remoteIp: "203.0.113.5",
      idempotencyKey: "request-2",
    }),
    (error) => error.code === "TURNSTILE_REQUIRED",
  );

  const originalFetch = globalThis.fetch;
  let postedBody = "";
  globalThis.fetch = async (_url, init) => {
    postedBody = String(init.body);
    return Response.json({ success: true });
  };
  try {
    await new TurnstileVerifier("secret", true).verify({
      token: "verified-token",
      remoteIp: "203.0.113.5",
      idempotencyKey: "request-3",
    });
    assert.match(postedBody, /response=verified-token/);
    assert.match(postedBody, /idempotency_key=request-3/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("email unsubscribe tokens are signed, expiring, and tamper-evident", async () => {
  const secret = "test-secret-with-more-than-thirty-two-characters";
  const now = new Date("2026-07-30T00:00:00.000Z");
  const token = await createUnsubscribeToken({
    userId: "user_test_123",
    secret,
    now,
    expiresInDays: 1,
  });
  assert.equal(
    await verifyUnsubscribeToken({ token, secret, now }),
    "user_test_123",
  );
  assert.equal(
    await verifyUnsubscribeToken({
      token: `${token.slice(0, -1)}x`,
      secret,
      now,
    }),
    null,
  );
  assert.equal(
    await verifyUnsubscribeToken({
      token,
      secret,
      now: new Date("2026-07-31T00:00:00.001Z"),
    }),
    null,
  );
});
