import { ApiError } from "../lib/api-errors.ts";
import { createId } from "../lib/ids.ts";
import { localDateKey } from "../lib/timezone.ts";
import {
  calculateMasteryUpdate,
  type PreviousMastery,
} from "../domain/mastery/mastery-calculator.ts";
import { masteryBand } from "../domain/mastery/review-queue.ts";
import type {
  LearningLoopRepository,
  PracticeQuestionRecord,
  PracticeSessionRecord,
} from "../repositories/learning-loop-repository.ts";

export interface SafePracticeSession {
  sessionId: string;
  courseId: string;
  courseCode: string | null;
  courseName: string;
  topicId: string;
  topicTitle: string;
  questionId: string;
  questionType: string;
  difficulty: number;
  prompt: string;
  options: string[];
  language: "zh-CN" | "en";
  status: "active" | "completed" | "abandoned";
  hintsUsed: number;
  incorrectAttempts: number;
  revealedHints: string[];
  confidenceBefore: number | null;
  startedAt: string;
}

function parseOptions(question: PracticeQuestionRecord): string[] {
  if (!question.optionsJson) return [];
  try {
    const options = JSON.parse(question.optionsJson);
    if (
      Array.isArray(options) &&
      options.every((option) => typeof option === "string")
    ) {
      return options;
    }
  } catch {
    // Invalid stored question data is handled as an unavailable question.
  }
  throw new ApiError(
    "PRACTICE_QUESTION_INVALID",
    500,
    "This practice question is temporarily unavailable.",
  );
}

function safeSession(session: PracticeSessionRecord): SafePracticeSession {
  return {
    sessionId: session.sessionId,
    courseId: session.courseId,
    courseCode: session.courseCode,
    courseName: session.courseName,
    topicId: session.topicId,
    topicTitle: session.topicTitle,
    questionId: session.id,
    questionType: session.questionType,
    difficulty: session.difficulty,
    prompt: session.prompt,
    options: parseOptions(session),
    language: session.language,
    status: session.sessionStatus,
    hintsUsed: session.hintsUsed,
    incorrectAttempts: session.incorrectAttempts,
    revealedHints: [session.hint1, session.hint2, session.hint3]
      .slice(0, session.hintsUsed)
      .filter((hint): hint is string => Boolean(hint)),
    confidenceBefore: session.confidenceBefore,
    startedAt: session.startedAt,
  };
}

function previousMastery(
  record: Awaited<ReturnType<LearningLoopRepository["findMastery"]>>,
): PreviousMastery | null {
  if (!record) return null;
  return {
    masteryScore: record.masteryScore,
    confidenceScore: record.confidenceScore,
    lastAttemptAt: record.lastAttemptAt,
    lastCorrectAt: record.lastCorrectAt,
    nextReviewAt: record.nextReviewAt,
    reviewIntervalHours: record.reviewIntervalHours,
    consecutiveCorrect: record.consecutiveCorrect,
    consecutiveIncorrect: record.consecutiveIncorrect,
  };
}

function normalizedAnswer(answer: string): string {
  return answer.trim().replace(/\s+/g, " ").toLocaleLowerCase();
}

function gradeAnswer(
  session: PracticeSessionRecord,
  answer: string,
): boolean {
  if (session.questionType === "single_choice") {
    const selected = Number(answer);
    return (
      Number.isInteger(selected) &&
      String(selected) === session.solution
    );
  }
  return normalizedAnswer(answer) === normalizedAnswer(session.solution);
}

function correctAnswer(session: PracticeSessionRecord): string {
  if (session.questionType === "single_choice") {
    const options = parseOptions(session);
    return options[Number(session.solution)] ?? session.solution;
  }
  return session.solution;
}

export class LearningLoopService {
  private readonly repository: LearningLoopRepository;

  constructor(repository: LearningLoopRepository) {
    this.repository = repository;
  }

