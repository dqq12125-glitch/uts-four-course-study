import {
  DEFAULT_REVIEW_POLICY,
  type ReviewPolicy,
} from "./review-policy.ts";
import {
  nextReviewInstant,
  reviewIntervalHours,
} from "./review-interval.ts";

export interface PreviousMastery {
  masteryScore: number;
  confidenceScore: number;
  lastAttemptAt: string | null;
  lastCorrectAt: string | null;
  nextReviewAt: string | null;
  reviewIntervalHours: number;
  consecutiveCorrect: number;
  consecutiveIncorrect: number;
}

export interface MasteryAttemptEvidence {
  isCorrect: boolean;
  hintsUsed: number;
  incorrectAttempts?: number;
  timeSpentSeconds: number;
  difficulty: number;
  confidenceBefore: number | null;
  confidenceAfter: number | null;
  isDelayedReview: boolean;
  attemptedAt: Date;
}

export interface MasteryUpdate extends PreviousMastery {
  scoreDelta: number;
  nextReviewAt: string;
  reviewIntervalHours: number;
}

const EMPTY_MASTERY: PreviousMastery = {
  masteryScore: 0,
  confidenceScore: 0,
  lastAttemptAt: null,
  lastCorrectAt: null,
  nextReviewAt: null,
  reviewIntervalHours: 0,
  consecutiveCorrect: 0,
  consecutiveIncorrect: 0,
};

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function confidenceScore(
  previous: number,
  confidenceBefore: number | null,
  confidenceAfter: number | null,
): number {
  const reported = confidenceAfter ?? confidenceBefore;
  if (reported === null) return previous;
  const evidence = reported * 20;
  return clampScore(previous === 0 ? evidence : previous * 0.65 + evidence * 0.35);
}

export function calculateMasteryUpdate(
  evidence: MasteryAttemptEvidence,
  previous: PreviousMastery | null,
  policy: ReviewPolicy = DEFAULT_REVIEW_POLICY,
): MasteryUpdate {
  const current = previous ?? EMPTY_MASTERY;
  const incorrectAttempts = evidence.incorrectAttempts ?? 0;
  const usedSupport =
    evidence.hintsUsed > 0 || incorrectAttempts > 0;
  const advancesIndependentStreak =
    evidence.isCorrect &&
    !usedSupport &&
    (!current.lastAttemptAt || evidence.isDelayedReview);
  const consecutiveCorrect = evidence.isCorrect
    ? advancesIndependentStreak
      ? current.consecutiveCorrect + 1
      : current.consecutiveCorrect
    : 0;
  const consecutiveIncorrect = evidence.isCorrect
    ? 0
    : current.consecutiveIncorrect + 1;

  let scoreDelta = evidence.isCorrect
    ? usedSupport
      ? policy.hintedCorrectDelta
      : policy.firstIndependentCorrectDelta
    : policy.wrongDelta;

  if (
    evidence.isCorrect &&
    current.lastAttemptAt &&
    !evidence.isDelayedReview
  ) {
    scoreDelta = Math.min(
      scoreDelta,
      policy.earlyRepeatCorrectDelta,
    );
  }

  if (evidence.isDelayedReview) {
    scoreDelta += evidence.isCorrect
      ? policy.delayedCorrectBonus
      : policy.delayedWrongPenalty;
  }

  const expectedSeconds = Math.max(90, evidence.difficulty * 90);
  if (
    evidence.isCorrect &&
    !usedSupport &&
    evidence.timeSpentSeconds <= expectedSeconds
  ) {
    scoreDelta += policy.efficientCorrectBonus;
  }
  if (
    evidence.isCorrect &&
    !usedSupport &&
    evidence.difficulty >= 4
  ) {
    scoreDelta += policy.highDifficultyCorrectBonus;
  }

  const intervalHours = reviewIntervalHours(
    {
      isCorrect: evidence.isCorrect,
      hintsUsed: usedSupport ? Math.max(1, evidence.hintsUsed) : 0,
      consecutiveCorrect,
    },
    policy,
  );
  const attemptedAt = evidence.attemptedAt.toISOString();

  return {
    masteryScore: clampScore(current.masteryScore + scoreDelta),
    confidenceScore: confidenceScore(
      current.confidenceScore,
      evidence.confidenceBefore,
      evidence.confidenceAfter,
    ),
    lastAttemptAt: attemptedAt,
    lastCorrectAt: evidence.isCorrect
      ? attemptedAt
      : current.lastCorrectAt,
    nextReviewAt: nextReviewInstant(
      evidence.attemptedAt,
      intervalHours,
    ).toISOString(),
    reviewIntervalHours: intervalHours,
    consecutiveCorrect,
    consecutiveIncorrect,
    scoreDelta,
  };
}
