import assert from "node:assert/strict";
import test from "node:test";
import { createMigratedDatabase } from "./helpers/sqlite-d1.mjs";

async function loadWorker() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("phase2-http", `${process.pid}-${Date.now()}`);
  return (await import(workerUrl.href)).default;
}

function executionContext() {
  return { waitUntil() {}, passThroughOnException() {} };
}

test("HTTP resource upload exposes version status and hash deduplication", async () => {
  const worker = await loadWorker();
  const db = createMigratedDatabase();
  const environment = {
    DB: db,
    APP_ENV: "development",
    APP_BASE_URL: "http://localhost",
    IP_HASH_SECRET: "phase2-http-secret",
    AI_MOCK_ENABLED: "true",
    UPLOADS_MOCK_ENABLED: "true",
    DEVELOPMENT_FULL_ACCESS: "true",
    ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
  };
  const request = (path, init = {}) =>
    worker.fetch(
      new Request(`http://localhost${path}`, init),
      environment,
      executionContext(),
    );
  const email = `phase2-${process.pid}-${Date.now()}@example.com`;
  const requested = await request("/api/auth/request-link", {
    method: "POST",
    headers: { "content-type": "application/json", origin: "http://localhost" },
    body: JSON.stringify({ email, intent: "sign-up", language: "en" }),
  });
  const preview = await requested.json();
  const verifyUrl = new URL(preview.developmentPreviewUrl);
  const verified = await request(`${verifyUrl.pathname}${verifyUrl.search}`);
  const cookie = verified.headers.get("set-cookie")?.split(";")[0];
  assert.ok(cookie);
  const onboarded = await request("/api/onboarding", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "http://localhost",
      cookie,
    },
    body: JSON.stringify({
      displayName: "Phase Two",
      language: "en",
      timezone: "Australia/Sydney",
      dailyStudyMinutes: 60,
      semester: {
        institutionId: null,
        institutionName: "Example University",
        name: "Spring",
        startDate: "2026-07-20",
        endDate: "2035-11-30",
      },
      course: {
        templateId: null,
        courseCode: "P2HTTP",
        courseName: "HTTP Ingestion",
        colourKey: "ocean",
        instructorName: null,
      },
      classSessions: [],
      assessments: [],
    }),
  });
  assert.equal(onboarded.status, 201);
  const courseId = (await onboarded.json()).courseId;

  const upload = () =>
    request("/api/resources", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "http://localhost",
        cookie,
      },
      body: JSON.stringify({
        courseId,
        resourceType: "lecture_notes",
        fileName: "http-notes.md",
        text: "# HTTP ingestion\nA source-backed learning note.",
      }),
    });
  const first = await upload();
  assert.equal(first.status, 201);
  const firstResource = (await first.json()).resource;
  assert.equal(firstResource.ingestion.pipelineStatus, "completed");
  assert.equal(firstResource.ingestion.chunkCount, 1);
  assert.equal(firstResource.ingestion.qualityStatus, "warning");
  assert.ok(
    firstResource.ingestion.qualityIssues.includes(
      "EMBEDDING_PROVIDER_NOT_CONFIGURED",
    ),
  );

  const duplicate = await upload();
  assert.equal(duplicate.status, 201);
  assert.equal((await duplicate.json()).resource.id, firstResource.id);
  assert.equal(
    db.database.prepare("SELECT count(*) AS count FROM resources").get().count,
    1,
  );
  assert.equal(
    db.database.prepare("SELECT count(*) AS count FROM resource_versions").get()
      .count,
    1,
  );

  const status = await request(`/api/resources/${firstResource.id}/status`, {
    headers: { cookie },
  });
  assert.equal(status.status, 200);
  const statusBody = await status.json();
  assert.equal(statusBody.ingestion.jobStatus, "completed");
  assert.equal(statusBody.ingestion.versionNumber, 1);

  const noConnection = await request(`/api/courses/${courseId}/sync`, {
    method: "POST",
    headers: { origin: "http://localhost", cookie },
  });
  assert.equal(noConnection.status, 409);
  assert.equal((await noConnection.json()).error.code, "LMS_CONNECTION_REQUIRED");
  db.close();
});