  async startFocusSession(
    userId: string,
    input: { taskId: string; plannedMinutes: number },
    now = new Date(),
  ) {
    const task = await this.repository.findOwnedTask(userId, input.taskId);
    if (
      !task ||
      !["queued", "active", "overdue"].includes(task.status)
    ) {
      throw new ApiError(
        "STUDY_TASK_NOT_AVAILABLE",
        404,
        "This study task is no longer available.",
      );
    }

    const active = await this.repository.findActiveFocusSession(userId);
    if (active) {
      if (active.studyTaskId === task.id) return active;
      throw new ApiError(
        "FOCUS_SESSION_ALREADY_ACTIVE",
        409,
        "Finish the active focus session before starting another.",
      );
    }

    const session = {
      id: createId("focus"),
      userId,
      taskId: task.id,
      plannedMinutes: input.plannedMinutes,
      startedAt: now.toISOString(),
    };
    try {
      await this.repository.createFocusSession(session);
    } catch (error) {
      const concurrent =
        await this.repository.findActiveFocusSession(userId);
      if (concurrent?.studyTaskId === task.id) return concurrent;
      if (concurrent) {
        throw new ApiError(
          "FOCUS_SESSION_ALREADY_ACTIVE",
          409,
          "Finish the active focus session before starting another.",
        );
      }
      throw error;
    }
    return {
      id: session.id,
      studyTaskId: task.id,
      plannedMinutes: session.plannedMinutes,
      actualSeconds: null,
      startedAt: session.startedAt,
      endedAt: null,
      completionStatus: "active" as const,
      difficulty: null,
      needsMorePractice: 0,
      confidenceAfter: null,
    };
  }

  async completeFocusSession(
    userId: string,
    sessionId: string,
    input: {
      completionStatus: "completed" | "partial" | "abandoned";
      difficulty?: number | null;
      needsMorePractice: boolean;
      confidenceAfter?: number | null;
    },
    now = new Date(),
  ) {
    const session = await this.repository.findFocusSession(userId, sessionId);
    if (!session || session.completionStatus !== "active") {
      throw new ApiError(
        "FOCUS_SESSION_NOT_FOUND",
        404,
        "Active focus session not found.",
      );
    }

    const elapsed = Math.round(
      (now.getTime() - Date.parse(session.startedAt)) / 1_000,
    );
    const actualSeconds = Math.max(0, Math.min(86_400, elapsed));
    const updated = await this.repository.completeFocusSession({
      userId,
      sessionId,
      actualSeconds,
      endedAt: now.toISOString(),
      completionStatus: input.completionStatus,
      difficulty: input.difficulty ?? null,
      needsMorePractice: input.needsMorePractice,
      confidenceAfter: input.confidenceAfter ?? null,
      taskId: session.studyTaskId,
    });
    if (!updated) {
      throw new ApiError(
        "FOCUS_SESSION_NOT_FOUND",
        404,
        "Active focus session not found.",
      );
    }
    return { actualSeconds };
  }

  async createPrivateQuestion(
    userId: string,
    input: {
      courseId: string;
      topicTitle: string;
      difficulty: number;
      prompt: string;
      options: string[];
      correctChoiceIndex: number;
      hint1: string;
      hint2?: string | null;
      hint3?: string | null;
      explanation: string;
      language: "zh-CN" | "en";
      sourceType?: "user_generated" | "ai_generated";
    },
    now = new Date(),
  ): Promise<{ questionId: string; topicId: string }> {
    const timestamp = now.toISOString();
    let topic = await this.repository.findTopicByTitle(
      userId,
      input.courseId,
      input.topicTitle,
    );
    if (!topic) {
      const topicId = createId("topic");
      const created = await this.repository.createTopic({
        id: topicId,
        userId,
        courseId: input.courseId,
        title: input.topicTitle,
        now: timestamp,
      });
      if (!created) {
        throw new ApiError(
          "COURSE_NOT_FOUND",
          404,
          "Course not found.",
        );
      }
      topic = {
        id: topicId,
        courseId: input.courseId,
        title: input.topicTitle,
      };
    }

    const questionId = createId("question");
    const created = await this.repository.createPrivateQuestion({
      id: questionId,
      userId,
      courseId: input.courseId,
      topicId: topic.id,
      difficulty: input.difficulty,
      prompt: input.prompt,
      optionsJson: JSON.stringify(input.options),
      solution: String(input.correctChoiceIndex),
      hint1: input.hint1,
      hint2: input.hint2?.trim() || null,
      hint3: input.hint3?.trim() || null,
      explanation: input.explanation,
      language: input.language,
      sourceType: input.sourceType ?? "user_generated",
      now: timestamp,
    });
    if (!created) {
      throw new ApiError(
        "PRACTICE_QUESTION_CREATE_FAILED",
        409,
        "The private practice question could not be created.",
      );
    }
    return { questionId, topicId: topic.id };
  }

