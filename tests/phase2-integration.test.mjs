import assert from "node:assert/strict";
import test from "node:test";
import { DocumentIngestionPipeline, MockConnector } from "@deepstudy/ingestion";
import { CourseSyncService } from "../src/application/course-sync-service.ts";
import { EntitlementService } from "../src/application/entitlement-service.ts";
import { FeatureFlagService } from "../src/application/feature-flag-service.ts";
import { OnboardingService } from "../src/application/onboarding-service.ts";
import { ResourceIngestionService } from "../src/application/resource-ingestion-service.ts";
import { ResourceService } from "../src/application/resource-service.ts";
import { AiRepository } from "../src/repositories/ai-repository.ts";
import { CommerceRepository } from "../src/repositories/commerce-repository.ts";
import { ConnectorSyncRepository } from "../src/repositories/connector-sync-repository.ts";
import { FeatureFlagRepository } from "../src/repositories/feature-flag-repository.ts";
import { LearningRepository } from "../src/repositories/learning-repository.ts";
import { ResourceIngestionRepository } from "../src/repositories/resource-ingestion-repository.ts";
import { ResourceRepository } from "../src/repositories/resource-repository.ts";
import { MockAiProvider } from "../src/services/ai/mock-ai-provider.ts";
import { InMemoryPrivateObjectStorage } from "../src/services/storage/private-object-storage.ts";
import {
  createMigratedDatabase,
  seedVerifiedUser,
} from "./helpers/sqlite-d1.mjs";

const NOW = new Date("2026-08-03T00:00:00.000Z");

async function fixture(embeddingProvider = {
  async embed(texts) {
    return texts.map((text) => [text.length, 0.5, 1]);
  },
}) {
  const db = createMigratedDatabase();
  const userId = `phase2_user_${Math.random().toString(36).slice(2)}`;
  seedVerifiedUser(db, { id: userId, email: `${userId}@example.com` });
  const learning = new LearningRepository(db);
  const onboarded = await new OnboardingService(learning).complete(
    userId,
    {
      displayName: "Phase Two Student",
      language: "en",
      timezone: "Australia/Sydney",
      dailyStudyMinutes: 60,
      semester: {
        institutionId: null,
        institutionName: "Example University",
        name: "Spring",
        startDate: "2026-07-20",
        endDate: "2026-11-30",
      },
      course: {
        templateId: null,
        courseCode: "P2-101",
        courseName: "Phase Two Course",
        colourKey: "ocean",
        instructorName: null,
      },
      classSessions: [],
      assessments: [],
    },
    NOW,
  );
  db.database
    .prepare(
      `INSERT INTO purchases (
         id, user_id, provider, provider_payment_id,
         provider_checkout_session_id, product_key, amount_minor,
         currency, status, access_start_at, access_end_at,
         created_at, updated_at
       ) VALUES (?, ?, 'stripe', ?, ?, 'founding_pass', 1900, 'aud',
         'active', '2026-08-01T00:00:00.000Z',
         '2026-12-01T00:00:00.000Z', ?, ?)`,
    )
    .run(
      `purchase_${userId}`,
      userId,
      `pi_${userId}`,
      `cs_${userId}`,
      NOW.toISOString(),
      NOW.toISOString(),
    );
  const resourceRepository = new ResourceRepository(db);
  const ingestionRepository = new ResourceIngestionRepository(db);
  const storage = new InMemoryPrivateObjectStorage();
  const ingestion = new ResourceIngestionService(
    ingestionRepository,
    new DocumentIngestionPipeline({
      embeddingProvider,
      embeddingVersion: "integration-embedding-v1",
    }),
    "integration-embedding-v1",
  );
  const aiRepository = new AiRepository(db);
  const service = new ResourceService(
    resourceRepository,
    aiRepository,
    storage,
    new MockAiProvider(),
    new EntitlementService(
      new CommerceRepository(db),
      learning,
    ),
    new FeatureFlagService(new FeatureFlagRepository(db), "test"),
    ingestion,
  );
  return {
    db,
    userId,
    courseId: onboarded.courseId,
    service,
    storage,
  };
}

function uploadInput(context, bytes, fileName = "lecture.md") {
  return {
    userId: context.userId,
    role: "student",
    courseId: context.courseId,
    fileName,
    mimeType: "text/plain",
    bytes,
    resourceType: "lecture_notes",
    language: "en",
    timezone: "Australia/Sydney",
    now: NOW,
  };
}

