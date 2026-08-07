import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateMasteryUpdate,
} from "../src/domain/mastery/mastery-calculator.ts";
import {
  nextReviewInstant,
} from "../src/domain/mastery/review-interval.ts";
import {
  isReviewDue,
  masteryBand,
  reviewQueueStatus,
} from "../src/domain/mastery/review-queue.ts";
import {
  rebalancePlan,
} from "../src/domain/planning/plan-rebalancer.ts";
import { localDateKey } from "../src/lib/timezone.ts";
import { privatePracticeQuestionSchema } from "../src/lib/schemas.ts";

function evidence(overrides = {}) {
  return {
    isCorrect: true,
    hintsUsed: 0,
    incorrectAttempts: 0,
    timeSpentSeconds: 60,
    difficulty: 2,
    confidenceBefore: 3,
    confidenceAfter: null,
    isDelayedReview: false,
    attemptedAt: new Date("2026-08-01T00:00:00.000Z"),
    ...overrides,
  };
}

function previousFrom(update) {
  return {
    masteryScore: update.masteryScore,
    confidenceScore: update.confidenceScore,
    lastAttemptAt: update.lastAttemptAt,
    lastCorrectAt: update.lastCorrectAt,
    nextReviewAt: update.nextReviewAt,
    reviewIntervalHours: update.reviewIntervalHours,
    consecutiveCorrect: update.consecutiveCorrect,
    consecutiveIncorrect: update.consecutiveIncorrect,
  };
}

test("first independent correct schedules a 48-hour review", () => {
  const update = calculateMasteryUpdate(evidence(), null);
  assert.equal(update.masteryScore, 20);
  assert.equal(update.consecutiveCorrect, 1);
  assert.equal(update.reviewIntervalHours, 48);
  assert.equal(update.nextReviewAt, "2026-08-03T00:00:00.000Z");
});

test("first wrong answer stays low and schedules an earlier review", () => {
  const update = calculateMasteryUpdate(
    evidence({ isCorrect: false }),
    null,
  );
  assert.equal(update.masteryScore, 0);
  assert.equal(update.consecutiveIncorrect, 1);
  assert.equal(update.reviewIntervalHours, 18);
  assert.equal(update.nextReviewAt, "2026-08-01T18:00:00.000Z");
});

test("correct after hints gains little and does not start an independent streak", () => {
  const update = calculateMasteryUpdate(
    evidence({ hintsUsed: 2 }),
    null,
  );
  assert.equal(update.masteryScore, 8);
  assert.equal(update.consecutiveCorrect, 0);
  assert.equal(update.reviewIntervalHours, 36);
});

test("correct after an initial wrong check is not counted as independent mastery", () => {
  const update = calculateMasteryUpdate(
    evidence({ incorrectAttempts: 1 }),
    null,
  );
  assert.equal(update.masteryScore, 8);
  assert.equal(update.consecutiveCorrect, 0);
  assert.equal(update.reviewIntervalHours, 36);
});

test("correct delayed review extends the interval while failed review shortens it", () => {
  const first = calculateMasteryUpdate(evidence(), null);
  const delayedCorrect = calculateMasteryUpdate(
    evidence({
      attemptedAt: new Date(first.nextReviewAt),
      isDelayedReview: true,
    }),
    previousFrom(first),
  );
  assert.equal(delayedCorrect.masteryScore, 46);
  assert.equal(delayedCorrect.consecutiveCorrect, 2);
  assert.equal(delayedCorrect.reviewIntervalHours, 96);

  const delayedWrong = calculateMasteryUpdate(
    evidence({
      isCorrect: false,
      attemptedAt: new Date(delayedCorrect.nextReviewAt),
      isDelayedReview: true,
    }),
    previousFrom(delayedCorrect),
  );
  assert.equal(delayedWrong.masteryScore, 30);
  assert.equal(delayedWrong.consecutiveCorrect, 0);
  assert.equal(delayedWrong.reviewIntervalHours, 18);
});

test("three spaced independent correct attempts reach a seven-day interval", () => {
  const first = calculateMasteryUpdate(evidence(), null);
  const second = calculateMasteryUpdate(
    evidence({
      attemptedAt: new Date(first.nextReviewAt),
      isDelayedReview: true,
    }),
    previousFrom(first),
  );
  const third = calculateMasteryUpdate(
    evidence({
      attemptedAt: new Date(second.nextReviewAt),
      isDelayedReview: true,
    }),
    previousFrom(second),
  );
  assert.equal(third.consecutiveCorrect, 3);
  assert.equal(third.reviewIntervalHours, 168);
  assert.equal(third.masteryScore, 72);
});

