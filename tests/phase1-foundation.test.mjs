import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { z } from "zod";
import {
  jsonObjectSchema,
  legacyErrorClassificationOutputSchema,
  parseStructuredResponse,
  promptRegistry,
  StaticModelPolicy,
  StructuredOutputError,
} from "@deepstudy/ai";
import {
  buildMigrationManifest,
  legacyTableNames,
  verifyImportedRowCounts,
} from "@deepstudy/database";
import { InlineJobQueue } from "@deepstudy/jobs";
import { AesGcmSecretCipher } from "@deepstudy/security";
import { InMemoryObjectStorage, R2ObjectStorage } from "@deepstudy/storage";
import { deepStudyColours, primaryNavigation } from "@deepstudy/ui";
import { validateProductionConfiguration } from "../src/infrastructure/production-config.ts";
import { withSecurityHeaders } from "../src/infrastructure/security-headers.ts";

test("structured AI responses are parsed through Zod without leaking raw data", () => {
  assert.deepEqual(
    parseStructuredResponse('```json\n{"answer":"KVL"}\n```', jsonObjectSchema),
    { answer: "KVL" },
  );
  assert.throws(
    () =>
      parseStructuredResponse(
        '{"errorType":"invented","explanation":"x"}',
        legacyErrorClassificationOutputSchema,
      ),
    StructuredOutputError,
  );
  assert.equal(promptRegistry.courseExtraction.version, 1);
});

test("model policy selects capability rather than exposing vendors to use cases", () => {
  const policy = new StaticModelPolicy({
    low: "extract-model",
    medium: "tutor-model",
    high: "reasoning-model",
  });
  assert.equal(policy.select("low"), "extract-model");
  assert.equal(policy.select("high"), "reasoning-model");
});

test("storage adapters preserve private bytes and R2 privacy metadata", async () => {
  const memory = new InMemoryObjectStorage();
  const original = new Uint8Array([1, 2, 3]);
  await memory.put("course/file.pdf", original, "application/pdf");
  original[0] = 9;
  assert.deepEqual(await memory.get("course/file.pdf"), new Uint8Array([1, 2, 3]));

  let putOptions;
  const r2 = new R2ObjectStorage({
    async put(_key, _value, options) {
      putOptions = options;
    },
    async get() {
      return null;
    },
    async delete() {},
  });
  await r2.put("course/file.pdf", new Uint8Array([4]), "application/pdf");
  assert.deepEqual(putOptions, {
    httpMetadata: { contentType: "application/pdf" },
    customMetadata: { privacy: "private" },
  });
});

test("inline job adapter retries safely and deduplicates completed work", async () => {
  let attempts = 0;
  const queue = new InlineJobQueue();
  queue.register(
    "resource.parse",
    z.object({ resourceId: z.string() }),
    async (job) => {
      attempts += 1;
      assert.equal(job.payload.resourceId, "resource_1");
      if (job.attempt === 1) throw new Error("transient");
    },
  );
  const input = {
    id: "job_1",
    kind: "resource.parse",
    idempotencyKey: "resource_1:parser_v1",
    payload: { resourceId: "resource_1" },
    createdAt: "2026-08-03T00:00:00.000Z",
  };

  assert.deepEqual(await queue.enqueue(input), {
    jobId: "job_1",
    duplicate: false,
    status: "completed",
  });
  assert.deepEqual(await queue.enqueue({ ...input, id: "job_2" }), {
    jobId: "job_2",
    duplicate: true,
    status: "completed",
  });
  assert.equal(attempts, 2);
});

test("connector secrets decrypt after key rotation but remain context-bound", async () => {
  const oldKey = new Uint8Array(32).fill(7);
  const newKey = new Uint8Array(32).fill(9);
  const originalCipher = new AesGcmSecretCipher({
    activeKeyId: "key-2026-01",
    keys: { "key-2026-01": oldKey },
  });
  const encrypted = await originalCipher.encrypt(
    "canvas-access-token",
    "user_1:canvas",
  );
  assert.notEqual(encrypted.ciphertext, "canvas-access-token");

  const rotatedCipher = new AesGcmSecretCipher({
    activeKeyId: "key-2026-08",
    keys: { "key-2026-01": oldKey, "key-2026-08": newKey },
  });
  assert.equal(
    await rotatedCipher.decrypt(encrypted, "user_1:canvas"),
    "canvas-access-token",
  );
  await assert.rejects(rotatedCipher.decrypt(encrypted, "user_2:canvas"));
  assert.equal((await rotatedCipher.encrypt("new-token", "user_1:canvas")).keyId, "key-2026-08");
});

