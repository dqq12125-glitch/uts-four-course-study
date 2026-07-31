import {
  DEFAULT_REVIEW_POLICY,
  type ReviewPolicy,
} from "./review-policy.ts";

export interface ReviewIntervalInput {
  isCorrect: boolean;
  hintsUsed: number;
  consecutiveCorrect: number;
}

export function reviewIntervalHours(
  input: ReviewIntervalInput,
  policy: ReviewPolicy = DEFAULT_REVIEW_POLICY,
): number {
  if (!input.isCorrect) return policy.wrongHours;
  if (input.hintsUsed > 0) return policy.correctWithHintsHours;

  const index = Math.max(
    0,
    Math.min(
      input.consecutiveCorrect - 1,
      policy.independentIntervalsHours.length - 1,
    ),
  );
  return policy.independentIntervalsHours[index] ?? 48;
}

export function nextReviewInstant(
  attemptedAt: Date,
  intervalHours: number,
): Date {
  return new Date(attemptedAt.getTime() + intervalHours * 3_600_000);
}