test("immediate repetition cannot advance the spaced streak or earn full credit", () => {
  const first = calculateMasteryUpdate(evidence(), null);
  const repeated = calculateMasteryUpdate(
    evidence({
      attemptedAt: new Date("2026-08-01T01:00:00.000Z"),
      isDelayedReview: false,
    }),
    previousFrom(first),
  );
  assert.equal(repeated.consecutiveCorrect, 1);
  assert.equal(repeated.reviewIntervalHours, 48);
  assert.equal(repeated.scoreDelta, 6);
});

test("long-unpractised records enter the due queue and mastery band", () => {
  const now = new Date("2026-08-20T00:00:00.000Z");
  const record = {
    id: "mastery_a",
    masteryScore: 80,
    lastAttemptAt: "2026-08-01T00:00:00.000Z",
    nextReviewAt: "2026-08-15T00:00:00.000Z",
  };
  assert.equal(isReviewDue(record.nextReviewAt, now), true);
  assert.equal(masteryBand(record, now), "review_due");
  assert.deepEqual(reviewQueueStatus([record], now), {
    due: ["mastery_a"],
    upcoming: [],
  });
});

test("review instants remain exact across Sydney daylight-saving change", () => {
  const attemptedAt = new Date("2026-10-03T00:00:00.000Z");
  const review = nextReviewInstant(attemptedAt, 48);
  assert.equal(review.toISOString(), "2026-10-05T00:00:00.000Z");
  assert.equal(localDateKey(review, "Australia/Sydney"), "2026-10-05");
});

test("rebalancer respects capacity and never silently moves critical work", () => {
  const tasks = [
    {
      id: "locked",
      scheduledFor: "2026-08-10",
      dueAt: null,
      priority: "medium",
      priorityScore: 20,
      estimatedMinutes: 30,
      status: "active",
    },
    {
      id: "critical",
      scheduledFor: "2026-08-09",
      dueAt: "2026-08-11T00:00:00.000Z",
      priority: "critical",
      priorityScore: 90,
      estimatedMinutes: 45,
      status: "overdue",
    },
    {
      id: "normal",
      scheduledFor: "2026-08-08",
      dueAt: "2026-08-20T00:00:00.000Z",
      priority: "high",
      priorityScore: 60,
      estimatedMinutes: 40,
      status: "overdue",
    },
  ];
  const preview = rebalancePlan({
    tasks,
    startDate: "2026-08-10",
    dailyCapacityMinutes: 60,
  });
  assert.equal(preview.criticalWarnings.length, 1);
  assert.deepEqual(preview.changes, [
    {
      taskId: "normal",
      from: "2026-08-08",
      to: "2026-08-11",
      overload: false,
    },
  ]);

  const confirmed = rebalancePlan({
    tasks,
    startDate: "2026-08-10",
    dailyCapacityMinutes: 60,
    confirmCritical: true,
  });
  assert.deepEqual(
    confirmed.changes.map((change) => [change.taskId, change.to]),
    [
      ["critical", "2026-08-11"],
      ["normal", "2026-08-12"],
    ],
  );
});

test("private practice question validation rejects missing and duplicate choices", () => {
  const valid = {
    courseId: "course_1",
    topicTitle: "Cell membranes",
    difficulty: 2,
    prompt: "Which process is passive?",
    options: ["Diffusion", "Active transport", "Endocytosis", "Exocytosis"],
    correctChoiceIndex: 0,
    hint1: "Look for a process that does not require cellular energy.",
    explanation: "Diffusion follows a concentration gradient.",
    language: "en",
  };
  assert.equal(privatePracticeQuestionSchema.safeParse(valid).success, true);
  assert.equal(
    privatePracticeQuestionSchema.safeParse({
      ...valid,
      options: ["Diffusion", "diffusion"],
    }).success,
    false,
  );
  assert.equal(
    privatePracticeQuestionSchema.safeParse({
      ...valid,
      correctChoiceIndex: 4,
    }).success,
    false,
  );
});
