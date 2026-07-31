import {
  getAcademicRepository,
  getLearningLoopRepository,
  getLearningRepository,
} from "@/src/application/runtime";
import { requireUserFromRequest } from "@/src/application/session";
import {
  ApiError,
  errorResponse,
  jsonOk,
  requestId,
} from "@/src/lib/api-errors";
import {
  localDateKey,
  localDayOfWeek,
} from "@/src/lib/timezone";
import { calculateStudyStreak } from "@/src/domain/planning/study-streak";

export async function GET(request: Request): Promise<Response> {
  const id = requestId(request);
  try {
    const user = await requireUserFromRequest(request);
    if (!user.onboardingCompletedAt) {
      throw new ApiError(
        "ONBOARDING_REQUIRED",
        409,
        "Complete onboarding before loading Today.",
      );
    }
    const now = new Date();
    const dateKey = localDateKey(now, user.timezone);
    const loopRepository = getLearningLoopRepository();
    const [data, dueReviewCount, activityInstants] = await Promise.all([
      getLearningRepository().today(
        user.id,
        dateKey,
        localDayOfWeek(now, user.timezone),
        now.toISOString(),
      ),
      loopRepository.dueReviewCount(user.id, now.toISOString()),
      getAcademicRepository().recentActivityInstants(
        user.id,
        new Date(now.getTime() - 370 * 86_400_000).toISOString(),
      ),
    ]);
    const openTasks = data.tasks.filter(
      (task) => task.status !== "completed",
    );
    const currentTask =
      openTasks.find((task) => task.status === "active") ??
      openTasks.find(
        (task) =>
          task.taskType === "retest" &&
          task.dueAt !== null &&
          Date.parse(task.dueAt) <= now.getTime(),
      ) ??
      openTasks.find((task) => task.status === "queued") ??
      openTasks[0] ??
      null;
    const queue = currentTask
      ? openTasks.filter((task) => task.id !== currentTask.id).slice(0, 3)
      : [];
    const activeFocusSession =
      currentTask && currentTask.taskType !== "retest"
        ? await loopRepository.findActiveFocusSession(
            user.id,
            currentTask.id,
          )
        : null;

    return jsonOk(
      {
        serverNow: now.toISOString(),
        dateKey,
        user: {
          displayName: user.displayName,
          preferredLanguage: user.preferredLanguage,
          timezone: user.timezone,
        },
        semester: data.semester,
        settings: data.settings,
        currentTask,
        queue,
        classSessions: data.classSessions,
        assessments: data.assessments,
        dueReviewCount,
        studyStreak: calculateStudyStreak({
          activityInstants,
          timezone: user.timezone,
          now,
        }),
        plannedMinutes: openTasks.reduce(
          (total, task) => total + task.estimatedMinutes,
          0,
        ),
        activeFocusSession,
      },
      200,
      {
        "Cache-Control": "no-store",
        "x-request-id": id,
      },
    );
  } catch (error) {
    return errorResponse(error, id);
  }
}
