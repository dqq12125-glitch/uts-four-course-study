import assert from "node:assert/strict";
import test from "node:test";
import { AuthRepository } from "../src/repositories/auth-repository.ts";
import { AuthService } from "../src/application/auth-service.ts";
import { LearningRepository } from "../src/repositories/learning-repository.ts";
import { OnboardingService } from "../src/application/onboarding-service.ts";
import {
  createMigratedDatabase,
  seedVerifiedUser,
} from "./helpers/sqlite-d1.mjs";

class CapturingEmailSender {
  messages = [];

  async sendMagicLink(message) {
    this.messages.push(message);
    return { previewUrl: message.verifyUrl };
  }
}

test("migration creates SaaS tables and optional UTS templates only", () => {
  const db = createMigratedDatabase();
  const tables = db.database
    .prepare(
      "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name",
    )
    .all()
    .map((row) => row.name);
  assert.ok(tables.includes("users"));
  assert.ok(tables.includes("courses"));
  assert.ok(tables.includes("study_tasks"));
  assert.equal(
    db.database
      .prepare("SELECT COUNT(*) AS count FROM course_templates")
      .get().count,
    4,
  );
  assert.equal(
    db.database.prepare("SELECT COUNT(*) AS count FROM courses").get().count,
    0,
  );
  assert.equal(
    db.database
      .prepare("SELECT COUNT(*) AS count FROM assessments")
      .get().count,
    0,
  );
  db.close();
});

test("magic-link registration creates a hashed, expiring session", async () => {
  const db = createMigratedDatabase();
  const sender = new CapturingEmailSender();
  const service = new AuthService(
    new AuthRepository(db),
    sender,
    {
      baseUrl: "https://deepstudy.example",
      ipHashSecret: "test-secret",
      environment: "test",
    },
  );
  const now = new Date("2026-07-30T01:00:00.000Z");
  const delivery = await service.requestMagicLink({
    email: "Student@Example.com",
    intent: "sign-up",
    ipAddress: "192.0.2.1",
    language: "en",
    now,
  });
  assert.equal(sender.messages.length, 1);
  assert.match(delivery.previewUrl, /api\/auth\/verify\?token=/);
  const rawToken = new URL(delivery.previewUrl).searchParams.get("token");
  assert.ok(rawToken);

  const stored = db.database
    .prepare("SELECT token_hash FROM magic_link_tokens")
    .get();
  assert.notEqual(stored.token_hash, rawToken);

  const verified = await service.verifyMagicLink(rawToken, now);
  assert.equal(verified.user.email, "student@example.com");
  assert.equal(
    (await service.currentUser(verified.sessionToken, now))?.id,
    verified.user.id,
  );
  assert.equal(
    await service.currentUser(
      verified.sessionToken,
      new Date("2026-09-01T01:00:00.000Z"),
    ),
    null,
  );
  await assert.rejects(
    service.verifyMagicLink(rawToken, now),
    /invalid or has expired/,
  );
  await service.signOut(verified.sessionToken, now);
  assert.equal(await service.currentUser(verified.sessionToken, now), null);
  db.close();
});

test("sign-in resists enumeration and auth requests are persistently limited", async () => {
  const db = createMigratedDatabase();
  const sender = new CapturingEmailSender();
  const service = new AuthService(
    new AuthRepository(db),
    sender,
    {
      baseUrl: "https://deepstudy.example",
      ipHashSecret: "test-secret",
      environment: "test",
    },
  );
  const now = new Date("2026-07-30T01:00:00.000Z");
  const unknown = await service.requestMagicLink({
    email: "unknown@example.com",
    intent: "sign-in",
    ipAddress: "192.0.2.10",
    language: "en",
    now,
  });
  assert.deepEqual(unknown, {});
  assert.equal(sender.messages.length, 0);

  for (let index = 0; index < 5; index += 1) {
    await service.requestMagicLink({
      email: "limited@example.com",
      intent: "sign-up",
      ipAddress: `192.0.2.${20 + index}`,
      language: "en",
      now,
    });
  }
  await assert.rejects(
    service.requestMagicLink({
      email: "limited@example.com",
      intent: "sign-up",
      ipAddress: "192.0.2.99",
      language: "en",
      now,
    }),
    /Too many sign-in attempts/,
  );
  db.close();
});

test("custom institution and arbitrary course complete onboarding", async () => {
  const db = createMigratedDatabase();
  seedVerifiedUser(db, {
    id: "user_open",
    email: "open@example.com",
  });
  const repository = new LearningRepository(db);
  const result = await new OnboardingService(repository).complete(
    "user_open",
    {
      displayName: "Alex",
      language: "en",
      timezone: "Australia/Sydney",
      dailyStudyMinutes: 60,
      semester: {
        institutionId: null,
        institutionName: "Open Learning College",
        name: "Term 3 2026",
        startDate: "2026-07-20",
        endDate: "2026-11-20",
      },
      course: {
        templateId: null,
        courseCode: "BIO101",
        courseName: "Cell Biology",
        colourKey: "forest",
        instructorName: "Dr Nguyen",
      },
      classSessions: [
        {
          sessionType: "lab",
          title: "Weekly lab",
          dayOfWeek: 1,
          startTime: "10:00",
          endTime: "12:00",
          location: "Science 2",
          mapUrl: null,
        },
      ],
      assessments: [
        {
          title: "Microscopy report",
          assessmentType: "lab",
          dueLocal: "2026-08-15T17:00",
          weightPercent: 20,
          estimatedMinutes: 180,
          notes: null,
        },
      ],
    },
    new Date("2026-07-30T00:00:00.000Z"),
  );

  assert.ok(result.taskCount >= 1);
  const course = await repository.findCourse("user_open", result.courseId);
  assert.equal(course.courseName, "Cell Biology");
  assert.equal(course.courseTemplateId, null);
  const assessments = await repository.listAssessments(
    "user_open",
    result.courseId,
  );
  assert.equal(assessments[0].title, "Microscopy report");
  assert.equal(assessments[0].dueAt, "2026-08-15T07:00:00.000Z");
  const today = await repository.today("user_open", "2026-07-30", 1);
  assert.ok(today.tasks.length >= 1);
  assert.equal(today.classSessions[0].title, "Weekly lab");
  db.close();
});
