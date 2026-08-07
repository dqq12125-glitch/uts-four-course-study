import assert from "node:assert/strict";
import test from "node:test";
import { createMigratedDatabase } from "./helpers/sqlite-d1.mjs";

async function loadWorker() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set(
    "milestone4-http",
    `${process.pid}-${Date.now()}`,
  );
  return (await import(workerUrl.href)).default;
}

function executionContext() {
  return { waitUntil() {}, passThroughOnException() {} };
}

test("HTTP Hint-first tutor and private upload-confirm-import remain user isolated", async () => {
  const worker = await loadWorker();
  const db = createMigratedDatabase();
  const environment = {
    DB: db,
    APP_ENV: "development",
    APP_BASE_URL: "http://localhost",
    IP_HASH_SECRET: "http-e2e-secret",
    AI_MOCK_ENABLED: "true",
    UPLOADS_MOCK_ENABLED: "true",
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

  async function registerAndOnboard(email, courseName) {
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
    const preview = await requested.json();
    const verifyUrl = new URL(preview.developmentPreviewUrl);
    const verified = await request(
      `${verifyUrl.pathname}${verifyUrl.search}`,
    );
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
        displayName: "Milestone Four",
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
          courseName,
          colourKey: "ocean",
          instructorName: null,
        },
        classSessions: [],
        assessments: [],
      }),
    });
    assert.equal(onboarding.status, 201);
    const body = await onboarding.json();
    return { cookie, courseId: body.courseId };
  }

  const suffix = `${process.pid}-${Date.now()}`;
  const ownerEmail = `m4-owner-${suffix}@example.com`;
  const owner = await registerAndOnboard(ownerEmail, "Open Biology");
  const other = await registerAndOnboard(
    `m4-other-${suffix}@example.com`,
    "Open History",
  );
  const ownerUser = db.database
    .prepare("SELECT id FROM users WHERE email = ?")
    .get(ownerEmail);

  const tutor = await request("/api/ai/tutor", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "http://localhost",
      cookie: owner.cookie,
    },
    body: JSON.stringify({
      courseId: owner.courseId,
      message:
        "Give me the final answer for this graded assignment question.",
      studentAttempt: null,
      resourceIds: [],
      language: "en",
      suspectedAssessedWork: false,
    }),
  });
  assert.equal(tutor.status, 200);
  const tutorBody = await tutor.json();
  assert.equal(tutorBody.safetyMode, "integrity_guidance");
  assert.match(tutorBody.reply, /will not provide a submission-ready answer/i);
  const stolenCourseTutor = await request("/api/ai/tutor", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "http://localhost",
      cookie: other.cookie,
    },
    body: JSON.stringify({
      courseId: owner.courseId,
      message: "Read this course",
      resourceIds: [],
      language: "en",
      suspectedAssessedWork: false,
    }),
  });
  assert.equal(stolenCourseTutor.status, 404);

  db.database
    .prepare(
      `INSERT INTO purchases (
         id, user_id, provider, provider_payment_id,
         provider_checkout_session_id, product_key, amount_minor,
         currency, status, access_start_at, access_end_at,
         created_at, updated_at
       ) VALUES (
         'purchase_m4_http', ?, 'stripe', 'pi_m4_http', 'cs_m4_http',
         'founding_pass', 1900, 'aud', 'active',
         '2026-01-01T00:00:00.000Z', '2035-12-01T00:00:00.000Z',
         '2026-01-01T00:00:00.000Z', '2026-01-01T00:00:00.000Z'
       )`,
    )
    .run(ownerUser.id);
  const ics = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
UID:class-1
DTSTART;TZID=Australia/Sydney:20260803T090000
DTEND;TZID=Australia/Sydney:20260803T110000
RRULE:FREQ=WEEKLY
SUMMARY:Biology laboratory
LOCATION:Room 2.101
END:VEVENT
BEGIN:VEVENT
UID:due-1
DTSTART;VALUE=DATE:20260810
SUMMARY:Lab report due
END:VEVENT
END:VCALENDAR`;
  const form = new FormData();
  form.set("courseId", owner.courseId);
  form.set("resourceType", "timetable");
  form.set(
    "file",
    new File([ics], "timetable.ics", { type: "text/calendar" }),
  );
  const upload = await request("/api/resources", {
    method: "POST",
    headers: { origin: "http://localhost", cookie: owner.cookie },
    body: form,
  });
  assert.equal(upload.status, 201);
  const uploaded = (await upload.json()).resource;
  assert.equal(uploaded.processingStatus, "awaiting_confirmation");
  assert.equal(uploaded.proposal.assessments.length, 1);
  assert.equal(
    db.database.prepare("SELECT count(*) AS count FROM assessments").get()
      .count,
    0,
  );

  const stolenResource = await request(`/api/resources/${uploaded.id}`, {
    headers: { cookie: other.cookie },
  });
  assert.equal(stolenResource.status, 404);
  const confirmed = await request(
    `/api/resources/${uploaded.id}/confirm`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "http://localhost",
        cookie: owner.cookie,
      },
      body: JSON.stringify({
        assessmentIndexes: [0],
        classSessionIndexes: [0],
        topicIndexes: [],
      }),
    },
  );
  assert.equal(confirmed.status, 201);
  assert.equal((await confirmed.json()).assessmentCount, 1);
  assert.equal(
    db.database
      .prepare(
        `SELECT count(*) AS count FROM assessments WHERE user_id = ?`,
      )
      .get(ownerUser.id).count,
    1,
  );
  const pastedUpload = await request("/api/resources", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "http://localhost",
      cookie: owner.cookie,
    },
    body: JSON.stringify({
      courseId: owner.courseId,
      resourceType: "timetable",
      fileName: "pasted-timetable.txt",
      text: `Tuesday 13:00-15:00 Tutorial | Building 10, Room 301
周四 09:00-11:00 讲座 | 教室 CB11.04.100`,
    }),
  });
  assert.equal(pastedUpload.status, 201);
  const pastedResource = (await pastedUpload.json()).resource;
  assert.equal(pastedResource.proposal.classSessions.length, 2);
  const pastedConfirmed = await request(
    `/api/resources/${pastedResource.id}/confirm`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "http://localhost",
        cookie: owner.cookie,
      },
      body: JSON.stringify({
        assessmentIndexes: [],
        classSessionIndexes: [0, 1],
        topicIndexes: [],
      }),
    },
  );
  assert.equal(pastedConfirmed.status, 201);
  assert.deepEqual(await pastedConfirmed.json(), {
    assessmentCount: 0,
    classSessionCount: 2,
    topicCount: 0,
    skippedDuplicateCount: 0,
  });
  const generated = await request("/api/ai/practice", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "http://localhost",
      cookie: owner.cookie,
    },
    body: JSON.stringify({
      courseId: owner.courseId,
      topicTitle: "Cell membranes",
      difficulty: 2,
      resourceIds: [uploaded.id],
      language: "en",
    }),
  });
  assert.equal(generated.status, 201);
  const generatedBody = await generated.json();
  assert.ok(generatedBody.questionId);
  assert.deepEqual(
    {
      ...db.database
        .prepare(
          `SELECT owner_user_id AS ownerUserId, source_type AS sourceType
           FROM practice_questions WHERE id = ?`,
        )
        .get(generatedBody.questionId),
    },
    { ownerUserId: ownerUser.id, sourceType: "ai_generated" },
  );
  db.close();
});
