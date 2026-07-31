import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateTaskPriority,
  priorityLabel,
} from "../src/domain/planning/task-priority.ts";
import { fitDailyCapacity } from "../src/domain/planning/daily-capacity.ts";
import { generateDailyPlan } from "../src/domain/planning/plan-generator.ts";
import {
  localDateKey,
  zonedDateTimeToUtc,
} from "../src/lib/timezone.ts";
import {
  courseInputSchema,
  onboardingInputSchema,
} from "../src/lib/schemas.ts";
import { sessionCookie } from "../src/lib/cookies.ts";
import { matchesPersonalOwner } from "../src/application/personal-access.ts";

test("priority is explainable and rises for close, weighted deadlines", () => {
  const now = new Date("2026-08-10T00:00:00.000Z");
  const near = calculateTaskPriority({
    now,
    dueAt: new Date("2026-08-11T00:00:00.000Z"),
    weightPercent: 40,
    estimatedMinutes: 30,
  });
  const far = calculateTaskPriority({
    now,
    dueAt: new Date("2026-09-10T00:00:00.000Z"),
    weightPercent: 10,
    estimatedMinutes: 30,
  });

  assert.ok(near.deadlineUrgency > far.deadlineUrgency);
  assert.ok(near.assessmentWeight > far.assessmentWeight);
  assert.ok(near.total > far.total);
  assert.equal(priorityLabel(near.total), "high");
});

test("daily capacity does not silently overfill non-critical work", () => {
  const result = fitDailyCapacity(
    [
      { id: "a", estimatedMinutes: 40, priority: "high", priorityScore: 50 },
      { id: "b", estimatedMinutes: 30, priority: "medium", priorityScore: 30 },
      { id: "c", estimatedMinutes: 20, priority: "low", priorityScore: 10 },
    ],
    60,
  );
  assert.deepEqual(
    result.scheduled.map((task) => task.id),
    ["a", "c"],
  );
  assert.equal(result.overload, false);
});

test("critical work can surface with an explicit overload signal", () => {
  const result = fitDailyCapacity(
    [
      {
        id: "critical",
        estimatedMinutes: 90,
        priority: "critical",
        priorityScore: 90,
      },
    ],
    45,
  );
  assert.equal(result.scheduled[0].id, "critical");
  assert.equal(result.overload, true);
});

test("plan generator accepts courses outside the four starter templates", () => {
  const plan = generateDailyPlan({
    courses: [
      {
        id: "course_bio",
        courseCode: "BIO101",
        courseName: "Cell Biology",
      },
      {
        id: "course_language",
        courseCode: null,
        courseName: "Academic English",
      },
    ],
    assessments: [],
    dailyStudyMinutes: 45,
    timezone: "Australia/Sydney",
    language: "en",
    now: new Date("2026-08-10T00:00:00.000Z"),
  });

  assert.equal(plan.tasks.length, 2);
  assert.match(plan.tasks[0].title, /Cell Biology|Academic English/);
  assert.ok(plan.tasks.every((task) => task.completionCriteria.length > 20));
});

test("Sydney local dates and daylight-saving gaps are handled", () => {
  assert.equal(
    localDateKey(
      new Date("2026-07-30T15:30:00.000Z"),
      "Australia/Sydney",
    ),
    "2026-07-31",
  );
  assert.equal(
    zonedDateTimeToUtc(
      "2026-08-10T09:00",
      "Australia/Sydney",
    ).toISOString(),
    "2026-08-09T23:00:00.000Z",
  );
  assert.throws(
    () =>
      zonedDateTimeToUtc(
        "2026-10-04T02:30",
        "Australia/Sydney",
      ),
    /does not exist/,
  );
});

test("schema permits name-only custom courses and defers template-aware naming", () => {
  assert.equal(
    courseInputSchema.safeParse({
      templateId: null,
      courseCode: null,
      courseName: "Academic English",
      colourKey: "forest",
      instructorName: null,
    }).success,
    true,
  );

  const invalid = onboardingInputSchema.safeParse({
    language: "zh-CN",
    timezone: "Australia/Sydney",
    dailyStudyMinutes: 60,
    semester: {
      institutionName: "Any University",
      name: "Term 1",
      startDate: "2026-02-01",
      endDate: "2026-06-01",
    },
    course: {
      courseName: null,
      colourKey: "ocean",
    },
    classSessions: [],
    assessments: [],
  });
  assert.equal(invalid.success, true);
  // Cross-field/template-aware name enforcement belongs to OnboardingService.
});

test("production session cookie is HttpOnly, Secure, and SameSite Lax", () => {
  const cookie = sessionCookie(
    "opaque-token",
    new Date("2026-08-30T00:00:00.000Z"),
    true,
  );
  assert.match(cookie, /HttpOnly/);
  assert.match(cookie, /Secure/);
  assert.match(cookie, /SameSite=Lax/);
  assert.match(cookie, /Path=\//);
});

test("personal workspace access is exact, case-insensitive, and fail-closed", () => {
  assert.equal(
    matchesPersonalOwner(
      "Owner.Student@Example.com",
      " owner.student@example.com ",
    ),
    true,
  );
  assert.equal(
    matchesPersonalOwner(
      "other.student@example.com",
      "owner.student@example.com",
    ),
    false,
  );
  assert.equal(
    matchesPersonalOwner("owner.student@example.com", undefined),
    false,
  );
  assert.equal(matchesPersonalOwner("owner.student@example.com", "  "), false);
});
