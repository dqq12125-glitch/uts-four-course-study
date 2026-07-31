import assert from "node:assert/strict";
import test from "node:test";
import { AiTutorService } from "../src/application/ai-tutor-service.ts";
import { EntitlementService } from "../src/application/entitlement-service.ts";
import { FeatureFlagService } from "../src/application/feature-flag-service.ts";
import { OnboardingService } from "../src/application/onboarding-service.ts";
import { ResourceService } from "../src/application/resource-service.ts";
import { AiRepository } from "../src/repositories/ai-repository.ts";
import { CommerceRepository } from "../src/repositories/commerce-repository.ts";
import { FeatureFlagRepository } from "../src/repositories/feature-flag-repository.ts";
import { LearningRepository } from "../src/repositories/learning-repository.ts";
import { ResourceRepository } from "../src/repositories/resource-repository.ts";
import { MockAiProvider } from "../src/services/ai/mock-ai-provider.ts";
import { InMemoryPrivateObjectStorage } from "../src/services/storage/private-object-storage.ts";
import { AiUsageService } from "../src/services/usage/ai-usage-service.ts";
import {
  createMigratedDatabase,
  seedVerifiedUser,
} from "./helpers/sqlite-d1.mjs";

function onboardingPayload(courseName) {
  return {
    displayName: "Learning Student",
    language: "en",
    timezone: "Australia/Sydney",
    dailyStudyMinutes: 60,
    semester: {
      institutionId: null,
      institutionName: "Any University",
      name: "Open Semester",
      startDate: "2026-07-20",
      endDate: "2026-11-30",
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
  };
}

async function fixture({ paid = false } = {}) {
  const db = createMigratedDatabase();
  const userId = paid ? "paid_learning_user" : "free_learning_user";
  seedVerifiedUser(db, {
    id: userId,
    email: `${userId}@example.com`,
  });
  const learning = new LearningRepository(db);
  const onboarded = await new OnboardingService(learning).complete(
    userId,
    onboardingPayload("Open Biology"),
    new Date("2026-08-01T00:00:00.000Z"),
  );
  if (paid) {
    db.database
      .prepare(
        `INSERT INTO purchases (
           id, user_id, provider, provider_payment_id,
           provider_checkout_session_id, product_key, amount_minor,
           currency, status, access_start_at, access_end_at,
           created_at, updated_at
         ) VALUES (
           'purchase_paid_learning', ?, 'stripe', 'pi_paid_learning',
           'cs_paid_learning', 'founding_pass', 1900, 'aud', 'active',
           '2026-08-01T00:00:00.000Z', '2026-12-01T00:00:00.000Z',
           '2026-08-01T00:00:00.000Z', '2026-08-01T00:00:00.000Z'
         )`,
      )
      .run(userId);
  }
  const commerce = new CommerceRepository(db);
  const entitlement = new EntitlementService(commerce, learning);
  const flags = new FeatureFlagService(
    new FeatureFlagRepository(db),
    "test",
  );
  const aiRepository = new AiRepository(db);
  return {
    db,
    userId,
    courseId: onboarded.courseId,
    learning,
    entitlement,
    flags,
    aiRepository,
  };
}

test("AI tutor is Hint-first, user-scoped, logged, and limited by local day", async () => {
  const context = await fixture();
  seedVerifiedUser(context.db, {
    id: "other_ai_user",
    email: "other-ai@example.com",
  });
  const service = new AiTutorService(
    context.aiRepository,
    new MockAiProvider(),
    context.entitlement,
    context.flags,
    new AiUsageService(context.aiRepository),
  );
  const now = new Date("2026-08-01T01:00:00.000Z");
  const first = await service.tutor({
    userId: context.userId,
    role: "student",
    timezone: "Australia/Sydney",
    request: {
      courseId: context.courseId,
      message:
        "Give me the final answer for this graded assignment question.",
      language: "en",
      suspectedAssessedWork: false,
      resourceIds: [],
    },
    now,
  });
  assert.equal(first.safetyMode, "integrity_guidance");
  assert.match(first.reply, /will not provide a submission-ready answer/i);
  assert.match(first.reply, /What have you tried so far\?/);
  assert.equal(first.remainingToday, 2);

  await assert.rejects(
    service.tutor({
      userId: "other_ai_user",
      role: "student",
      timezone: "Australia/Sydney",
      request: {
        courseId: context.courseId,
        message: "Read another student's course.",
        language: "en",
        resourceIds: [],
      },
      now,
    }),
    (error) => error.code === "COURSE_CONTEXT_NOT_FOUND",
  );

  for (let index = 0; index < 2; index += 1) {
    await service.tutor({
      userId: context.userId,
      role: "student",
      timezone: "Australia/Sydney",
      request: {
        courseId: context.courseId,
        conversationId: first.conversationId,
        message: `My attempt ${index + 1}`,
        studentAttempt: "I wrote the relevant definition.",
        language: "en",
        resourceIds: [],
      },
      now: new Date(now.getTime() + (index + 1) * 1_000),
    });
  }
  await assert.rejects(
    service.tutor({
      userId: context.userId,
      role: "student",
      timezone: "Australia/Sydney",
      request: {
        courseId: context.courseId,
        conversationId: first.conversationId,
        message: "Fourth request",
        language: "en",
        resourceIds: [],
      },
      now: new Date(now.getTime() + 4_000),
    }),
    (error) => error.code === "AI_DAILY_LIMIT_REACHED",
  );
  assert.equal(
    context.db.database
      .prepare(
        `SELECT count(*) AS count FROM ai_usage_logs
         WHERE user_id = ? AND success = 1`,
      )
      .get(context.userId).count,
    3,
  );
  assert.equal(
    context.db.database
      .prepare(
        `SELECT count(*) AS count FROM ai_messages
         WHERE user_id = ?`,
      )
      .get(context.userId).count,
    6,
  );
  context.db.close();
});

test("private ICS upload requires paid entitlement and imports only after confirmation", async () => {
  const free = await fixture();
  const freeService = new ResourceService(
    new ResourceRepository(free.db),
    free.aiRepository,
    new InMemoryPrivateObjectStorage(),
    new MockAiProvider(),
    free.entitlement,
    free.flags,
  );
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
  await assert.rejects(
    freeService.upload({
      userId: free.userId,
      role: "student",
      courseId: free.courseId,
      fileName: "timetable.ics",
      mimeType: "text/calendar",
      bytes: new TextEncoder().encode(ics),
      resourceType: "timetable",
      language: "en",
      timezone: "Australia/Sydney",
      now: new Date("2026-08-01T00:00:00.000Z"),
    }),
    (error) => error.code === "RESOURCE_UPLOAD_REQUIRES_PASS",
  );
  free.db.close();

  const paid = await fixture({ paid: true });
  seedVerifiedUser(paid.db, {
    id: "other_resource_user",
    email: "other-resource@example.com",
  });
  const storage = new InMemoryPrivateObjectStorage();
  const service = new ResourceService(
    new ResourceRepository(paid.db),
    paid.aiRepository,
    storage,
    new MockAiProvider(),
    paid.entitlement,
    paid.flags,
  );
  const uploaded = await service.upload({
    userId: paid.userId,
    role: "student",
    courseId: paid.courseId,
    fileName: "timetable.ics",
    mimeType: "text/calendar",
    bytes: new TextEncoder().encode(ics),
    resourceType: "timetable",
    language: "en",
    timezone: "Australia/Sydney",
    now: new Date("2026-08-01T00:00:00.000Z"),
  });
  assert.equal(uploaded.processingStatus, "awaiting_confirmation");
  const proposal = JSON.parse(uploaded.proposedDataJson);
  assert.equal(proposal.assessments.length, 1);
  assert.equal(proposal.classSessions.length, 1);
  assert.equal(
    paid.db.database.prepare("SELECT count(*) AS count FROM assessments").get()
      .count,
    0,
  );
  assert.equal(
    paid.db.database
      .prepare("SELECT count(*) AS count FROM class_sessions")
      .get().count,
    0,
  );
  await assert.rejects(
    service.detail("other_resource_user", uploaded.id),
    (error) => error.code === "RESOURCE_NOT_FOUND",
  );

  const confirmed = await service.confirm({
    userId: paid.userId,
    resourceId: uploaded.id,
    timezone: "Australia/Sydney",
    assessmentIndexes: [0],
    classSessionIndexes: [0],
    topicIndexes: [],
    now: new Date("2026-08-01T00:01:00.000Z"),
  });
  assert.deepEqual(confirmed, {
    assessmentCount: 1,
    classSessionCount: 1,
    topicCount: 0,
    skippedDuplicateCount: 0,
  });
  assert.equal(
    paid.db.database
      .prepare(
        `SELECT source_type AS sourceType FROM assessments
         WHERE user_id = ?`,
      )
      .get(paid.userId).sourceType,
    "imported",
  );
  assert.equal(
    paid.db.database
      .prepare(
        `SELECT due_at AS dueAt FROM assessments WHERE user_id = ?`,
      )
      .get(paid.userId).dueAt,
    "2026-08-10T13:59:00.000Z",
  );
  await assert.rejects(
    service.confirm({
      userId: paid.userId,
      resourceId: uploaded.id,
      timezone: "Australia/Sydney",
      assessmentIndexes: [0],
      classSessionIndexes: [0],
      topicIndexes: [],
    }),
    (error) => error.code === "RESOURCE_ALREADY_CONFIRMED",
  );
  const downloaded = await service.download(paid.userId, uploaded.id);
  assert.equal(
    new TextDecoder().decode(downloaded.bytes).includes("BEGIN:VCALENDAR"),
    true,
  );
  await assert.rejects(
    service.download("other_resource_user", uploaded.id),
    (error) => error.code === "RESOURCE_NOT_FOUND",
  );
  assert.deepEqual(
    await service.delete({
      userId: paid.userId,
      actorUserId: paid.userId,
      resourceId: uploaded.id,
      now: new Date("2026-08-01T00:02:00.000Z"),
    }),
    { physicallyDeleted: true },
  );
  await assert.rejects(
    service.detail(paid.userId, uploaded.id),
    (error) => error.code === "RESOURCE_NOT_FOUND",
  );
  paid.db.close();
});
