import assert from "node:assert/strict";
import test from "node:test";
import { createMigratedDatabase } from "./helpers/sqlite-d1.mjs";

async function loadWorker() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("milestone1-http", `${process.pid}-${Date.now()}`);
  return (await import(workerUrl.href)).default;
}

function executionContext() {
  return { waitUntil() {}, passThroughOnException() {} };
}

test("HTTP routes complete magic-link, open-course onboarding, Today, and isolation", async () => {
  const worker = await loadWorker();
  const db = createMigratedDatabase();
  const environment = {
    DB: db,
    APP_ENV: "development",
    APP_BASE_URL: "http://localhost",
    IP_HASH_SECRET: "http-e2e-secret",
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
    assert.equal(
      new URL(verified.headers.get("location")).pathname,
      "/onboarding",
    );
    const cookie = verified.headers.get("set-cookie")?.split(";")[0];
    assert.ok(cookie);
    return cookie;
  }

  const suffix = `${process.pid}-${Date.now()}`;
  const ownerEmail = `owner-${suffix}@example.com`;
  environment.PERSONAL_OWNER_EMAIL = ownerEmail;
  const ownerCookie = await register(ownerEmail);
  const personalWorkspace = await request("/personal", {
    headers: { cookie: ownerCookie, accept: "text/html" },
  });
  assert.equal(personalWorkspace.status, 200);
  const personalHtml = await personalWorkspace.text();
  assert.match(personalHtml, /SPRING 2026 · UTS/i);
  assert.match(personalHtml, /name="robots" content="noindex, nofollow"/);

  environment.PERSONAL_OWNER_EMAIL = undefined;
  const disabledPersonalWorkspace = await request("/personal", {
    headers: { cookie: ownerCookie, accept: "text/html" },
  });
  assert.equal(disabledPersonalWorkspace.status, 404);
  environment.PERSONAL_OWNER_EMAIL = ownerEmail;

  const onboarding = await request("/api/onboarding", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "http://localhost",
      cookie: ownerCookie,
    },
    body: JSON.stringify({
      displayName: "HTTP Student",
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
        courseName: "Environmental Ethics",
        colourKey: "forest",
        instructorName: null,
      },
      classSessions: [],
      assessments: [
        {
          title: "Position paper",
          assessmentType: "assignment",
          dueLocal: "2026-08-10T17:00",
          weightPercent: 25,
          estimatedMinutes: 120,
          notes: null,
        },
      ],
    }),
  });
  assert.equal(onboarding.status, 201);
  const onboardingBody = await onboarding.json();
  assert.ok(onboardingBody.taskCount >= 1);

  const semesters = await request("/api/semesters", {
    headers: { cookie: ownerCookie },
  });
  assert.equal(semesters.status, 200);
  const semesterBody = await semesters.json();
  assert.equal(semesterBody.semesters.length, 1);
  const semesterId = semesterBody.semesters[0].id;
  const semesterUpdate = await request(`/api/semesters/${semesterId}`, {
    method: "PATCH",
    headers: {
      "content-type": "application/json",
      origin: "http://localhost",
      cookie: ownerCookie,
    },
    body: JSON.stringify({
      institutionId: null,
      institutionName: "Open Course University",
      name: "Renamed Semester 2",
      startDate: "2026-07-20",
      endDate: "2026-11-20",
      status: "active",
    }),
  });
  assert.equal(semesterUpdate.status, 200);

  const courses = await request("/api/courses", {
    headers: { cookie: ownerCookie },
  });
  assert.equal(courses.status, 200);
  assert.equal(
    (await courses.json()).courses[0].courseName,
    "Environmental Ethics",
  );

  const today = await request("/app/today", {
    headers: { cookie: ownerCookie, accept: "text/html" },
  });
  assert.equal(today.status, 200);
  const todayHtml = await today.text();
  assert.match(todayHtml, /Environmental Ethics/);
  assert.match(todayHtml, /Completion criteria/);

  const archived = await request(
    `/api/courses/${onboardingBody.courseId}`,
    {
      method: "DELETE",
      headers: {
        origin: "http://localhost",
        cookie: ownerCookie,
      },
    },
  );
  assert.equal(archived.status, 200);
  const replacement = await request("/api/courses", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "http://localhost",
      cookie: ownerCookie,
    },
    body: JSON.stringify({
      templateId: null,
      courseCode: null,
      courseName: "Academic English",
      colourKey: "violet",
      instructorName: null,
    }),
  });
  assert.equal(replacement.status, 201);
  const replacementBody = await replacement.json();
  assert.ok(replacementBody.courseId);

  const otherCookie = await register(`other-${suffix}@example.com`);
  const hiddenPersonalWorkspace = await request("/personal", {
    headers: { cookie: otherCookie, accept: "text/html" },
  });
  assert.equal(hiddenPersonalWorkspace.status, 404);

  const crossUserSemester = await request(
    `/api/semesters/${semesterId}`,
    { headers: { cookie: otherCookie } },
  );
  assert.equal(crossUserSemester.status, 404);
  const crossUserRead = await request(
    `/api/courses/${replacementBody.courseId}`,
    { headers: { cookie: otherCookie } },
  );
  assert.equal(crossUserRead.status, 404);
  const crossUserBody = await crossUserRead.json();
  assert.equal(crossUserBody.error.code, "COURSE_NOT_FOUND");
  assert.ok(crossUserBody.error.requestId);

  const semesterArchive = await request(`/api/semesters/${semesterId}`, {
    method: "DELETE",
    headers: {
      origin: "http://localhost",
      cookie: ownerCookie,
    },
  });
  assert.equal(semesterArchive.status, 200);
  const hiddenCourses = await request("/api/courses", {
    headers: { cookie: ownerCookie },
  });
  assert.deepEqual((await hiddenCourses.json()).courses, []);

  const newSemester = await request("/api/semesters", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "http://localhost",
      cookie: ownerCookie,
    },
    body: JSON.stringify({
      institutionId: null,
      institutionName: "Another University",
      name: "Semester 3",
      startDate: "2027-01-10",
      endDate: "2027-05-30",
      status: "active",
    }),
  });
  assert.equal(newSemester.status, 201);
  db.close();
});
