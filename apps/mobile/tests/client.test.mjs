import assert from "node:assert/strict";
import test from "node:test";
import {
  buildApiUrl,
  DeepStudyApi,
  DeepStudyApiError,
  normalizeApiBaseUrl,
} from "../src/api/client.ts";

test("API URL helpers accept HTTP(S), normalize slashes, and reject unsafe schemes", () => {
  assert.equal(
    normalizeApiBaseUrl(" https://api.deepstudy.example/// "),
    "https://api.deepstudy.example",
  );
  assert.equal(
    buildApiUrl("https://api.deepstudy.example/", "api/today"),
    "https://api.deepstudy.example/api/today",
  );
  assert.throws(
    () => normalizeApiBaseUrl("javascript:alert(1)"),
    /HTTP or HTTPS/,
  );
});

test("mobile API sends explicit bearer auth and identifies mobile magic links", async () => {
  const originalFetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    if (String(url).endsWith("/api/auth/request-link")) {
      return Response.json({ message: "Check your email." }, { status: 202 });
    }
    return Response.json({ courses: [] });
  };

  try {
    const api = new DeepStudyApi("https://api.deepstudy.example/");
    await api.requestMagicLink({
      email: "student@example.com",
      intent: "sign-up",
      language: "en",
    });
    const magicBody = JSON.parse(calls[0].init.body);
    assert.equal(magicBody.client, "mobile");
    assert.equal(calls[0].init.headers.get("authorization"), null);

    api.setSessionToken("session-token");
    await api.courses();
    assert.equal(
      calls[1].init.headers.get("authorization"),
      "Bearer session-token",
    );
    assert.equal(
      calls[1].url,
      "https://api.deepstudy.example/api/courses",
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("mobile API preserves structured server errors", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () =>
    Response.json(
      {
        error: {
          code: "COURSE_LIMIT_REACHED",
          message: "Your plan supports one course.",
          requestId: "req_mobile",
        },
      },
      { status: 403 },
    );

  try {
    const api = new DeepStudyApi("https://api.deepstudy.example");
    api.setSessionToken("session-token");
    await assert.rejects(
      () => api.courses(),
      (error) => {
        assert.ok(error instanceof DeepStudyApiError);
        assert.equal(error.code, "COURSE_LIMIT_REACHED");
        assert.equal(error.status, 403);
        assert.equal(error.requestId, "req_mobile");
        return true;
      },
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("mobile management calls use owned API routes and never send a client price", async () => {
  const originalFetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, init) => {
    calls.push({ url: String(url), init });
    return Response.json({ updated: true, deleted: true });
  };
  try {
    const api = new DeepStudyApi("https://api.deepstudy.example");
    api.setSessionToken("session-token");
    await api.updateTopic("topic_1", {
      title: "Open topic",
      description: null,
      weekNumber: 3,
      sequenceNumber: 1,
    });
    await api.reorderTasks("2026-08-05", ["task_2", "task_1"]);
    await api.deleteAccount();

    assert.match(calls[0].url, /\/api\/topics\/topic_1$/);
    assert.equal(calls[0].init.method, "PATCH");
    assert.deepEqual(JSON.parse(calls[1].init.body), {
      scheduledFor: "2026-08-05",
      taskIds: ["task_2", "task_1"],
    });
    assert.equal(calls[2].init.method, "DELETE");
    assert.deepEqual(JSON.parse(calls[2].init.body), {
      confirmation: "DELETE",
    });
    assert.equal(
      calls.some(({ init }) => String(init.body).includes("amountMinor")),
      false,
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});