  async startPracticeSession(
    userId: string,
    input: {
      courseId: string;
      topicId?: string | null;
      studyTaskId?: string | null;
      confidenceBefore?: number | null;
    },
    now = new Date(),
  ): Promise<{ session: SafePracticeSession; resumed: boolean }> {
    const active = await this.repository.findActivePracticeSession(userId);
    if (active) {
      return { session: safeSession(active), resumed: true };
    }

    let topicId = input.topicId ?? null;
    let studyTaskId: string | null = null;
    if (input.studyTaskId) {
      const task = await this.repository.findOwnedTask(
        userId,
        input.studyTaskId,
      );
      if (
        !task ||
        !["queued", "active", "overdue"].includes(task.status) ||
        !["practice", "review", "retest"].includes(task.taskType) ||
        task.courseId !== input.courseId
      ) {
        throw new ApiError(
          "PRACTICE_TASK_NOT_AVAILABLE",
          404,
          "This practice task is no longer available.",
        );
      }
      if (task.topicId) {
        if (topicId && topicId !== task.topicId) {
          throw new ApiError(
            "PRACTICE_TOPIC_MISMATCH",
            400,
            "The selected topic does not match the review task.",
          );
        }
        topicId = task.topicId;
      }
      studyTaskId = task.id;
    }

    const question = await this.repository.selectPracticeQuestion(
      userId,
      input.courseId,
      topicId,
      now.toISOString(),
    );
    if (!question) {
      throw new ApiError(
        "PRACTICE_QUESTION_NOT_FOUND",
        404,
        "Create a private practice question for this course first.",
      );
    }

    const sessionId = createId("practice");
    try {
      await this.repository.createPracticeSession({
        id: sessionId,
        userId,
        question,
        studyTaskId,
        confidenceBefore: input.confidenceBefore ?? null,
        now: now.toISOString(),
      });
    } catch (error) {
      const concurrent =
        await this.repository.findActivePracticeSession(userId);
      if (concurrent) {
        return { session: safeSession(concurrent), resumed: true };
      }
      throw error;
    }
    const session = await this.repository.findPracticeSession(
      userId,
      sessionId,
    );
    if (!session) {
      throw new ApiError(
        "PRACTICE_SESSION_CREATE_FAILED",
        500,
        "The practice session could not be started.",
      );
    }
    return { session: safeSession(session), resumed: false };
  }

  async getPracticeSession(
    userId: string,
    sessionId: string,
  ): Promise<SafePracticeSession> {
    const session = await this.repository.findPracticeSession(
      userId,
      sessionId,
    );
    if (!session) {
      throw new ApiError(
        "PRACTICE_SESSION_NOT_FOUND",
        404,
        "Practice session not found.",
      );
    }
    return safeSession(session);
  }

  async requestHint(
    userId: string,
    sessionId: string,
  ): Promise<{ hint: string; hintsUsed: number }> {
    const session = await this.repository.findPracticeSession(
      userId,
      sessionId,
    );
    if (!session || session.sessionStatus !== "active") {
      throw new ApiError(
        "PRACTICE_SESSION_NOT_FOUND",
        404,
        "Active practice session not found.",
      );
    }
    const hints = [session.hint1, session.hint2, session.hint3];
    const hint = hints[session.hintsUsed];
    if (!hint) {
      throw new ApiError(
        "NO_MORE_HINTS",
        409,
        "No more hints are available for this question.",
      );
    }
    if (
      !(await this.repository.incrementHintsUsed(userId, sessionId))
    ) {
      throw new ApiError(
        "PRACTICE_SESSION_NOT_FOUND",
        404,
        "Active practice session not found.",
      );
    }
    return { hint, hintsUsed: session.hintsUsed + 1 };
  }

