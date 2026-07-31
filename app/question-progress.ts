export type MasteryStatus = "mastered" | "learning" | "unrated";

export type QuestionProgressEntry = {
  attempts: number;
  correctAttempts: number;
  incorrectAttempts: number;
  mastered: boolean;
  masteryStatus: MasteryStatus;
  lastCorrect: boolean;
  lastAnsweredAt: number;
};

export type QuestionProgressStore = Record<string, QuestionProgressEntry>;

type AttemptResult = {
  correct: boolean;
  masteryStatus?: MasteryStatus;
  answeredAt?: number;
};

export function recordQuestionAttempt(
  store: QuestionProgressStore,
  questionId: string,
  result: AttemptResult,
): QuestionProgressStore {
  const previous = store[questionId];
  const masteryStatus = result.correct
    ? result.masteryStatus ?? "unrated"
    : "learning";
  return {
    ...store,
    [questionId]: {
      attempts: (previous?.attempts ?? 0) + 1,
      correctAttempts: (previous?.correctAttempts ?? 0) + (result.correct ? 1 : 0),
      incorrectAttempts: (previous?.incorrectAttempts ?? 0) + (result.correct ? 0 : 1),
      mastered: masteryStatus === "mastered",
      masteryStatus,
      lastCorrect: result.correct,
      lastAnsweredAt: result.answeredAt ?? Date.now(),
    },
  };
}

export function setQuestionMastery(
  store: QuestionProgressStore,
  questionId: string,
  mastered: boolean,
): QuestionProgressStore {
  const previous = store[questionId];
  if (!previous) return store;
  return {
    ...store,
    [questionId]: {
      ...previous,
      mastered,
      masteryStatus: mastered ? "mastered" : "learning",
    },
  };
}

export function pendingQuestionIds(
  questionIds: string[],
  store: QuestionProgressStore,
) {
  return questionIds.filter((questionId) => !store[questionId]?.mastered);
}

export function summarizeQuestionProgress(
  questionIds: string[],
  store: QuestionProgressStore,
) {
  const entries = questionIds.map((questionId) => store[questionId]);
  const attempted = entries.filter((entry) => (entry?.attempts ?? 0) > 0).length;
  const mastered = entries.filter((entry) => entry?.mastered).length;
  const review = entries.filter(
    (entry) => (entry?.attempts ?? 0) > 0 && !entry?.mastered,
  ).length;
  const unrated = entries.filter(
    (entry) => entry?.masteryStatus === "unrated",
  ).length;
  return {
    total: questionIds.length,
    attempted,
    mastered,
    review,
    unrated,
    remaining: Math.max(0, questionIds.length - mastered),
  };
}

export function normalizeQuestionProgress(
  value: unknown,
  validQuestionIds: ReadonlySet<string>,
): QuestionProgressStore {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};

  const restored: QuestionProgressStore = {};
  for (const [questionId, candidate] of Object.entries(value)) {
    if (
      !validQuestionIds.has(questionId) ||
      !candidate ||
      typeof candidate !== "object" ||
      Array.isArray(candidate)
    ) {
      continue;
    }
    const entry = candidate as Partial<QuestionProgressEntry>;
    const attempts = Number.isFinite(entry.attempts)
      ? Math.max(0, Math.floor(entry.attempts as number))
      : 0;
    const correctAttempts = Number.isFinite(entry.correctAttempts)
      ? Math.max(0, Math.floor(entry.correctAttempts as number))
      : 0;
    const incorrectAttempts = Number.isFinite(entry.incorrectAttempts)
      ? Math.max(0, Math.floor(entry.incorrectAttempts as number))
      : 0;
    if (attempts === 0) continue;

    const masteryStatus: MasteryStatus =
      entry.masteryStatus === "unrated" ||
      entry.masteryStatus === "learning" ||
      entry.masteryStatus === "mastered"
        ? entry.masteryStatus
        : entry.mastered === true
          ? "unrated"
          : "learning";

    restored[questionId] = {
      attempts,
      correctAttempts,
      incorrectAttempts,
      mastered: masteryStatus === "mastered",
      masteryStatus,
      lastCorrect: entry.lastCorrect === true,
      lastAnsweredAt: Number.isFinite(entry.lastAnsweredAt)
        ? Math.max(0, entry.lastAnsweredAt as number)
        : 0,
    };
  }
  return restored;
}
