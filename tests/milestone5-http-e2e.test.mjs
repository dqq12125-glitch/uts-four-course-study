import assert from "node:assert/strict";
import test from "node:test";
import { createMigratedDatabase } from "./helpers/sqlite-d1.mjs";
import { createUnsubscribeToken } from "../src/services/email/unsubscribe-token.ts";

async function loadWorker() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set(
    "milestone5-http",
    `${process.pid}-${Date.now()}`,
  );
  return (await import(workerUrl.href)).default;
}

function executionContext() {
  return { waitUntil() {}, passThroughOnException() {} };
}

test("release-preparation HTTP flow covers plan, admin access, export, deletion, and app links", async () => {
  const worker = await loadWorker();
  const db = createMigratedDatabase();
  const fingerprint = Array.from({ length: 32 }, () => "AB").join(":");
  const environment = {
    DB: db,
    APP_ENV: "development",
    APP_BASE_URL: "http://localhost",
    MOBILE_APP_LINK_BASE_URL: "https://deepstudy.example",
    IP_HASH_SECRET: "milestone5-http-secret",
    UNSUBSCRIBE_TOKEN_SECRET:
      "milestone5-unsubscribe-secret-with-32-bytes",
    APPLE_TEAM_ID: "TEAM123456",
    ANDROID_APP_LINK_SHA256_CERT_FINGERPRINTS: fingerprint,
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
        "x-forwarded-for": `198.51.100.${Math.floor(Math.random() * 200) + 1}`,
      },
      body: JSON.stringify({
        email,
        intent: "sign-up",
        language: "en",
        client: "web",
      }),
    });
    assert.equal(requested.status, 202);
    const verifyUrl = new URL((await requested.json()).developmentPreviewUrl);
    const verified = await request(`${verifyUrl.pathname}${verifyUrl.search}`);
    assert.equal(verified.status, 303);
    const cookie = verified.headers.get("set-cookie")?.split(";")[0];
    assert.ok(cookie);
    return cookie;
  }

  const suffix = `${process.pid}-${Date.now()}`;
  const ownerEmail = `m5-owner-${suffix}@example.com`;
  const ownerCookie = await register(ownerEmail);
  const onboarded = await request("/api/onboarding", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "http://localhost",
      cookie: ownerCookie,
    },
    body: JSON.stringify({
      displayName: "M5 Owner",
      language: "en",
      timezone: "Australia/Sydney",
      dailyStudyMinutes: 60,
      semester: {
        institutionId: null,
        institutionName: "Open Learning University",
        name: "Semester 2",
        startDate: "2026-07-20",
        endDate: "2026-11-30",
      },
      course: {
        templateId: null,
        courseCode: "ARTS204",
        courseName: "Open Media Studies",
        colourKey: "violet",
        instructorName: null,
      },
      classSessions: [],
      assessments: [],
    }),
  });
  assert.equal(onboarded.status, 201);
  const { courseId } = await onboarded.json();

  const task = await request("/api/study-tasks", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "http://localhost",
      cookie: ownerCookie,
    },
    body: JSON.stringify({
      courseId,
      topicId: null,
      assessmentId: null,
      title: "Compare two media theories",
      description: null,
      completionCriteria:
        "Write one paragraph for each theory and one evidence-based contrast.",
      taskType: "reading",
      priority: "medium",
      estimatedMinutes: 35,
      scheduledFor: "2026-08-05",
      dueAt: null,
    }),
  });
  assert.equal(task.status, 201);
  const { taskId } = await task.json();

  const classSession = await request(
    `/api/courses/${courseId}/class-sessions`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "http://localhost",
        cookie: ownerCookie,
      },
      body: JSON.stringify({
        sessionType: "tutorial",
        title: "Media tutorial",
        dayOfWeek: 4,
        startTime: "14:00",
        endTime: "15:00",
        location: "Building 2",
        mapUrl: "https://example.com/map",
        startDate: "2026-07-20",
        endDate: "2026-11-30",
        recurrenceRule: "FREQ=WEEKLY",
      }),
    },
  );
  assert.equal(classSession.status, 201);
  const topic = await request(`/api/courses/${courseId}/topics`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "http://localhost",
      cookie: ownerCookie,
    },
    body: JSON.stringify({
      title: "Media theory",
      description: "Compare frameworks using original examples.",
      weekNumber: 2,
      sequenceNumber: 1,
    }),
  });
  assert.equal(topic.status, 201);

  const plan = await request(
    "/api/plan?start=2026-08-05&end=2026-08-11",
    { headers: { cookie: ownerCookie } },
  );
  assert.equal(plan.status, 200);
  assert.equal(
    (await plan.json()).tasks.some((item) => item.id === taskId),
    true,
  );
  const moved = await request(`/api/study-tasks/${taskId}/schedule`, {
    method: "PATCH",
    headers: {
      "content-type": "application/json",
      origin: "http://localhost",
      cookie: ownerCookie,
    },
    body: JSON.stringify({ scheduledFor: "2026-08-06" }),
  });
  assert.equal(moved.status, 200);

  for (const [path, expected] of [
    ["/app/plan", "Plan only what you can realistically finish"],
    [`/app/courses/${courseId}`, "Media tutorial"],
    ["/app/practice", "Open Media Studies"],
    ["/app/resources", "Study resources"],
    ["/app/tutor", "AI study tutor"],
  ]) {
    const rendered = await request(path, {
      headers: { cookie: ownerCookie },
    });
    assert.equal(rendered.status, 200, `expected ${path} to render`);
    assert.match(await rendered.text(), new RegExp(expected));
  }

  const otherCookie = await register(`m5-other-${suffix}@example.com`);
  const crossUser = await request("/api/study-tasks", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "http://localhost",
      cookie: otherCookie,
    },
    body: JSON.stringify({
      courseId,
      title: "Cross-user task",
      completionCriteria: "This must be rejected.",
      taskType: "custom",
      priority: "low",
      estimatedMinutes: 10,
      scheduledFor: "2026-08-06",
    }),
  });
  assert.equal(crossUser.status, 404);
  assert.equal((await crossUser.json()).error.code, "TASK_CONTEXT_NOT_FOUND");

  const forbiddenAdmin = await request("/api/admin/dashboard", {
    headers: { cookie: ownerCookie },
  });
  assert.equal(forbiddenAdmin.status, 403);
  db.database
    .prepare("UPDATE users SET role = 'admin' WHERE email = ?")
    .run(ownerEmail);
  const adminDashboard = await request("/api/admin/dashboard", {
    headers: { cookie: ownerCookie },
  });
  assert.equal(adminDashboard.status, 200);
  assert.ok((await adminDashboard.json()).metrics.totalUsers >= 2);
  const adminPage = await request("/admin", {
    headers: { cookie: ownerCookie },
  });
  assert.equal(adminPage.status, 200);
  assert.match(await adminPage.text(), /DeepStudy Admin/);

  const ownerId = db.database
    .prepare("SELECT id FROM users WHERE email = ?")
    .get(ownerEmail).id;
  const unsubscribeToken = await createUnsubscribeToken({
    userId: ownerId,
    secret: environment.UNSUBSCRIBE_TOKEN_SECRET,
  });
  const unsubscribeConfirmation = await request(
    `/api/notifications/unsubscribe?token=${encodeURIComponent(
      unsubscribeToken,
    )}`,
  );
  assert.equal(unsubscribeConfirmation.status, 200);
  assert.match(await unsubscribeConfirmation.text(), /Stop reminder emails/);
  const unsubscribed = await request(
    `/api/notifications/unsubscribe?token=${encodeURIComponent(
      unsubscribeToken,
    )}`,
    { method: "POST" },
  );
  assert.equal(unsubscribed.status, 200);
  assert.equal(
    db.database
      .prepare(
        "SELECT reminder_enabled FROM user_settings WHERE user_id = ?",
      )
      .get(ownerId).reminder_enabled,
    0,
  );

  const exportResponse = await request("/api/account/export", {
    headers: { cookie: ownerCookie },
  });
  assert.equal(exportResponse.status, 200);
  assert.match(
    exportResponse.headers.get("content-disposition") ?? "",
    /attachment/,
  );
  const exportBody = await exportResponse.text();
  assert.match(exportBody, /Open Media Studies/);
  assert.doesNotMatch(exportBody, /storage_key/);

  const apple = await request("/.well-known/apple-app-site-association");
  assert.equal(apple.status, 200);
  assert.equal(
    (await apple.json()).applinks.details[0].appID,
    "TEAM123456.com.deepstudy.student",
  );
  const android = await request("/.well-known/assetlinks.json");
  assert.equal(android.status, 200);
  assert.deepEqual(
    (await android.json())[0].target.sha256_cert_fingerprints,
    [fingerprint],
  );

  const mobileLink = await request("/api/auth/request-link", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "http://localhost",
      "x-forwarded-for": "203.0.113.90",
    },
    body: JSON.stringify({
      email: `m5-mobile-${suffix}@example.com`,
      intent: "sign-up",
      language: "en",
      client: "mobile",
    }),
  });
  assert.equal(mobileLink.status, 202);
  assert.match(
    (await mobileLink.json()).developmentPreviewUrl,
    /^https:\/\/deepstudy\.example\/auth\/callback\?token=/,
  );

  const deleted = await request("/api/account", {
    method: "DELETE",
    headers: {
      "content-type": "application/json",
      origin: "http://localhost",
      cookie: ownerCookie,
    },
    body: JSON.stringify({ confirmation: "DELETE" }),
  });
  assert.equal(deleted.status, 200);
  assert.match(deleted.headers.get("set-cookie") ?? "", /Max-Age=0/);
  const afterDeletion = await request("/api/auth/session", {
    headers: { cookie: ownerCookie },
  });
  assert.equal(afterDeletion.status, 200);
  assert.equal((await afterDeletion.json()).user, null);
  db.close();
});