  async submitAttempt(
    userId: string,
    sessionId: string,
    answer: string,
    timezone: string,
    now = new Date(),
  ) {
    const session = await this.repository.findPracticeSession(
      userId,
      sessionId,
    );
    if (!session || session.sessionStatus !== "active") {
      throw new ApiError(
        "PRACTICE_SESSION_NOT_FOUND",
        404,
        "Active practice session not found.",
      );
    }

    const correct = gradeAnswer(session, answer);
    if (
      !correct &&
      session.hintsUsed === 0 &&
      session.incorrectAttempts === 0
    ) {
      const recorded = await this.repository.recordIncorrectAttempt(
        userId,
        sessionId,
        session.incorrectAttempts,
      );
      if (!recorded) {
        throw new ApiError(
          "PRACTICE_SESSION_CHANGED",
          409,
          "The practice session changed. Refresh before trying again.",
        );
      }
      return {
        isCorrect: false as const,
        retryAllowed: true as const,
        masteryUpdated: false as const,
        hintsUsed: session.hintsUsed,
        incorrectAttempts: 1,
        message:
          session.language === "zh-CN"
            ? "答案尚未通过。先请求一个最小提示，再独立尝试一次。"
            : "That answer is not correct yet. Request one minimal hint, then try again.",
      };
    }
    const previous = await this.repository.findMastery(
      userId,
      session.topicId,
    );
    const isDelayedReview = Boolean(
      previous?.nextReviewAt &&
        Date.parse(previous.nextReviewAt) <= now.getTime(),
    );
    const timeSpentSeconds = Math.max(
      0,
      Math.min(
        86_400,
        Math.round(
          (now.getTime() - Date.parse(session.startedAt)) / 1_000,
        ),
      ),
    );
    const update = calculateMasteryUpdate(
      {
        isCorrect: correct,
        hintsUsed: session.hintsUsed,
        incorrectAttempts: session.incorrectAttempts,
        timeSpentSeconds,
        difficulty: session.difficulty,
        confidenceBefore: session.confidenceBefore,
        confidenceAfter: null,
        isDelayedReview,
        attemptedAt: now,
      },
      previousMastery(previous),
    );
    const openRetest = await this.repository.findOpenRetestTask(
      userId,
      session.topicId,
    );
    const needsNewRetest =
      !openRetest || openRetest.id === session.studyTaskId;
    const reviewLanguage = session.language;
    const reviewPriority =
      !correct || update.masteryScore < 35 ? "high" : "medium";
    const reviewTitle =
      reviewLanguage === "zh-CN"
        ? `复测：${session.topicTitle}`
        : `Retest: ${session.topicTitle}`;
    const reviewReason = correct
      ? reviewLanguage === "zh-CN"
        ? `根据本次独立作答表现，在 ${update.reviewIntervalHours} 小时后检查是否仍能提取。`
        : `Check delayed recall again in ${update.reviewIntervalHours} hours.`
      : reviewLanguage === "zh-CN"
        ? "本次作答未通过，安排更早复习和不同题目复测。"
        : "This attempt was not correct, so an earlier review is scheduled.";
    const attemptedAt = now.toISOString();
    const masteryId = previous?.id ?? createId("mastery");
    const attemptId = createId("attempt");

    await this.repository.saveAttemptAndMastery({
      attempt: {
        id: attemptId,
        userId,
        practiceQuestionId: session.id,
        topicId: session.topicId,
        practiceSessionId: session.sessionId,
        studyTaskId: session.studyTaskId,
        answer,
        isCorrect: correct,
        score: correct ? 100 : 0,
        confidenceBefore: session.confidenceBefore,
        hintsUsed: session.hintsUsed,
        incorrectAttempts: session.incorrectAttempts,
        timeSpentSeconds,
        isDelayedReview,
        attemptedAt,
      },
      mastery: {
        id: masteryId,
        userId,
        courseId: session.courseId,
        topicId: session.topicId,
        masteryScore: update.masteryScore,
        confidenceScore: update.confidenceScore,
        lastAttemptAt: update.lastAttemptAt,
        lastCorrectAt: update.lastCorrectAt,
        nextReviewAt: update.nextReviewAt,
        reviewIntervalHours: update.reviewIntervalHours,
        consecutiveCorrect: update.consecutiveCorrect,
        consecutiveIncorrect: update.consecutiveIncorrect,
        createdAt: previous?.lastAttemptAt ?? attemptedAt,
        updatedAt: attemptedAt,
      },
      reviewTask: needsNewRetest
        ? {
            mode: "insert",
            id: createId("task"),
            title: reviewTitle,
            description:
              reviewLanguage === "zh-CN"
                ? "优先使用同知识点的另一道题；题库不足时，在不看旧答案的情况下重新作答。"
                : "Prefer another question on the topic; if the private bank is too small, retry without viewing the old answer.",
            completionCriteria:
              reviewLanguage === "zh-CN"
                ? "不查看旧答案，独立完成一次同知识点作答，并解释上次错误原因。"
                : "Complete a fresh attempt without the old answer and explain the prior error.",
            reason: reviewReason,
            priority: reviewPriority,
            priorityScore: correct ? 58 : 86,
            estimatedMinutes: 15,
            scheduledFor: localDateKey(
              new Date(update.nextReviewAt),
              timezone,
            ),
            dueAt: update.nextReviewAt,
          }
        : {
            mode: "update",
            id: openRetest.id,
            title: reviewTitle,
            reason: reviewReason,
            priority: reviewPriority,
            priorityScore: correct ? 58 : 86,
            scheduledFor: localDateKey(
              new Date(update.nextReviewAt),
              timezone,
            ),
            dueAt: update.nextReviewAt,
          },
    });

    return {
      attemptId,
      isCorrect: correct,
      retryAllowed: false as const,
      masteryUpdated: true as const,
      hadIncorrectAttempt: session.incorrectAttempts > 0,
      correctAnswer: correctAnswer(session),
      explanation: session.explanation,
      masteryBand: masteryBand(
        {
          masteryScore: update.masteryScore,
          lastAttemptAt: update.lastAttemptAt,
          nextReviewAt: update.nextReviewAt,
        },
        now,
      ),
      nextReviewAt: update.nextReviewAt,
      reviewIntervalHours: update.reviewIntervalHours,
      hintsUsed: session.hintsUsed,
      timeSpentSeconds,
    };
  }

