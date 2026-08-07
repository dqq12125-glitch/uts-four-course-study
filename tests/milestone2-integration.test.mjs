import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";
import { LearningRepository } from "../src/repositories/learning-repository.ts";
import { LearningLoopRepository } from "../src/repositories/learning-loop-repository.ts";
import { OnboardingService } from "../src/application/onboarding-service.ts";
import { LearningLoopService } from "../src/application/learning-loop-service.ts";
import { PlanRebalanceService } from "../src/application/plan-rebalance-service.ts";
import {
  localDateKey,
  localDayOfWeek,
} from "../src/lib/timezone.ts";
import {
  createMigratedDatabase,
  seedVerifiedUser,
} from "./helpers/sqlite-d1.mjs";

function applyMigration(database, fileName) {
  const migration = readFileSync(
    resolve(process.cwd(), "drizzle", fileName),
    "utf8",
  );
  for (const statement of migration.split("--> statement-breakpoint")) {
    if (statement.trim()) database.exec(statement);
  }
}

function onboardingPayload(courseName) {
  return {
    displayName: "Milestone Two",
    language: "en",
    timezone: "Australia/Sydney",
    dailyStudyMinutes: 60,
    semester: {
      institutionId: null,
      institutionName: "Open Course University",
      name: "Semester 2",
      startDate: "2026-07-20",
      endDate: "2026-11-20",
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

async function onboard(db, userId, email, courseName) {
  seedVerifiedUser(db, { id: userId, email });
  const learning = new LearningRepository(db);
  const created = await new OnboardingService(learning).complete(
    userId,
    onboardingPayload(courseName),
    new Date("2026-08-01T00:00:00.000Z"),
  );
  return { learning, ...created };
}

test("additive retry migrations preserve existing practice sessions and attempts", () => {
  const database = new DatabaseSync(":memory:");
  database.exec("PRAGMA foreign_keys = ON");
  applyMigration(database, "0000_uneven_satana.sql");
  applyMigration(database, "0001_legal_klaw.sql");
  applyMigration(database, "0002_curly_starhawk.sql");
  const now = "2026-08-01T00:00:00.000Z";
  database
    .prepare(
      `INSERT INTO users (
         id, email, preferred_language, timezone, role, status,
         created_at, updated_at
       ) VALUES ('migration_user', 'migration@example.com', 'en',
         'Australia/Sydney', 'student', 'active', ?, ?)`,
    )
    .run(now, now);
  database
    .prepare(
      `INSERT INTO user_semesters (
         id, user_id, institution_name, name, start_date, end_date,
         status, created_at, updated_at
       ) VALUES ('migration_semester', 'migration_user', 'Open University',
         'Semester 2', '2026-07-20', '2026-11-20', 'active', ?, ?)`,
    )
    .run(now, now);
  database
    .prepare(
      `INSERT INTO courses (
         id, user_id, user_semester_id, course_name, colour_key,
         source_type, created_at, updated_at
       ) VALUES ('migration_course', 'migration_user', 'migration_semester',
         'Open Biology', 'ocean', 'manual', ?, ?)`,
    )
    .run(now, now);
  database
    .prepare(
      `INSERT INTO topics (
         id, course_id, user_id, title, sequence_number, created_at, updated_at
       ) VALUES ('migration_topic', 'migration_course', 'migration_user',
         'Cells', 0, ?, ?)`,
    )
    .run(now, now);
  database
    .prepare(
      `INSERT INTO practice_questions (
         id, course_id, topic_id, owner_user_id, prompt, solution,
         explanation, created_at, updated_at
       ) VALUES ('migration_question', 'migration_course', 'migration_topic',
         'migration_user', 'Question?', '0', 'Explanation', ?, ?)`,
    )
    .run(now, now);
  database
    .prepare(
      `INSERT INTO practice_sessions (
         id, user_id, course_id, topic_id, practice_question_id,
         status, hints_used, started_at, created_at
       ) VALUES ('migration_session', 'migration_user', 'migration_course',
         'migration_topic', 'migration_question', 'active', 1, ?, ?)`,
    )
    .run(now, now);

  applyMigration(database, "0003_crazy_jack_murdock.sql");
  assert.deepEqual(
    {
      ...database
        .prepare(
          `SELECT hints_used, incorrect_attempts
           FROM practice_sessions WHERE id = 'migration_session'`,
        )
        .get(),
    },
    { hints_used: 1, incorrect_attempts: 0 },
  );
  assert.throws(() =>
    database
      .prepare(
        `INSERT INTO practice_sessions (
           id, user_id, course_id, topic_id, practice_question_id,
           status, started_at, created_at
         ) VALUES ('migration_duplicate', 'migration_user',
           'migration_course', 'migration_topic', 'migration_question',
           'active', ?, ?)`,
      )
      .run(now, now),
  );

  database
    .prepare(
      `INSERT INTO practice_attempts (
         id, user_id, practice_question_id, topic_id, practice_session_id,
         answer, is_correct, score, hints_used, time_spent_seconds,
         error_type, attempted_at
       ) VALUES ('migration_attempt', 'migration_user',
         'migration_question', 'migration_topic', 'migration_session',
         '0', 1, 100, 1, 90, 'unknown', ?)`,
    )
    .run(now);
  applyMigration(database, "0004_goofy_kid_colt.sql");
  assert.deepEqual(
    {
      ...database
        .prepare(
          `SELECT hints_used, incorrect_attempts
           FROM practice_attempts WHERE id = 'migration_attempt'`,
        )
        .get(),
    },
    { hints_used: 1, incorrect_attempts: 0 },
  );
  database.close();
});

test("focus session uses server time and can complete its owned task", async () => {
  const db = createMigratedDatabase();
  const owner = await onboard(
    db,
    "focus_owner",
    "focus@example.com",
    "Open Geology",
  );
  seedVerifiedUser(db, { id: "focus_other", email: "other@example.com" });
  const repository = new LearningLoopRepository(db);
  const service = new LearningLoopService(repository);
  const task = db.database
    .prepare(
      "SELECT id FROM study_tasks WHERE user_id = ? ORDER BY created_at LIMIT 1",
    )
    .get("focus_owner");

  const session = await service.startFocusSession(
    "focus_owner",
    { taskId: task.id, plannedMinutes: 25 },
    new Date("2026-08-01T01:00:00.000Z"),
  );
  assert.equal(session.plannedMinutes, 25);
  await assert.rejects(
    service.completeFocusSession(
      "focus_other",
      session.id,
      {
        completionStatus: "completed",
        needsMorePractice: false,
      },
      new Date("2026-08-01T01:25:00.000Z"),
    ),
    (error) => error.code === "FOCUS_SESSION_NOT_FOUND",
  );

  const completed = await service.completeFocusSession(
    "focus_owner",
    session.id,
    {
      completionStatus: "completed",
      difficulty: 3,
      needsMorePractice: true,
      confidenceAfter: 3,
    },
    new Date("2026-08-01T01:25:00.000Z"),
  );
  assert.equal(completed.actualSeconds, 1_500);
  assert.equal(
    db.database.prepare("SELECT status FROM study_tasks WHERE id = ?").get(
      task.id,
    ).status,
    "completed",
  );
  assert.equal(
    db.database
      .prepare(
        "SELECT actual_seconds, needs_more_practice FROM focus_sessions WHERE id = ?",
      )
      .get(session.id).actual_seconds,
    1_500,
  );
  assert.equal(await repository.findActiveFocusSession("focus_owner"), null);
  assert.ok(owner.courseId);
  db.close();
});

test("wrong practice records evidence, creates one retest, and delayed success extends it", async () => {
  const db = createMigratedDatabase();
  const owner = await onboard(
    db,
    "practice_owner",
    "practice@example.com",
    "Environmental Ethics",
  );
  seedVerifiedUser(db, {
    id: "practice_other",
    email: "practice-other@example.com",
  });
  const repository = new LearningLoopRepository(db);
  const service = new LearningLoopService(repository);
  const question = await service.createPrivateQuestion(
    "practice_owner",
    {
      courseId: owner.courseId,
      topicTitle: "Ethical frameworks",
      difficulty: 2,
      prompt: "Which framework focuses on consequences?",
      options: [
        "Utilitarianism",
        "Deontology",
        "Virtue ethics",
        "Contractualism",
      ],
      correctChoiceIndex: 0,
      hint1: "Look for the framework that evaluates outcomes.",
      hint2: "It is associated with maximising overall welfare.",
      hint3: null,
      explanation:
        "Utilitarian reasoning evaluates actions by their consequences.",
      language: "en",
    },
    new Date("2026-08-01T00:00:00.000Z"),
  );
  assert.ok(question.questionId);

  await assert.rejects(
    service.createPrivateQuestion(
      "practice_other",
      {
        courseId: owner.courseId,
        topicTitle: "Stolen topic",
        difficulty: 1,
        prompt: "Private?",
        options: ["Yes", "No"],
        correctChoiceIndex: 0,
        hint1: "Private",
        explanation: "Private",
        language: "en",
      },
      new Date("2026-08-01T00:00:00.000Z"),
    ),
    (error) => error.code === "COURSE_NOT_FOUND",
  );

  const startedAt = new Date("2026-08-01T00:10:00.000Z");
  const { session } = await service.startPracticeSession(
    "practice_owner",
    {
      courseId: owner.courseId,
      confidenceBefore: 2,
    },
    startedAt,
  );
  await assert.rejects(
    service.getPracticeSession("practice_other", session.sessionId),
    (error) => error.code === "PRACTICE_SESSION_NOT_FOUND",
  );
  const hint = await service.requestHint(
    "practice_owner",
    session.sessionId,
  );
  assert.equal(hint.hintsUsed, 1);

  const wrong = await service.submitAttempt(
    "practice_owner",
    session.sessionId,
    "2",
    "Australia/Sydney",
    new Date("2026-08-01T00:12:00.000Z"),
  );
  assert.equal(wrong.isCorrect, false);
  assert.equal(wrong.hintsUsed, 1);
  assert.equal(wrong.reviewIntervalHours, 18);
  assert.equal(wrong.timeSpentSeconds, 120);

  await service.updateAttemptMetadata(
    "practice_owner",
    wrong.attemptId,
    { errorType: "concept", confidenceAfter: 2 },
    new Date("2026-08-01T00:13:00.000Z"),
  );
  await assert.rejects(
    service.updateAttemptMetadata(
      "practice_other",
      wrong.attemptId,
      { errorType: "logic", confidenceAfter: 5 },
    ),
    (error) => error.code === "PRACTICE_ATTEMPT_NOT_FOUND",
  );

  const attemptRow = db.database
    .prepare(
      `SELECT hints_used, error_type, time_spent_seconds
       FROM practice_attempts WHERE id = ?`,
    )
    .get(wrong.attemptId);
  assert.deepEqual({ ...attemptRow }, {
    hints_used: 1,
    error_type: "concept",
    time_spent_seconds: 120,
  });
  const firstMastery = db.database
    .prepare(
      `SELECT mastery_score, next_review_at, consecutive_incorrect
       FROM mastery_records WHERE user_id = ?`,
    )
    .get("practice_owner");
  assert.equal(firstMastery.mastery_score, 0);
  assert.equal(firstMastery.consecutive_incorrect, 1);
  assert.equal(firstMastery.next_review_at, wrong.nextReviewAt);

  const openRetest = db.database
    .prepare(
      `SELECT id, scheduled_for, due_at, status
       FROM study_tasks
       WHERE user_id = ? AND task_type = 'retest'
         AND status IN ('queued', 'active', 'overdue')`,
    )
    .get("practice_owner");
  assert.ok(openRetest);
  assert.equal(openRetest.due_at, wrong.nextReviewAt);
  assert.equal(
    openRetest.scheduled_for,
    localDateKey(new Date(wrong.nextReviewAt), "Australia/Sydney"),
  );

  const dueAt = new Date(Date.parse(wrong.nextReviewAt) + 1_000);
  const today = await owner.learning.today(
    "practice_owner",
    localDateKey(dueAt, "Australia/Sydney"),
    localDayOfWeek(dueAt, "Australia/Sydney"),
    dueAt.toISOString(),
  );
  assert.equal(
    today.tasks.some(
      (task) => task.id === openRetest.id && task.taskType === "retest",
    ),
    true,
  );

  const delayed = await service.startPracticeSession(
    "practice_owner",
    {
      courseId: owner.courseId,
      studyTaskId: openRetest.id,
      confidenceBefore: 2,
    },
    dueAt,
  );
  const delayedCorrect = await service.submitAttempt(
    "practice_owner",
    delayed.session.sessionId,
    "0",
    "Australia/Sydney",
    new Date(dueAt.getTime() + 90_000),
  );
  assert.equal(delayedCorrect.isCorrect, true);
  assert.equal(delayedCorrect.reviewIntervalHours, 48);
  assert.equal(
    db.database
      .prepare(
        `SELECT COUNT(*) AS count FROM study_tasks
         WHERE user_id = ? AND task_type = 'retest'
           AND status IN ('queued', 'active', 'overdue')`,
      )
      .get("practice_owner").count,
    1,
  );
  assert.equal(
    db.database
      .prepare("SELECT status FROM study_tasks WHERE id = ?")
      .get(openRetest.id).status,
    "completed",
  );
  const mastery = await repository.findMastery(
    "practice_owner",
    question.topicId,
  );
  assert.equal(mastery.consecutiveCorrect, 1);
  assert.equal(mastery.reviewIntervalHours, 48);
  db.close();
});

test("plan rebalance previews critical moves and applies only owned changes", async () => {
  const db = createMigratedDatabase();
  const owner = await onboard(
    db,
    "plan_owner",
    "plan@example.com",
    "Open Statistics",
  );
  seedVerifiedUser(db, { id: "plan_other", email: "plan-other@example.com" });
  const starter = db.database
    .prepare("SELECT id FROM study_tasks WHERE user_id = ? LIMIT 1")
    .get("plan_owner");
  db.database
    .prepare(
      `UPDATE study_tasks
       SET scheduled_for = '2026-07-30', status = 'overdue',
           estimated_minutes = 40
       WHERE id = ?`,
    )
    .run(starter.id);
  const now = "2026-08-01T00:00:00.000Z";
  db.database
    .prepare(
      `INSERT INTO study_tasks (
         id, user_id, course_id, title, completion_criteria, reason,
         task_type, priority, priority_score, estimated_minutes,
         scheduled_for, status, generated_by, created_at, updated_at
       ) VALUES (
         'critical_plan_task', ?, ?, 'Critical deadline', 'Submit draft',
         'Deadline risk', 'assessment', 'critical', 95, 45,
         '2026-07-31', 'overdue', 'user', ?, ?
       )`,
    )
    .run("plan_owner", owner.courseId, now, now);

  const service = new PlanRebalanceService(
    new LearningLoopRepository(db),
  );
  const preview = await service.rebalance(
    "plan_owner",
    {
      startDate: "2026-08-01",
      dailyCapacityMinutes: 60,
      confirmCritical: false,
    },
    new Date(now),
  );
  assert.equal(preview.criticalWarnings.length, 1);
  assert.equal(
    db.database
      .prepare("SELECT scheduled_for FROM study_tasks WHERE id = ?")
      .get("critical_plan_task").scheduled_for,
    "2026-07-31",
  );
  assert.equal(
    await new LearningLoopRepository(db).applyRebalanceChanges(
      "plan_other",
      [{ taskId: starter.id, scheduledFor: "2027-01-01" }],
      now,
    ),
    0,
  );

  const confirmed = await service.rebalance(
    "plan_owner",
    {
      startDate: "2026-08-01",
      dailyCapacityMinutes: 60,
      confirmCritical: true,
    },
    new Date(now),
  );
  assert.ok(confirmed.updated >= 1);
  assert.notEqual(
    db.database
      .prepare("SELECT scheduled_for FROM study_tasks WHERE id = ?")
      .get("critical_plan_task").scheduled_for,
    "2026-07-31",
  );
  db.close();
});
