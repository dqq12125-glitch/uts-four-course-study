import assert from "node:assert/strict";
import test from "node:test";
import { LearningRepository } from "../src/repositories/learning-repository.ts";
import { OnboardingService } from "../src/application/onboarding-service.ts";
import {
  createMigratedDatabase,
  seedVerifiedUser,
} from "./helpers/sqlite-d1.mjs";

function onboardingPayload(courseName) {
  return {
    displayName: null,
    language: "en",
    timezone: "Australia/Sydney",
    dailyStudyMinutes: 45,
    semester: {
      institutionId: null,
      institutionName: "Independent University",
      name: "Semester A",
      startDate: "2026-07-01",
      endDate: "2026-12-01",
    },
    course: {
      templateId: null,
      courseCode: null,
      courseName,
      colourKey: "ocean",
      instructorName: null,
    },
    classSessions: [],
    assessments: [
      {
        title: "Private assignment",
        assessmentType: "assignment",
        dueLocal: "2026-08-20T17:00",
        weightPercent: 30,
        estimatedMinutes: 90,
        notes: "Private note",
      },
    ],
  };
}

test("user B cannot read, change, archive, or attach data to user A course", async () => {
  const db = createMigratedDatabase();
  seedVerifiedUser(db, { id: "user_a", email: "a@example.com" });
  seedVerifiedUser(db, { id: "user_b", email: "b@example.com" });
  const repository = new LearningRepository(db);
  const service = new OnboardingService(repository);
  const created = await service.complete(
    "user_a",
    onboardingPayload("Private Astrophysics"),
    new Date("2026-07-30T00:00:00.000Z"),
  );

  assert.equal(await repository.findCourse("user_b", created.courseId), null);
  assert.deepEqual(
    await repository.listAssessments("user_b", created.courseId),
    [],
  );
  assert.equal(
    await repository.updateCourse("user_b", created.courseId, {
      courseCode: "STOLEN",
      courseName: "Changed",
      colourKey: "rose",
      instructorName: null,
      now: "2026-07-30T01:00:00.000Z",
    }),
    false,
  );
  assert.equal(
    await repository.archiveCourse(
      "user_b",
      created.courseId,
      "2026-07-30T01:00:00.000Z",
    ),
    false,
  );
  assert.equal(
    await repository.createAssessment("user_b", {
      id: "assessment_attack",
      courseId: created.courseId,
      title: "Injected",
      assessmentType: "other",
      dueAt: null,
      weightPercent: null,
      estimatedMinutes: null,
      notes: null,
      now: "2026-07-30T01:00:00.000Z",
    }),
    false,
  );

  const ownerCourse = await repository.findCourse("user_a", created.courseId);
  assert.equal(ownerCourse.courseName, "Private Astrophysics");
  assert.equal(
    db.database
      .prepare("SELECT COUNT(*) AS count FROM assessments WHERE user_id = ?")
      .get("user_a").count,
    1,
  );
  db.close();
});
