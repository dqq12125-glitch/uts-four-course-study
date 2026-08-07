import assert from "node:assert/strict";
import test from "node:test";
import { AcademicService } from "../src/application/academic-service.ts";
import { AccountService } from "../src/application/account-service.ts";
import { EntitlementService } from "../src/application/entitlement-service.ts";
import { FeatureFlagService } from "../src/application/feature-flag-service.ts";
import { NotificationService } from "../src/application/notification-service.ts";
import { OnboardingService } from "../src/application/onboarding-service.ts";
import { AcademicRepository } from "../src/repositories/academic-repository.ts";
import { AccountRepository } from "../src/repositories/account-repository.ts";
import { CommerceRepository } from "../src/repositories/commerce-repository.ts";
import { FeatureFlagRepository } from "../src/repositories/feature-flag-repository.ts";
import { LearningRepository } from "../src/repositories/learning-repository.ts";
import { NotificationRepository } from "../src/repositories/notification-repository.ts";
import { InMemoryPrivateObjectStorage } from "../src/services/storage/private-object-storage.ts";
import {
  createMigratedDatabase,
  seedVerifiedUser,
} from "./helpers/sqlite-d1.mjs";

function onboardingPayload(courseName = "Open Environmental Science") {
  return {
    displayName: "Open Course Student",
    language: "en",
    timezone: "Australia/Sydney",
    dailyStudyMinutes: 75,
    semester: {
      institutionId: null,
      institutionName: "Independent University",
      name: "Semester 2 2026",
      startDate: "2026-07-20",
      endDate: "2026-11-30",
    },
    course: {
      templateId: null,
      courseCode: null,
      courseName,
      colourKey: "forest",
      instructorName: null,
    },
    classSessions: [],
    assessments: [],
  };
}

