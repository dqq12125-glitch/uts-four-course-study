import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUserFromCookies } from "@/src/application/session";
import {
  getAcademicRepository,
  getLearningLoopRepository,
  getLearningRepository,
} from "@/src/application/runtime";
import {
  localDateKey,
  localDayOfWeek,
} from "@/src/lib/timezone";
import { TaskActions } from "@/app/app/today/task-actions";
import { FocusTimer } from "@/app/app/today/focus-timer";
import { PracticeStartButton } from "@/app/app/today/practice-start-button";
import { RebalanceButton } from "@/app/app/today/rebalance-button";
import { calculateStudyStreak } from "@/src/domain/planning/study-streak";
import { TodayQueue } from "./today-queue";
import { copy, locale } from "@/src/lib/i18n";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "今天",
};

function semesterWeek(
  dateKey: string,
  startDate: string,
  language: "zh-CN" | "en",
): string {
  const difference =
    Date.parse(`${dateKey}T00:00:00Z`) -
    Date.parse(`${startDate}T00:00:00Z`);
  if (difference < 0) {
    return copy(language, "开学前", "Before semester");
  }
  const week = Math.floor(difference / 604_800_000) + 1;
  return copy(language, `第 ${week} 周`, `Week ${week}`);
}

export default async function TodayPage() {
  const user = await currentUserFromCookies();
  if (!user) redirect("/auth/sign-in");
  if (!user.onboardingCompletedAt) redirect("/onboarding");
  const t = (zh: string, en: string) =>
    copy(user.preferredLanguage, zh, en);

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
        task.dueAt &&
        Date.parse(task.dueAt) <= now.getTime(),
    ) ??
    openTasks.find((task) => task.status === "queued") ??
    openTasks[0];
  const queue = openTasks.filter((task) => task.id !== currentTask?.id);
  const currentIsRetest = currentTask?.taskType === "retest";
  const activeFocusSession =
    currentTask && !currentIsRetest
      ? await loopRepository.findActiveFocusSession(
          user.id,
          currentTask.id,
        )
      : null;
  const dateLabel = new Intl.DateTimeFormat(
    locale(user.preferredLanguage),
    {
      timeZone: user.timezone,
      weekday: "long",
      month: "long",
      day: "numeric",
    },
  ).format(now);
  const plannedMinutes = data.tasks
    .filter((task) => task.status !== "completed")
    .reduce((sum, task) => sum + task.estimatedMinutes, 0);
  const studyStreak = calculateStudyStreak({
    activityInstants,
    timezone: user.timezone,
    now,
  });

  return (
    <div className="saas-page">
      <section className="saas-page-heading">
        <p className="saas-eyebrow">{dateLabel}</p>
        <h1>
          {user.displayName ? `${user.displayName}, ` : ""}
          {t("今天只先做下一步", "Start with just the next step")}
        </h1>
      </section>

      <section
        className="saas-overview"
        aria-label={t("今日概览", "Today overview")}
      >
        <div>
          <span>{t("学期", "Semester")}</span>
          <strong>
            {data.semester
              ? `${data.semester.name} · ${semesterWeek(
                  dateKey,
                  data.semester.startDate,
                  user.preferredLanguage,
                )}`
              : t("未设置", "Not set")}
          </strong>
        </div>
        <div>
          <span>{t("今天课程", "Classes today")}</span>
          <strong>
            {t(
              `${data.classSessions.length} 节`,
              `${data.classSessions.length} class${
                data.classSessions.length === 1 ? "" : "es"
              }`,
            )}
          </strong>
        </div>
        <div>
          <span>{t("计划时间", "Planned time")}</span>
          <strong>
            {t(`${plannedMinutes} 分钟`, `${plannedMinutes} min`)}
          </strong>
        </div>
        <div>
          <span>{t("每日容量", "Daily capacity")}</span>
          <strong>
            {t(
              `${data.settings.dailyStudyMinutes} 分钟`,
              `${data.settings.dailyStudyMinutes} min`,
            )}
          </strong>
        </div>
        <div>
          <span>{t("连续学习", "Study streak")}</span>
          <strong>
            {t(
              `${studyStreak} 天`,
              `${studyStreak} day${studyStreak === 1 ? "" : "s"}`,
            )}
          </strong>
        </div>
      </section>

      {dueReviewCount > 0 ? (
        <aside className="saas-review-alert">
          <div>
            <span>REVIEW DUE</span>
            <strong>
              {t(
                `你有 ${dueReviewCount} 个知识点需要复测`,
                `${dueReviewCount} topic${
                  dueReviewCount === 1 ? "" : "s"
                } ${dueReviewCount === 1 ? "needs" : "need"} a retest`,
              )}
            </strong>
            <p>
              {t(
                "到期复测比立即重复更能说明是否真正掌握。",
                "A delayed retest is stronger evidence than immediate repetition.",
              )}
            </p>
          </div>
          <Link className="saas-button saas-button-secondary" href="/app/mastery">
            {t("查看复测队列", "View retest queue")}
          </Link>
        </aside>
      ) : null}

      {currentTask ? (
        <section className="saas-current-task">
          <div className="saas-task-topline">
            <span className={`saas-priority is-${currentTask.priority}`}>
              {currentTask.priority}
            </span>
            <span>
              {[currentTask.courseCode, currentTask.courseName]
                .filter(Boolean)
                .join(" · ")}
            </span>
          </div>
          <h2>{currentTask.title}</h2>
          {currentTask.description ? <p>{currentTask.description}</p> : null}
          <div className="saas-task-facts">
            <div>
              <span>{t("为什么现在做", "Why now")}</span>
              <strong>{currentTask.reason}</strong>
            </div>
            <div>
              <span>{t("预计时间", "Estimated time")}</span>
              <strong>
                {t(
                  `${currentTask.estimatedMinutes} 分钟`,
                  `${currentTask.estimatedMinutes} min`,
                )}
              </strong>
            </div>
            <div>
              <span>{t("完成标准", "Completion criteria")}</span>
              <strong>{currentTask.completionCriteria}</strong>
            </div>
          </div>
          {currentIsRetest && currentTask.courseId ? (
            <PracticeStartButton
              courseId={currentTask.courseId}
              taskId={currentTask.id}
              language={user.preferredLanguage}
            />
          ) : (
            <>
              <FocusTimer
                taskId={currentTask.id}
                suggestedMinutes={currentTask.estimatedMinutes}
                initialSession={
                  activeFocusSession
                    ? {
                        id: activeFocusSession.id,
                        studyTaskId: activeFocusSession.studyTaskId,
                        plannedMinutes: activeFocusSession.plannedMinutes,
                        startedAt: activeFocusSession.startedAt,
                        completionStatus:
                          activeFocusSession.completionStatus,
                      }
                    : null
                }
                language={user.preferredLanguage}
              />
              <TaskActions
                taskId={currentTask.id}
                status={currentTask.status}
                allowStart={false}
                language={user.preferredLanguage}
              />
            </>
          )}
        </section>
      ) : (
        <section className="saas-empty">
          <p className="saas-eyebrow">Today is clear</p>
          <h2>{t("今天没有待执行任务", "No open tasks today")}</h2>
          <p>
            {t(
              "你可以在课程页面添加 Assessment，或在计划页面创建自定义任务。",
              "Add an assessment from a course or create a custom task in Plan.",
            )}
          </p>
        </section>
      )}

      <div className="saas-two-column">
        <section className="saas-card">
          <div className="saas-section-heading">
            <div>
              <p className="saas-eyebrow">Next up</p>
              <h2>{t("下一步队列", "Next-up queue")}</h2>
            </div>
            <span>
              {t(
                `${queue.length} 项`,
                `${queue.length} item${queue.length === 1 ? "" : "s"}`,
              )}
            </span>
          </div>
          <TodayQueue
            initialTasks={queue.map((task) => ({
              id: task.id,
              title: task.title,
              courseName: task.courseName,
              estimatedMinutes: task.estimatedMinutes,
              priority: task.priority,
            }))}
            dateKey={dateKey}
            language={user.preferredLanguage}
          />
          <RebalanceButton language={user.preferredLanguage} />
        </section>

        <section className="saas-card">
          <div className="saas-section-heading">
            <div>
              <p className="saas-eyebrow">Schedule</p>
              <h2>{t("今天的课", "Today's classes")}</h2>
            </div>
          </div>
          {data.classSessions.length ? (
            <ol className="saas-list">
              {data.classSessions.map((session) => (
                <li key={session.id}>
                  <div>
                    <strong>
                      {session.startTime}–{session.endTime} · {session.title}
                    </strong>
                    <span>
                      {session.courseName}
                      {session.location ? ` · ${session.location}` : ""}
                    </span>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <p className="saas-muted">
              {t("今天没有固定课程。", "No scheduled classes today.")}
            </p>
          )}
        </section>
      </div>

      <section className="saas-card">
        <div className="saas-section-heading">
          <div>
            <p className="saas-eyebrow">Deadlines</p>
            <h2>{t("最近截止日期", "Upcoming deadlines")}</h2>
          </div>
        </div>
        {data.assessments.length ? (
          <ol className="saas-list saas-deadline-list">
            {data.assessments.map((assessment) => (
              <li key={assessment.id}>
                <div>
                  <strong>{assessment.title}</strong>
                  <span>
                    {[assessment.courseCode, assessment.courseName]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </div>
                <time dateTime={assessment.dueAt ?? undefined}>
                  {assessment.dueAt
                    ? new Intl.DateTimeFormat(locale(user.preferredLanguage), {
                        timeZone: user.timezone,
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      }).format(new Date(assessment.dueAt))
                    : t("未设置", "Not set")}
                </time>
              </li>
            ))}
          </ol>
        ) : (
          <p className="saas-muted">
            {t("还没有截止日期。", "No deadlines have been added yet.")}
          </p>
        )}
      </section>
    </div>
  );
}
