export interface ReviewPolicy {
  wrongHours: number;
  correctWithHintsHours: number;
  independentIntervalsHours: readonly number[];
  firstIndependentCorrectDelta: number;
  hintedCorrectDelta: number;
  earlyRepeatCorrectDelta: number;
  wrongDelta: number;
  delayedCorrectBonus: number;
  delayedWrongPenalty: number;
  efficientCorrectBonus: number;
  highDifficultyCorrectBonus: number;
}

export const DEFAULT_REVIEW_POLICY: ReviewPolicy = {
  wrongHours: 18,
  correctWithHintsHours: 36,
  independentIntervalsHours: [48, 96, 168, 336],
  firstIndependentCorrectDelta: 18,
  hintedCorrectDelta: 8,
  earlyRepeatCorrectDelta: 4,
  wrongDelta: -10,
  delayedCorrectBonus: 6,
  delayedWrongPenalty: -6,
  efficientCorrectBonus: 2,
  highDifficultyCorrectBonus: 2,
};
