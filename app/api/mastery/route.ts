import { getLearningLoopRepository } from "@/src/application/runtime";
import { requireUserFromRequest } from "@/src/application/session";
import {
  isReviewDue,
  masteryBand,
} from "@/src/domain/mastery/review-queue";
import { errorResponse, jsonOk, requestId } from "@/src/lib/api-errors";

export async function GET(request: Request): Promise<Response> {
  const id = requestId(request);
  try {
    const user = await requireUserFromRequest(request);
    const now = new Date();
    const records = await getLearningLoopRepository().listMastery(user.id);
    const topics = records.map((record) => ({
      id: record.id,
      courseId: record.courseId,
      courseCode: record.courseCode,
      courseName: record.courseName,
      colourKey: record.colourKey,
      topicId: record.topicId,
      topicTitle: record.topicTitle,
      band: masteryBand(record, now),
      isReviewDue: isReviewDue(record.nextReviewAt, now),
      nextReviewAt: record.nextReviewAt,
      consecutiveCorrect: record.consecutiveCorrect,
      attemptCount: record.attemptCount,
      lastErrorType: record.lastErrorType,
      reviewTaskId: record.reviewTaskId,
    }));
    return jsonOk(
      {
        serverNow: now.toISOString(),
        timezone: user.timezone,
        dueCount: topics.filter((topic) => topic.isReviewDue).length,
        stableCount: topics.filter((topic) => topic.band === "stable").length,
        topics,
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
