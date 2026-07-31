import assert from "node:assert/strict";
import test from "node:test";

import {
  normalizeQuestionProgress,
  pendingQuestionIds,
  recordQuestionAttempt,
  setQuestionMastery,
  summarizeQuestionProgress,
} from "../app/question-progress.ts";

test("question progress persists attempts and removes only mastered questions from the queue", () => {
  const ids = ["q1", "q2", "q3"];
  const afterWrong = recordQuestionAttempt({}, "q1", {
    correct: false,
    answeredAt: 100,
  });
  assert.deepEqual(pendingQuestionIds(ids, afterWrong), ids);
  assert.deepEqual(summarizeQuestionProgress(ids, afterWrong), {
    total: 3,
    attempted: 1,
    mastered: 0,
    review: 1,
    unrated: 0,
    remaining: 3,
  });

  const afterCorrectAnswer = recordQuestionAttempt(afterWrong, "q1", {
    correct: true,
    answeredAt: 200,
  });
  assert.equal(afterCorrectAnswer.q1.masteryStatus, "unrated");
  assert.deepEqual(pendingQuestionIds(ids, afterCorrectAnswer), ids);

  const afterCorrection = setQuestionMastery(afterCorrectAnswer, "q1", true);
  assert.deepEqual(pendingQuestionIds(ids, afterCorrection), ["q2", "q3"]);
  assert.equal(afterCorrection.q1.attempts, 2);
  assert.equal(afterCorrection.q1.correctAttempts, 1);
  assert.equal(afterCorrection.q1.incorrectAttempts, 1);
  assert.equal(afterCorrection.q1.mastered, true);
});

test("a correct selection stays unmastered until the learner confirms mastery", () => {
  const store = recordQuestionAttempt({}, "q1", {
    correct: true,
  });
  assert.equal(store.q1.lastCorrect, true);
  assert.equal(store.q1.mastered, false);
  assert.equal(store.q1.masteryStatus, "unrated");
  assert.deepEqual(pendingQuestionIds(["q1"], store), ["q1"]);

  const stillLearning = setQuestionMastery(store, "q1", false);
  assert.equal(stillLearning.q1.mastered, false);
  assert.equal(stillLearning.q1.masteryStatus, "learning");
  assert.deepEqual(pendingQuestionIds(["q1"], stillLearning), ["q1"]);
});

test("normalization keeps only valid, attempted question records", () => {
  const restored = normalizeQuestionProgress(
    {
      q1: {
        attempts: 2,
        correctAttempts: 1,
        incorrectAttempts: 1,
        mastered: true,
        masteryStatus: "mastered",
        lastCorrect: true,
        lastAnsweredAt: 123,
      },
      removed: {
        attempts: 9,
        correctAttempts: 9,
        incorrectAttempts: 0,
        mastered: true,
        lastCorrect: true,
        lastAnsweredAt: 456,
      },
      q2: { attempts: 0 },
    },
    new Set(["q1", "q2"]),
  );
  assert.deepEqual(Object.keys(restored), ["q1"]);
  assert.equal(restored.q1.mastered, true);
  assert.equal(restored.q1.masteryStatus, "mastered");
});

test("normalization resolves inconsistent legacy mastery flags from the explicit status", () => {
  const restored = normalizeQuestionProgress(
    {
      q1: {
        attempts: 1,
        correctAttempts: 1,
        incorrectAttempts: 0,
        mastered: true,
        masteryStatus: "learning",
        lastCorrect: true,
        lastAnsweredAt: 123,
      },
    },
    new Set(["q1"]),
  );
  assert.equal(restored.q1.mastered, false);
  assert.equal(restored.q1.masteryStatus, "learning");
});

test("legacy auto-mastered answers are demoted until the learner confirms them", () => {
  const restored = normalizeQuestionProgress(
    {
      q1: {
        attempts: 1,
        correctAttempts: 1,
        incorrectAttempts: 0,
        mastered: true,
        lastCorrect: true,
        lastAnsweredAt: 123,
      },
    },
    new Set(["q1"]),
  );
  assert.equal(restored.q1.mastered, false);
  assert.equal(restored.q1.masteryStatus, "unrated");
  assert.deepEqual(pendingQuestionIds(["q1"], restored), ["q1"]);
});