test("manual upload dual-writes a versioned resource and deduplicates by hash", async () => {
  const context = await fixture();
  const bytes = new TextEncoder().encode(
    "# Kirchhoff's voltage law\nThe signed voltage sum around a loop is zero.",
  );
  const first = await context.service.upload(uploadInput(context, bytes));
  assert.equal(first.processingStatus, "awaiting_confirmation");
  assert.equal(first.ingestion.pipelineStatus, "completed");
  assert.equal(first.ingestion.jobStatus, "completed");
  assert.equal(first.ingestion.versionNumber, 1);
  assert.equal(first.ingestion.chunkCount, 1);
  assert.equal(first.ingestion.embeddedChunkCount, 1);
  assert.equal(first.ingestion.qualityStatus, "passed");

  const duplicate = await context.service.upload(uploadInput(context, bytes));
  assert.equal(duplicate.id, first.id);
  for (const table of [
    "learning_resources",
    "resources",
    "resource_versions",
    "resource_processing_jobs",
  ]) {
    assert.equal(
      context.db.database.prepare(`SELECT count(*) AS count FROM ${table}`).get()
        .count,
      1,
    );
  }
  const chunk = context.db.database
    .prepare(
      `SELECT section, embedding_json AS embeddingJson
       FROM resource_chunks WHERE resource_id = ?`,
    )
    .get(first.id);
  assert.equal(chunk.section, "Kirchhoff's voltage law");
  assert.equal(JSON.parse(chunk.embeddingJson).length, 3);
  context.db.close();
});

test("connector changes create one new version and reuse unchanged embeddings", async () => {
  const context = await fixture();
  const base = {
    userId: context.userId,
    role: "student",
    courseId: context.courseId,
    connectionId: "connection_test",
    sourceType: "mock",
    sourceId: "remote-file-1",
    sourceUrl: "https://lms.example/files/remote-file-1",
    resourceType: "lecture_notes",
    language: "en",
    timezone: "Australia/Sydney",
  };
  context.db.database
    .prepare(
      `INSERT INTO lms_connections (
         id, user_id, connector_id, display_name, scopes_json, status,
         created_at, updated_at
       ) VALUES ('connection_test', ?, 'mock', 'Mock LMS', '[]', 'active', ?, ?)`,
    )
    .run(context.userId, NOW.toISOString(), NOW.toISOString());
  const firstBytes = new TextEncoder().encode(
    "# Stable\nVoltage is potential difference.\n\n# Changing\nOld explanation.",
  );
  const created = await context.service.syncResource({
    ...base,
    sourceUpdatedAt: "2026-08-03T00:00:00.000Z",
    file: {
      id: base.sourceId,
      courseId: "remote-course",
      fileName: "lecture.md",
      mimeType: "text/plain",
      bytes: firstBytes,
      sourceUrl: base.sourceUrl,
      updatedAt: "2026-08-03T00:00:00.000Z",
    },
    now: NOW,
  });
  assert.equal(created.action, "created");
  assert.equal(
    await context.service.sourceNeedsDownload({
      userId: context.userId,
      courseId: context.courseId,
      sourceType: "mock",
      sourceId: base.sourceId,
      sourceUrl: base.sourceUrl,
      sourceUpdatedAt: "2026-08-03T00:00:00.000Z",
      now: NOW,
    }),
    false,
  );

  const changedBytes = new TextEncoder().encode(
    "# Stable\nVoltage is potential difference.\n\n# Changing\nNew explanation with an example.",
  );
  const updated = await context.service.syncResource({
    ...base,
    sourceUpdatedAt: "2026-08-04T00:00:00.000Z",
    file: {
      id: base.sourceId,
      courseId: "remote-course",
      fileName: "lecture.md",
      mimeType: "text/plain",
      bytes: changedBytes,
      sourceUrl: base.sourceUrl,
      updatedAt: "2026-08-04T00:00:00.000Z",
    },
    now: new Date("2026-08-04T00:00:00.000Z"),
  });
  assert.equal(updated.action, "updated");
  const detail = await context.service.detail(context.userId, created.resourceId);
  assert.equal(detail.ingestion.versionNumber, 2);
  assert.equal(detail.ingestion.reusedChunkCount, 1);
  assert.equal(detail.ingestion.chunkCount, 2);
  assert.equal(
    context.db.database
      .prepare(
        "SELECT count(*) AS count FROM resource_versions WHERE resource_id = ?",
      )
      .get(created.resourceId).count,
    2,
  );

  const tombstoned = await context.service.tombstoneMissingSources({
    userId: context.userId,
    courseId: context.courseId,
    connectionId: base.connectionId,
    sourceType: "mock",
    seenSourceIds: new Set(),
    now: "2026-08-05T00:00:00.000Z",
  });
  assert.equal(tombstoned, 1);
  assert.equal(
    context.db.database
      .prepare("SELECT status FROM resources WHERE id = ?")
      .get(created.resourceId).status,
    "tombstoned",
  );
  assert.ok(
    context.db.database
      .prepare("SELECT id FROM learning_resources WHERE id = ?")
      .get(created.resourceId),
  );
  context.db.close();
});

