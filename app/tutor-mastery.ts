export type TutorMasteryAttempt = {
  correct: boolean;
  reasoning: string;
  hasAnswerEvidence: boolean;
  requiresAnswerEvidence: boolean;
  highestHintLevel: number;
  viewedFullSolution: boolean;
  isFreshTransfer: boolean;
};

export function countsTowardTutorMastery(attempt: TutorMasteryAttempt) {
  return (
    attempt.correct &&
    attempt.reasoning.trim().length >= 8 &&
    (!attempt.requiresAnswerEvidence || attempt.hasAnswerEvidence) &&
    attempt.highestHintLevel < 5 &&
    !attempt.viewedFullSolution &&
    attempt.isFreshTransfer
  );
}
