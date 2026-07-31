import assert from "node:assert/strict";
import test from "node:test";
import { createMigratedDatabase } from "./helpers/sqlite-d1.mjs";

async function loadWorker() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("mobile-http", `${process.pid}-${Date.now()}`);
  return (await import(workerUrl.href)).default;
}

function executionContext() {
  return { waitUntil() {}, passThroughOnException() {} };
}

test("mobile magic link, bearer API, open courses, and isolation work end to end", async () => {
  const worker = await loadWorker();
  const db = createMigratedDatabase();
  const environment = {
    DB: db,
    APP_ENV: "development",
    APP_BASE_URL: "http://localhost",
    MOBILE_APP_SCHEME: "deepstudy",
    IP_HASH_SECRET: "mobile-http-secret",
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

  async function registerMobile(email) {
    const requested = await request("/api/auth/request-link", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email,
        intent: "sign-up",
        language: "en",
        client: "mobile",
      }),
    });
    assert.equal(requested.status, 202);
    const requestBody = await requested.json();
    const deepLink = new URL(requestBody.developmentPreviewUrl);
    assert.equal(deepLink.protocol, "deepstudy:");
    assert.equal(deepLink.hostname, "auth");
    assert.equal(deepLink.pathname, "/callback");
    const token = deepLink.searchParams.get("token");
    assert.ok(token);

    const exchanged = await request("/api/auth/mobile/exchange", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token }),
    });
    assert.equal(exchanged.status, 200);
    assert.equal(exchanged.headers.get("cache-control"), "no-store");
    assert.equal(exchanged.headers.get("set-cookie"), null);
    const exchangeBody = await exchanged.json();
    assert.ok(exchangeBody.sessionToken);
    assert.equal(exchangeBody.user.email, email);

    const replay = await request("/api/auth/mobile/exchange", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token }),
    });
    assert.equal(replay.status, 400);
    return exchangeBody.sessionToken;
  }

  const suffix = `${process.pid}-${Date.now()}`;
  const ownerToken = await registerMobile(
    `mobile-owner-${suffix}@example.com`,
  );
  const ownerHeaders = {
    authorization: `Bearer ${ownerToken}`,
  };

  const session = await request("/api/auth/session", {
    headers: ownerHeaders,
  });
  assert.equal(session.status, 200);
  assert.equal((await session.json()).user.onboardingCompleted, false);

  const onboarding = await request("/api/onboarding", {
    method: "POST",
    headers: {
      ...ownerHeaders,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      displayName: "Mobile Student",
      language: "en",
      timezone: "Australia/Sydney",
      dailyStudyMinutes: 45,
      semester: {
        institutionId: null,
        institutionName: "Independent Arts College",
        name: "Winter Studio",
        startDate: "2026-07-20",
        endDate: "2026-11-20",
      },
      course: {
        templateId: null,
        courseCode: null,
        courseName: "History of Japanese Cinema",
        colourKey: "violet",
        instructorName: null,
      },
      classSessions: [],
      assessments: [],
    }),
  });
  assert.equal(onboarding.status, 201);
  const onboardingBody = await onboarding.json();
  assert.ok(onboardingBody.courseId);

  const courses = await request("/api/courses", {
    headers: ownerHeaders,
  });
  assert.equal(courses.status, 200);
  const coursesBody = await courses.json();
  assert.equal(coursesBody.courses.length, 1);
  assert.equal(
    coursesBody.courses[0].courseName,
    "History of Japanese Cinema",
  );
  assert.equal(coursesBody.courses[0].courseCode, null);

  const today = await request("/api/today", {
    headers: ownerHeaders,
  });
  assert.equal(today.status, 200);
  const todayBody = await today.json();
  assert.equal(todayBody.user.timezone, "Australia/Sydney");
  assert.ok(todayBody.currentTask);
  assert.match(todayBody.currentTask.completionCriteria, /\S/);

  const question = await request("/api/practice/questions", {
    method: "POST",
    headers: {
      ...ownerHeaders,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      courseId: onboardingBody.courseId,
      topicTitle: "Visual composition",
      difficulty: 2,
      prompt: "Which change most directly alters the frame composition?",
      options: [
        "Moving the camera",
        "Renaming the file",
        "Changing the subtitle font",
        "Exporting a transcript",
      ],
      correctChoiceIndex: 0,
      hint1: "Focus on spatial relationships inside the frame.",
      hint2: null,
      hint3: null,
      explanation:
        "Camera position changes the spatial arrangement of subjects.",
      language: "en",
    }),
  });
  assert.equal(question.status, 201);

  const practice = await request("/api/practice", {
    headers: ownerHeaders,
  });
  assert.equal(practice.status, 200);
  const practiceBody = await practice.json();
  assert.equal(practiceBody.courses[0].questionCount, 1);
  assert.equal(practiceBody.activeSession, null);

  const mastery = await request("/api/mastery", {
    headers: ownerHeaders,
  });
  assert.equal(mastery.status, 200);
  assert.deepEqual((await mastery.json()).topics, []);

  const otherToken = await registerMobile(
    `mobile-other-${suffix}@example.com`,
  );
  const otherHeaders = {
    authorization: `Bearer ${otherToken}`,
  };
  const crossUserRead = await request(
    `/api/courses/${onboardingBody.courseId}`,
    { headers: otherHeaders },
  );
  assert.equal(crossUserRead.status, 404);
  assert.equal((await crossUserRead.json()).error.code, "COURSE_NOT_FOUND");

  const crossUserDelete = await request(
    `/api/courses/${onboardingBody.courseId}`,
    {
      method: "DELETE",
      headers: otherHeaders,
    },
  );
  assert.equal(crossUserDelete.status, 404);
  assert.equal((await crossUserDelete.json()).error.code, "COURSE_NOT_FOUND");

  const ownerStillHasCourse = await request("/api/courses", {
    headers: ownerHeaders,
  });
  assert.equal((await ownerStillHasCourse.json()).courses.length, 1);

  const signOut = await request("/api/auth/sign-out", {
    method: "POST",
    headers: ownerHeaders,
  });
  assert.equal(signOut.status, 200);
  const signedOutSession = await request("/api/auth/session", {
    headers: ownerHeaders,
  });
  assert.equal(signedOutSession.status, 200);
  assert.equal((await signedOutSession.json()).user, null);

  db.close();
});
