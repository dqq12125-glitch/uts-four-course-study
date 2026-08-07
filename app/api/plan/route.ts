import { z } from "zod";
import {
  getAcademicService,
  getLearningRepository,
} from "@/src/application/runtime";
import { requireUserFromRequest } from "@/src/application/session";
import {
  ApiError,
  errorResponse,
  jsonOk,
  requestId,
} from "@/src/lib/api-errors";
import { localDateKey } from "@/src/lib/timezone";

const dateKey = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

function addDays(value: string, days: number): string {
  const date = new Date(`${value}T12:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export async function GET(request: Request): Promise<Response> {
  const id = requestId(request);
  try {
    const user = await requireUserFromRequest(request);
    const url = new URL(request.url);
    const fallbackStart = localDateKey(new Date(), user.timezone);
    const startDate = url.searchParams.get("start") ?? fallbackStart;
    const endDate = url.searchParams.get("end") ?? addDays(startDate, 6);
    if (
      !dateKey.safeParse(startDate).success ||
      !dateKey.safeParse(endDate).success
    ) {
      throw new ApiError(
        "VALIDATION_ERROR",
        400,
        "Plan dates must use YYYY-MM-DD.",
      );
    }
    const courseId = url.searchParams.get("courseId")?.trim() || null;
    if (
      courseId &&
      !(await getLearningRepository().findCourse(user.id, courseId))
    ) {
      throw new ApiError("COURSE_NOT_FOUND", 404, "Course not found.");
    }
    const tasks = await getAcademicService().plan({
      userId: user.id,
      startDate,
      endDate,
      courseId,
    });
    const byDate = Object.groupBy(tasks, (task) => task.scheduledFor);
    return jsonOk(
      {
        startDate,
        endDate,
        tasks,
        days: Object.entries(byDate).map(([date, dayTasks]) => ({
          date,
          tasks: dayTasks ?? [],
          plannedMinutes: (dayTasks ?? [])
            .filter((task) => task.status !== "completed")
            .reduce((sum, task) => sum + task.estimatedMinutes, 0),
        })),
      },
      200,
      { "Cache-Control": "no-store", "x-request-id": id },
    );
  } catch (error) {
    return errorResponse(error, id);
  }
}
