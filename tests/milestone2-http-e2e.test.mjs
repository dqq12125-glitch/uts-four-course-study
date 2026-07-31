import assert from "node:assert/strict";
import test from "node:test";
import { localDateKey } from "../src/lib/timezone.ts";
import { createMigratedDatabase } from "./helpers/sqlite-d1.mjs";

async function loadWorker() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set(
    "milestone2-http",
    `${process.pid}-${Date.now()}`,
  );
  return (await import(workerUrl.href)).default;
}

function executionContext() {
  return { waitUntil() {}, passThroughOnException() {} };
}

test("HTTP practice loop updates mastery, exposes due review, and isolates users", async () => {
  const worker = await loadWorker();
  const db = createMigratedDatabase();
  const environment = {
    DB: db,
    APP_ENV: "development",
    APP_BASE_URL: "http://localhost",
    IP_HASH_SECRET: "milestone2-http-secret",
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

  async function register(email) {
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
    const requestBody = await requested.json();
    const verifyUrl = new URL(requestBody.developmentPreviewUrl);
    const verified = await request(`${verifyUrl.pathname}${verifyUrl.search}`);
    assert.equal(verified.status, 303);
    const cookie = verified.headers.get("set-cookie")?.split(";")[0];
    assert.ok(cookie);
    return cookie;
  }

  const suffix = `${process.pid}-${Date.now()}`;
  const ownerCookie = await register(`loop-owner-${suffix}@example.com`);
  const onboarding = await request("/api/onboarding", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "http://localhost",
      cookie: ownerCookie,
    },
    body: JSON.stringify({
      displayName: "Loop Student",
      language: "en",
      timezone: "Australia/Sydney",
      dailyStudyMinutes: 45,
      semester: {
        institutionId: null,
        institutionName: "Open Course University",
        name: "Semester 2",
        startDate: "2026-07-20",
        endDate: "2026-11-20",
      },
      course: {
        templateId: null,
        courseCode: null,
        courseName: "Marine Biology",
        colourKey: "ocean",
        instructorName: null,
      },
      classSessions: [],
      assessments: [],
    }),
  });
  assert.equal(onboarding.status, 201);
  const onboardingBody = await onboarding.json();
  const courseId = onboardingBody.courseId;

  const questionResponse = await request("/api/practice/questions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "http://localhost",
      cookie: ownerCookie,
    },
    body: JSON.stringify({
      courseId,
      topicTitle: "Marine food webs",
      difficulty: 2,
      prompt: "Which organism is a primary producer?",
      options: ["Phytoplankton", "Tuna", "Seal", "Shark"],
      correctChoiceIndex: 0,
      hint1: "Look for the organism that converts light into chemical energy.",
      hint2: null,
      hint3: null,
      explanation: "Phytoplankton photosynthesise and form the producer base.",
      language: "en",
    }),
  });
  assert.equal(questionResponse.status, 201);

  const sessionResponse = await request("/api/practice/sessions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "http://localhost",
      cookie: ownerCookie,
    },
    body: JSON.stringify({
      courseId,
      confidenceBefore: 2,
    }),
  });
  assert.equal(sessionResponse.status, 201);
  const sessionBody = await sessionResponse.json();
  const sessionId = sessionBody.session.sessionId;
  assert.ok(sessionId);
  assert.equal("solution" in sessionBody.session, false);
  assert.equal("correctAnswer" in sessionBody.session, false);

  const safeSession = await request(`/api/practice/sessions/${sessionId}`, {
    headers: { cookie: ownerCookie },
  });
  assert.equal(safeSession.status, 200);
  const safeSessionText = await safeSession.text();
  assert.doesNotMatch(safeSessionText, /"solution"/);
  assert.doesNotMatch(safeSessionText, /"correctAnswer"/);

  const firstWrong = await request(
    `/api/practice/sessions/${sessionId}/attempt`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "http://localhost",
        cookie: ownerCookie,
      },
      body: JSON.stringify({ answer: "2" }),
    },
  );
  assert.equal(firstWrong.status, 200);
  const firstWrongBody = await firstWrong.json();
  assert.equal(firstWrongBody.isCorrect, false);
  assert.equal(firstWrongBody.retryAllowed, true);
  assert.equal(firstWrongBody.masteryUpdated, false);
  assert.equal("correctAnswer" in firstWrongBody, false);
  assert.equal("explanation" in firstWrongBody, false);
  assert.equal(
    db.database
      .prepare("SELECT COUNT(*) AS count FROM mastery_records")
      .get().count,
    0,
  );

  const hint = await request(
    `/api/practice/sessions/${sessionId}/hint`,
    {
      method: "POST",
      headers: { origin: "http://localhost", cookie: ownerCookie },
    },
  );
  assert.equal(hint.status, 200);
  assert.equal((await hint.json()).hintsUsed, 1);

  const attempt = await request(
    `/api/practice/sessions/${sessionId}/attempt`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "http://localhost",
        cookie: ownerCookie,
      },
      body: JSON.stringify({ answer: "0" }),
    },
  );
  assert.equal(attempt.status, 201);
  const attemptBody = await attempt.json();
  assert.equal(attemptBody.isCorrect, true);
  assert.equal(attemptBody.retryAllowed, false);
  assert.equal(attemptBody.hadIncorrectAttempt, true);
  assert.equal(attemptBody.hintsUsed, 1);
  assert.equal(attemptBody.reviewIntervalHours, 36);

  const reflection = await request(
    `/api/practice/attempts/${attemptBody.attemptId}`,
    {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
        origin: "http://localhost",
        cookie: ownerCookie,
      },
      body: JSON.stringify({
        errorType: "concept",
        confidenceAfter: 2,
      }),
    },
  );
  assert.equal(reflection.status, 200);
  assert.deepEqual(
    {
      ...db.database
        .prepare(
          `SELECT is_correct, hints_used, incorrect_attempts, error_type
           FROM practice_attempts WHERE id = ?`,
        )
        .get(attemptBody.attemptId),
    },
    {
      is_correct: 1,
      hints_used: 1,
      incorrect_attempts: 1,
      error_type: "concept",
    },
  );

  const now = new Date();
  const past = new Date(now.getTime() - 60_000).toISOString();
  const dateKey = localDateKey(now, "Australia/Sydney");
  db.database
    .prepare(
      `UPDATE mastery_records SET next_review_at = ?
       WHERE user_id = (SELECT id FROM users WHERE email LIKE 'loop-owner-%')`,
    )
    .run(past);
  db.database
    .prepare(
      `UPDATE study_tasks
       SET scheduled_for = ?, due_at = ?, status = 'queued'
       WHERE task_type = 'retest'
         AND user_id = (SELECT id FROM users WHERE email LIKE 'loop-owner-%')`,
    )
    .run(dateKey, past);

  const today = await request("/app/today", {
    headers: { cookie: ownerCookie, accept: "text/html" },
  });
  assert.equal(today.status, 200);
  const todayHtml = await today.text();
  assert.match(todayHtml, /1 topic needs a retest/);
  assert.match(todayHtml, /Retest: Marine food webs/);

  const mastery = await request("/app/mastery", {
    headers: { cookie: ownerCookie, accept: "text/html" },
  });
  assert.equal(mastery.status, 200);
  assert.match(await mastery.text(), /Marine food webs/);

  const taskId = db.database
    .prepare(
      `SELECT id FROM study_tasks
       WHERE user_id = (SELECT id FROM users WHERE email LIKE 'loop-owner-%')
         AND task_type <> 'retest'
         AND status IN ('queued', 'active')
       LIMIT 1`,
    )
    .get().id;
  const focus = await request("/api/focus-sessions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "http://localhost",
      cookie: ownerCookie,
    },
    body: JSON.stringify({ taskId, plannedMinutes: 25 }),
  });
  assert.equal(focus.status, 201);
  const focusId = (await focus.json()).session.id;

  const otherCookie = await register(`loop-other-${suffix}@example.com`);
  const crossSession = await request(
    `/api/practice/sessions/${sessionId}`,
    { headers: { cookie: otherCookie } },
  );
  assert.equal(crossSession.status, 404);
  const crossHint = await request(
    `/api/practice/sessions/${sessionId}/hint`,
    {
      method: "POST",
      headers: { origin: "http://localhost", cookie: otherCookie },
    },
  );
  assert.equal(crossHint.status, 404);
  const crossAttempt = await request(
    `/api/practice/attempts/${attemptBody.attemptId}`,
    {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
        origin: "http://localhost",
        cookie: otherCookie,
      },
      body: JSON.stringify({
        errorType: "logic",
        confidenceAfter: 5,
      }),
    },
  );
  assert.equal(crossAttempt.status, 404);
  const crossFocus = await request(`/api/focus-sessions/${focusId}`, {
    method: "PATCH",
    headers: {
      "content-type": "application/json",
      origin: "http://localhost",
      cookie: otherCookie,
    },
    body: JSON.stringify({
      completionStatus: "completed",
      needsMorePractice: false,
    }),
  });
  assert.equal(crossFocus.status, 404);
  const crossQuestion = await request("/api/practice/questions", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "http://localhost",
      cookie: otherCookie,
    },
    body: JSON.stringify({
      courseId,
      topicTitle: "Stolen",
      difficulty: 1,
      prompt: "Can another user attach this?",
      options: ["No", "Yes"],
      correctChoiceIndex: 0,
      hint1: "Ownership is checked.",
      explanation: "The course belongs to another user.",
      language: "en",
    }),
  });
  assert.equal(crossQuestion.status, 404);

  db.close();
});