test("D1 migration manifests validate ownership, counts, and deterministic checksums", async () => {
  const exports = [
    {
      table: "courses",
      rows: [
        { id: "course_1", user_id: "user_1", course_name: "Circuits" },
      ],
    },
    {
      table: "topics",
      rows: [
        {
          id: "topic_1",
          user_id: "user_1",
          course_id: "course_1",
          title: "KVL",
        },
      ],
    },
  ];
  const first = await buildMigrationManifest(exports, "2026-08-03T00:00:00.000Z");
  const second = await buildMigrationManifest(exports, "2026-08-03T00:00:00.000Z");
  assert.deepEqual(first, second);
  assert.equal(first.totalRows, 2);
  assert.doesNotThrow(() =>
    verifyImportedRowCounts(first, { courses: 1, concepts: 1 }),
  );
  assert.throws(() => verifyImportedRowCounts(first, { courses: 0, concepts: 1 }));
  await assert.rejects(
    buildMigrationManifest([
      { table: "topics", rows: [{ id: "topic_without_owner" }] },
    ]),
    /missing owner column/,
  );
  assert.equal(legacyTableNames.length, 42);
  assert.ok(legacyTableNames.includes("resource_versions"));
  assert.ok(legacyTableNames.includes("resource_sync_runs"));
  assert.ok(legacyTableNames.includes("support_access_grants"));
  assert.ok(legacyTableNames.includes("payment_webhook_events"));
});

test("PostgreSQL migration enables pgvector and contains the target table families", async () => {
  const migration = await readFile(
    new URL(
      "../packages/database/migrations/0000_tidy_ken_ellis.sql",
      import.meta.url,
    ),
    "utf8",
  );
  assert.match(migration, /CREATE EXTENSION IF NOT EXISTS "vector"/);
  assert.match(migration, /"embedding" vector\(1536\)/);
  assert.match(migration, /USING hnsw \("embedding" vector_cosine_ops\)/);
  for (const table of [
    "resources",
    "resource_chunks",
    "concepts",
    "learning_sessions",
    "concept_mastery",
    "daily_plans",
    "tool_runs",
    "ai_interactions",
    "audit_logs",
  ]) {
    assert.match(migration, new RegExp(`CREATE TABLE "${table}"`));
  }
  const stagingMigration = await readFile(
    new URL(
      "../packages/database/migrations/0001_keen_zaran.sql",
      import.meta.url,
    ),
    "utf8",
  );
  assert.match(stagingMigration, /CREATE TABLE "legacy_import_rows"/);
});

test("design tokens expose the five-product-navigation contract", () => {
  assert.equal(deepStudyColours.accent, "#2D7A57");
  assert.deepEqual(
    primaryNavigation.map((item) => item.id),
    ["today", "courses", "practice", "tools", "progress"],
  );
});

test("production configuration fails closed without exposing secret values", () => {
  assert.throws(
    () => validateProductionConfiguration({ APP_ENV: "production" }),
    /APP_BASE_URL.*DB.*EMAIL_API_KEY.*EMAIL_FROM.*IP_HASH_SECRET.*UNSUBSCRIBE_TOKEN_SECRET.*UPLOADS/,
  );
  assert.doesNotThrow(() =>
    validateProductionConfiguration({
      APP_ENV: "production",
      APP_BASE_URL: "https://deepstudy.example",
      DB: {},
      UPLOADS: {},
      EMAIL_API_KEY: "provider-secret",
      EMAIL_FROM: "DeepStudy <study@example.edu>",
      UNSUBSCRIBE_TOKEN_SECRET: "u".repeat(32),
      IP_HASH_SECRET: "i".repeat(32),
      AI_MOCK_ENABLED: "false",
      UPLOADS_MOCK_ENABLED: "false",
      PAYMENTS_MOCK_ENABLED: "false",
      DEVELOPMENT_FULL_ACCESS: "false",
    }),
  );
});

test("worker response hardening is additive and enables HSTS only on production HTTPS", async () => {
  const secured = withSecurityHeaders(
    Response.json({ ok: true }, { headers: { "Cache-Control": "private" } }),
    "https://deepstudy.example/api/health",
    { APP_ENV: "production", PERSONAL_DEPLOYMENT: "true" },
  );
  assert.equal(secured.headers.get("Cache-Control"), "private");
  assert.equal(secured.headers.get("X-Content-Type-Options"), "nosniff");
  assert.equal(secured.headers.get("X-Frame-Options"), "DENY");
  assert.match(secured.headers.get("Strict-Transport-Security"), /max-age/);
  assert.deepEqual(await secured.json(), { ok: true });

  const local = withSecurityHeaders(
    new Response("ok"),
    "http://localhost:3000",
    { APP_ENV: "development" },
  );
  assert.equal(local.headers.get("Strict-Transport-Security"), null);
});