test("failed embedding jobs retry without duplicating chunks or versions", async () => {
  let attempts = 0;
  const context = await fixture({
    async embed(texts) {
      attempts += 1;
      if (attempts === 1) throw new Error("temporary embedding outage");
      return texts.map((text) => [text.length, 1]);
    },
  });
  const resource = await context.service.upload(
    uploadInput(
      context,
      new TextEncoder().encode("# Retry\nThis text is safe to retry."),
      "retry.md",
    ),
  );
  assert.equal(resource.processingStatus, "awaiting_confirmation");
  assert.equal(resource.ingestion.pipelineStatus, "failed");
  assert.equal(resource.ingestion.jobAttempts, 1);

  const retried = await context.service.retryProcessing({
    userId: context.userId,
    resourceId: resource.id,
    language: "en",
    timezone: "Australia/Sydney",
    now: new Date("2026-08-03T00:01:00.000Z"),
  });
  assert.equal(retried.ingestion.pipelineStatus, "completed");
  assert.equal(retried.ingestion.jobAttempts, 2);
  assert.equal(retried.ingestion.chunkCount, 1);
  assert.equal(attempts, 2);
  assert.equal(
    context.db.database
      .prepare("SELECT count(*) AS count FROM resource_versions")
      .get().count,
    1,
  );
  context.db.close();
});

test("course sync records every run, skips unchanged metadata, and tombstones removals", async () => {
  const context = await fixture();
  context.db.database
    .prepare(
      `INSERT INTO lms_connections (
         id, user_id, connector_id, display_name, scopes_json, status,
         created_at, updated_at
       ) VALUES ('connection_sync', ?, 'mock', 'Mock LMS', '[]', 'active', ?, ?)` ,
    )
    .run(context.userId, NOW.toISOString(), NOW.toISOString());
  context.db.database
    .prepare(
      `INSERT INTO lms_course_links (
         id, user_id, course_id, connection_id, source_course_id,
         created_at, updated_at
       ) VALUES ('link_sync', ?, ?, 'connection_sync', 'remote-course', ?, ?)` ,
    )
    .run(
      context.userId,
      context.courseId,
      NOW.toISOString(),
      NOW.toISOString(),
    );
  const connectorData = {
    courses: [
      {
        id: "remote-course",
        name: "Remote Course",
        code: "REMOTE",
        startAt: null,
        endAt: null,
        sourceUrl: null,
        updatedAt: NOW.toISOString(),
      },
    ],
    resources: [
      {
        id: "remote-note",
        courseId: "remote-course",
        fileName: "remote.md",
        mimeType: "text/plain",
        bytes: new TextEncoder().encode("# Synced\nRemote learning material."),
        sourceUrl: "https://lms.example/remote-note",
        updatedAt: NOW.toISOString(),
      },
    ],
  };
  const repository = new ConnectorSyncRepository(context.db);
  const syncService = new CourseSyncService(
    repository,
    async () => new MockConnector(connectorData),
    context.service,
  );
  const input = {
    userId: context.userId,
    role: "student",
    courseId: context.courseId,
    language: "en",
    timezone: "Australia/Sydney",
    now: NOW,
  };
  const first = await syncService.sync(input);
  assert.equal(first.status, "completed");
  assert.equal(first.counts.createdCount, 1);
  const second = await syncService.sync({
    ...input,
    now: new Date("2026-08-03T01:00:00.000Z"),
  });
  assert.equal(second.counts.skippedCount, 1);
  assert.equal(
    context.db.database.prepare("SELECT count(*) AS count FROM resource_versions").get()
      .count,
    1,
  );

  const emptySync = new CourseSyncService(
    repository,
    async () => new MockConnector({ ...connectorData, resources: [] }),
    context.service,
  );
  const third = await emptySync.sync({
    ...input,
    now: new Date("2026-08-03T02:00:00.000Z"),
  });
  assert.equal(third.counts.tombstonedCount, 1);
  assert.equal(
    context.db.database.prepare("SELECT count(*) AS count FROM resource_sync_runs").get()
      .count,
    3,
  );
  assert.equal(
    context.db.database.prepare("SELECT status FROM resources").get().status,
    "tombstoned",
  );
  context.db.close();
});
