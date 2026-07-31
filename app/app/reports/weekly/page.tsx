import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  getAcademicService,
  getEntitlementService,
} from "@/src/application/runtime";
import { currentUserFromCookies } from "@/src/application/session";
import { copy, locale } from "@/src/lib/i18n";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "周学习报告" };

export default async function WeeklyReportPage() {
  const user = await currentUserFromCookies();
  if (!user) redirect("/auth/sign-in");
  const t = (zh: string, en: string) =>
    copy(user.preferredLanguage, zh, en);
  const entitlement = await getEntitlementService().snapshot(
    user.id,
    user.role,
  );
  if (!entitlement.canAccessWeeklyReport) {
    return (
      <div className="saas-page">
        <section className="saas-page-heading">
          <p className="saas-eyebrow">Weekly report</p>
          <h1>
            {t(
              "把一周的执行证据整理成下一步",
              "Turn a week of evidence into the next step",
            )}
          </h1>
          <p>
            {t(
              "周报包含任务、专注、练习与复测数据，不读取私人资料正文。",
              "The report uses task, focus, practice, and retest data without reading private resource content.",
            )}
          </p>
        </section>
        <section className="saas-card saas-paywall-card">
          <h2>{t("Founding Pass 功能", "Founding Pass feature")}</h2>
          <p>
            {t(
              "免费版保留基础掌握度；学期通行证会解锁每周执行报告和按课程拆分。",
              "Free keeps basic mastery; a Semester Pass unlocks weekly execution reports and course breakdowns.",
            )}
          </p>
          <Link className="saas-button saas-button-primary" href="/pricing">
            {t("查看通行证", "View passes")}
          </Link>
        </section>
      </div>
    );
  }

  const report = await getAcademicService().weeklyReport({
    userId: user.id,
    role: user.role,
  });
  const accuracy =
    report.practiceAttempts > 0
      ? report.correctAttempts / report.practiceAttempts
      : null;
  const reportNow = Date.parse(report.to);

  return (
    <div className="saas-page">
      <section className="saas-page-heading">
        <p className="saas-eyebrow">Weekly report</p>
        <h1>
          {t(
            "这周完成了什么，下一周该巩固什么",
            "What you completed this week and what to strengthen next",
          )}
        </h1>
        <p>
          {new Intl.DateTimeFormat(
            locale(user.preferredLanguage),
            {
              timeZone: user.timezone,
              dateStyle: "medium",
            },
          ).formatRange(new Date(report.from), new Date(report.to))}
        </p>
      </section>

      <section
        className="saas-overview"
        aria-label={t("周学习概览", "Weekly study overview")}
      >
        <div>
          <span>{t("完成任务", "Completed tasks")}</span>
          <strong>{report.completedTasks}</strong>
        </div>
        <div>
          <span>{t("专注时间", "Focus time")}</span>
          <strong>
            {t(
              `${report.focusMinutes} 分钟`,
              `${report.focusMinutes} min`,
            )}
          </strong>
        </div>
        <div>
          <span>{t("练习次数", "Practice attempts")}</span>
          <strong>{report.practiceAttempts}</strong>
        </div>
        <div>
          <span>{t("练习正确率", "Practice accuracy")}</span>
          <strong>
            {accuracy === null
              ? t("暂无证据", "No evidence")
              : new Intl.NumberFormat(locale(user.preferredLanguage), {
                  style: "percent",
                  maximumFractionDigits: 0,
                }).format(accuracy)}
          </strong>
        </div>
        <div>
          <span>{t("完成复测", "Completed retests")}</span>
          <strong>{report.reviewsCompleted}</strong>
        </div>
        <div>
          <span>{t("当前待复测", "Retests due now")}</span>
          <strong>{report.dueReviews}</strong>
        </div>
      </section>

      <section className="saas-card">
        <div className="saas-section-heading">
          <div>
            <p className="saas-eyebrow">By course</p>
            <h2>{t("按课程查看执行证据", "Evidence by course")}</h2>
          </div>
        </div>
        <div className="saas-report-grid">
          {report.courses.map((course) => (
            <article
              className={`saas-report-course is-${course.colourKey}`}
              key={course.courseId}
            >
              <span>
                {course.courseCode || t("自定义课程", "Custom course")}
              </span>
              <h3>{course.courseName}</h3>
              <dl>
                <div>
                  <dt>{t("任务", "Tasks")}</dt>
                  <dd>{course.completedTasks}</dd>
                </div>
                <div>
                  <dt>{t("专注", "Focus")}</dt>
                  <dd>
                    {Math.floor(course.focusMinutes)} {t("分钟", "min")}
                  </dd>
                </div>
                <div>
                  <dt>{t("练习", "Practice")}</dt>
                  <dd>{course.practiceAttempts}</dd>
                </div>
                <div>
                  <dt>{t("复测", "Retests")}</dt>
                  <dd>{course.reviewsCompleted}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      </section>

      <section className="saas-card">
        <div className="saas-section-heading">
          <div>
            <p className="saas-eyebrow">Next evidence</p>
            <h2>{t("下一周优先巩固", "Strengthen next week")}</h2>
          </div>
          <Link href="/app/mastery">
            {t("打开复测队列", "Open retest queue")}
          </Link>
        </div>
        {report.weakTopics.length ? (
          <ol className="saas-list">
            {report.weakTopics.map((topic) => (
              <li key={`${topic.courseName}:${topic.topicTitle}`}>
                <div>
                  <strong>{topic.topicTitle}</strong>
                  <span>
                    {topic.courseName}
                    {topic.lastErrorType
                      ? ` · ${t("最近错误", "Latest error")}: ${topic.lastErrorType}`
                      : ""}
                  </span>
                </div>
                <span>
                  {topic.nextReviewAt &&
                  Date.parse(topic.nextReviewAt) <= reportNow
                    ? t("需要复测", "Retest due")
                    : topic.masteryScore < 40
                      ? t("正在建立", "Building")
                      : t("继续巩固", "Keep strengthening")}
                </span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="saas-muted">
            {t(
              "还没有足够的练习证据；先完成一道独立练习。",
              "There is not enough practice evidence yet. Complete one independent question first.",
            )}
          </p>
        )}
      </section>
    </div>
  );
}