  async updateAttemptMetadata(
    userId: string,
    attemptId: string,
    input: { errorType: string; confidenceAfter: number },
    now = new Date(),
  ): Promise<void> {
    const attempt = await this.repository.findAttempt(userId, attemptId);
    if (!attempt) {
      throw new ApiError(
        "PRACTICE_ATTEMPT_NOT_FOUND",
        404,
        "Practice attempt not found.",
      );
    }
    const mastery = await this.repository.findMastery(
      userId,
      attempt.topicId,
    );
    if (!mastery) {
      throw new ApiError(
        "MASTERY_NOT_FOUND",
        404,
        "Mastery record not found.",
      );
    }
    const reportedScore = input.confidenceAfter * 20;
    const confidenceScore = Math.max(
      0,
      Math.min(
        100,
        Math.round(
          mastery.confidenceScore * 0.65 + reportedScore * 0.35,
        ),
      ),
    );
    const updated = await this.repository.updateAttemptMetadata({
      userId,
      attemptId,
      topicId: attempt.topicId,
      errorType: input.errorType,
      confidenceAfter: input.confidenceAfter,
      confidenceScore,
      now: now.toISOString(),
    });
    if (!updated) {
      throw new ApiError(
        "PRACTICE_ATTEMPT_NOT_FOUND",
        404,
        "Practice attempt not found.",
      );
    }
  }
}