async function fixture({ paid = true } = {}) {
  const db = createMigratedDatabase();
  const userId = `m5_${paid ? "paid" : "free"}_user`;
  seedVerifiedUser(db, {
    id: userId,
    email: `${userId}@example.com`,
  });
  const learning = new LearningRepository(db);
  const onboarded = await new OnboardingService(learning).complete(
    userId,
    onboardingPayload(),
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
           'm5_purchase', ?, 'stripe', 'pi_m5', 'cs_m5',
           'founding_pass', 1900, 'aud', 'active',
           '2026-08-01T00:00:00.000Z', '2026-12-01T00:00:00.000Z',
           '2026-08-01T00:00:00.000Z', '2026-08-01T00:00:00.000Z'
         )`,
      )
      .run(userId);
  }
  const entitlements = new EntitlementService(
    new CommerceRepository(db),
    learning,
  );
  return {
    db,
    userId,
    courseId: onboarded.courseId,
    learning,
    entitlements,
  };
}

test("plan, timetable, topics, and weekly reports remain ownership scoped", async () => {
  const context = await fixture();
  seedVerifiedUser(context.db, {
    id: "m5_other_user",
    email: "m5-other@example.com",
  });
  const repository = new AcademicRepository(context.db);
  const service = new AcademicService(repository, context.entitlements);
  const now = new Date("2026-08-04T02:00:00.000Z");

  assert.equal(
    await repository.createClassSession({
      id: "m5_class",
      userId: context.userId,
      courseId: context.courseId,
      sessionType: "lab",
      title: "Field methods",
      dayOfWeek: 2,
      startTime: "10:00",
      endTime: "12:00",
      location: "Lab 3",
      mapUrl: null,
      startDate: "2026-07-20",
      endDate: "2026-11-30",
      recurrenceRule: "FREQ=WEEKLY",
      now: now.toISOString(),
    }),
    true,
  );
  assert.equal(
    await repository.createTopic({
      id: "m5_topic",
      userId: context.userId,
      courseId: context.courseId,
      title: "Ecosystem energy flow",
      description: "Trophic transfer and efficiency",
      weekNumber: 3,
      sequenceNumber: 1,
      now: now.toISOString(),
    }),
    true,
  );
  const taskId = await service.createTask({
    userId: context.userId,
    courseId: context.courseId,
    topicId: "m5_topic",
    assessmentId: null,
    title: "Explain trophic transfer",
    description: null,
    completionCriteria:
      "Draw one food web and explain two energy losses without notes.",
    taskType: "practice",
    priority: "high",
    estimatedMinutes: 30,
    scheduledFor: "2026-08-04",
    dueAt: null,
    now,
  });
  assert.equal(
    (await service.plan({
      userId: context.userId,
      startDate: "2026-08-04",
      endDate: "2026-08-10",
    })).some((task) => task.id === taskId),
    true,
  );
  await service.reschedule({
    userId: context.userId,
    taskId,
    scheduledFor: "2026-08-05",
    now,
  });
  assert.equal(
    (await service.plan({
      userId: context.userId,
      startDate: "2026-08-05",
      endDate: "2026-08-05",
    }))[0]?.id,
    taskId,
  );
  await assert.rejects(
    service.reorder({
      userId: context.userId,
      scheduledFor: "2026-08-04",
      taskIds: [taskId],
      now,
    }),
    (error) => error.code === "TASK_ORDER_CONFLICT",
  );
  await service.reorder({
    userId: context.userId,
    scheduledFor: "2026-08-05",
    taskIds: [taskId],
    now,
  });

  assert.deepEqual(
    await repository.listClassSessions("m5_other_user", context.courseId),
    [],
  );
  assert.deepEqual(
    await repository.listTopics("m5_other_user", context.courseId),
    [],
  );
  await assert.rejects(
    service.reschedule({
      userId: "m5_other_user",
      taskId,
      scheduledFor: "2026-08-06",
      now,
    }),
    (error) => error.code === "STUDY_TASK_NOT_FOUND",
  );

  const report = await service.weeklyReport({
    userId: context.userId,
    role: "student",
    now,
  });
  assert.equal(report.courses[0]?.courseName, "Open Environmental Science");
  context.db.close();
});

test("notification generation is timezone-aware, deduplicated, deliverable, and isolated", async () => {
  const context = await fixture();
  seedVerifiedUser(context.db, {
    id: "m5_notification_other",
    email: "m5-notification-other@example.com",
  });
  context.db.database
    .prepare(
      `UPDATE user_settings
       SET preferred_study_start_time = '07:00'
       WHERE user_id = ?`,
    )
    .run(context.userId);
  context.db.database
    .prepare(
      `UPDATE study_tasks
       SET scheduled_for = '2026-08-04', status = 'queued'
       WHERE user_id = ?`,
    )
    .run(context.userId);

  const sent = [];
  const email = {
    async sendMagicLink() {
      return {};
    },
    async sendNotification(message) {
      sent.push(message);
      return { providerMessageId: "email_m5" };
    },
  };
  const repository = new NotificationRepository(context.db);
  const service = new NotificationService(
    repository,
    email,
    new FeatureFlagService(
      new FeatureFlagRepository(context.db),
      "test",
    ),
    context.entitlements,
    "https://deepstudy.example",
  );
  const now = new Date("2026-08-03T21:00:00.000Z");
  assert.equal(await service.generate(now), 1);
  assert.equal(await service.generate(now), 0);
  assert.deepEqual(await service.deliverPending(now), {
    sent: 1,
    failed: 0,
  });
  assert.equal(sent.length, 1);
  assert.match(sent[0].actionUrl, /\/app\/today$/);
  const notifications = await service.list(context.userId);
  assert.equal(notifications.length, 1);
  await assert.rejects(
    service.markRead("m5_notification_other", notifications[0].id, now),
    (error) => error.code === "NOTIFICATION_NOT_FOUND",
  );
  await service.markRead(context.userId, notifications[0].id, now);
  assert.equal((await service.list(context.userId))[0].readAt, now.toISOString());
  context.db.close();
});

test("personal export excludes storage keys and account deletion removes private files", async () => {
  const context = await fixture();
  const storage = new InMemoryPrivateObjectStorage();
  const storageKey = `users/${context.userId}/resource/private-notes.txt`;
  await storage.put(
    storageKey,
    new TextEncoder().encode("private notes"),
    "text/plain",
  );
  context.db.database
    .prepare(
      `INSERT INTO learning_resources (
         id, user_id, course_id, file_name, storage_key, mime_type,
         file_size, resource_type, processing_status, retention_until,
         created_at, updated_at, deleted_at
       ) VALUES (
         'm5_resource', ?, ?, 'notes.txt', ?, 'text/plain', 13,
         'personal_notes', 'ready', NULL,
         '2026-08-01T00:00:00.000Z', '2026-08-01T00:00:00.000Z', NULL
       )`,
    )
    .run(context.userId, context.courseId, storageKey);
  const service = new AccountService(
    new AccountRepository(context.db),
    storage,
  );
  const exported = await service.exportData(
    context.userId,
    new Date("2026-08-04T00:00:00.000Z"),
  );
  assert.equal(exported.format, "deepstudy-personal-data-export");
  assert.equal(
    JSON.stringify(exported).includes(storageKey),
    false,
  );
  await service.deleteAccount(
    context.userId,
    "DELETE",
    new Date("2026-08-04T00:05:00.000Z"),
  );
  assert.equal(await storage.get(storageKey), null);
  assert.equal(
    context.db.database
      .prepare("SELECT count(*) AS count FROM users WHERE id = ?")
      .get(context.userId).count,
    0,
  );
  assert.equal(
    context.db.database
      .prepare(
        `SELECT count(*) AS count FROM audit_logs
         WHERE action = 'account_deleted' AND actor_user_id IS NULL`,
      )
      .get().count,
    1,
  );
  context.db.close();
});
