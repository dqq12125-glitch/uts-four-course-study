import assert from "node:assert/strict";
import test from "node:test";
import { AuthRepository } from "../src/repositories/auth-repository.ts";
import { AuthService } from "../src/application/auth-service.ts";
import { LearningRepository } from "../src/repositories/learning-repository.ts";
import { OnboardingService } from "../src/application/onboarding-service.ts";
import { createMigratedDatabase } from "./helpers/sqlite-d1.mjs";

test("registration to first completed daily task works end to end at the service boundary", async () => {
  const db = createMigratedDatabase();
  let verifyUrl = "";
  const auth = new AuthService(
    new AuthRepository(db),
    {
      async sendMagicLink(message) {
        verifyUrl = message.verifyUrl;
        return {};
      },
    },
    {
      baseUrl: "https://deepstudy.example",
      ipHashSecret: "e2e-secret",
      environment: "test",
    },
  );
  const now = new Date("2026-07-30T00:00:00.000Z");
  await auth.requestMagicLink({
    email: "newstudent@example.com",
    intent: "sign-up",
    ipAddress: "198.51.100.2",
    language: "zh-CN",
    now,
  });
  const token = new URL(verifyUrl).searchParams.get("token");
  const verified = await auth.verifyMagicLink(token, now);
  assert.ok(await auth.currentUser(verified.sessionToken, now));

  const learning = new LearningRepository(db);
  await new OnboardingService(learning).complete(
    verified.user.id,
    {
      displayName: "新同学",
      language: "zh-CN",
      timezone: "Australia/Sydney",
      dailyStudyMinutes: 45,
      semester: {
        institutionId: null,
        institutionName: "Example University",
        name: "Semester 2",
        startDate: "2026-07-20",
        endDate: "2026-11-20",
      },
      course: {
        templateId: null,
        courseCode: null,
        courseName: "Modern History",
        colourKey: "amber",
        instructorName: null,
      },
      classSessions: [],
      assessments: [
        {
          title: "Source analysis",
          assessmentType: "assignment",
          dueLocal: "2026-08-04T17:00",
          weightPercent: 25,
          estimatedMinutes: 120,
          notes: null,
        },
      ],
    },
    now,
  );

  const today = await learning.today(
    verified.user.id,
    "2026-07-30",
    4,
  );
  assert.ok(today.tasks.length >= 1);
  const task = today.tasks[0];
  assert.ok(task.reason.length > 10);
  assert.ok(task.completionCriteria.length > 20);
  assert.equal(
    await learning.updateTaskStatus(
      verified.user.id,
      task.id,
      "active",
      "2026-07-30T00:05:00.000Z",
    ),
    true,
  );
  assert.equal(
    await learning.updateTaskStatus(
      verified.user.id,
      task.id,
      "completed",
      "2026-07-30T00:35:00.000Z",
    ),
    true,
  );
  assert.equal(
    db.database
      .prepare("SELECT status FROM study_tasks WHERE id = ?")
      .get(task.id).status,
    "completed",
  );
  db.close();
});
