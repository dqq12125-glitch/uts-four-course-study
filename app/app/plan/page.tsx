import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  getAcademicService,
  getLearningRepository,
} from "@/src/application/runtime";
import { currentUserFromCookies } from "@/src/application/session";
import { localDateKey } from "@/src/lib/timezone";
import { PlanBoard } from "./plan-board";
import { copy } from "@/src/lib/i18n";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "学习计划" };

function addDays(value: string, days: number): string {
  const date = new Date(`${value}T12:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export default async function PlanPage() {
  const user = await currentUserFromCookies();
  if (!user) redirect("/auth/sign-in");
  const t = (zh: string, en: string) =>
    copy(user.preferredLanguage, zh, en);
  const startDate = localDateKey(new Date(), user.timezone);
  const endDate = addDays(startDate, 6);
  const repository = getLearningRepository();
  const [tasks, courses, capacity] = await Promise.all([
    getAcademicService().plan({
      userId: user.id,
      startDate,
      endDate,
    }),
    repository.listCourses(user.id),
    repository.dailyStudyMinutes(user.id),
  ]);

  return (
    <div className="saas-page">
      <section className="saas-page-heading">
        <p className="saas-eyebrow">{t("按可用时间规划", "Plan with capacity")}</p>
        <h1>
          {t(
            "这一周，只安排真正做得完的任务",
            "Plan only what you can realistically finish",
          )}
        </h1>
        <p>
          {t(
            "拖到另一日期可重新安排；紧急任务会明确显示超负荷，不会被静默顺延。",
            "Drag a task to reschedule it. Critical overloads are shown explicitly and never moved silently.",
          )}
        </p>
      </section>
      <PlanBoard
        initialTasks={tasks.map((task) => ({
          id: task.id,
          courseId: task.courseId,
          courseCode: task.courseCode,
          courseName: task.courseName,
          colourKey: task.colourKey,
          title: task.title,
          completionCriteria: task.completionCriteria,
          taskType: task.taskType,
          priority: task.priority,
          estimatedMinutes: task.estimatedMinutes,
          scheduledFor: task.scheduledFor,
          dueAt: task.dueAt,
          status: task.status,
        }))}
        initialStartDate={startDate}
        initialEndDate={endDate}
        dailyCapacity={capacity}
        courses={courses.map((course) => ({
          id: course.id,
          courseCode: course.courseCode,
          courseName: course.courseName,
        }))}
        language={user.preferredLanguage}
      />
    </div>
  );
}
