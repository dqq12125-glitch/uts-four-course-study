import Link from "next/link";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { currentUserFromCookies } from "@/src/application/session";
import {
  getAcademicRepository,
  getLearningRepository,
} from "@/src/application/runtime";
import { AssessmentForm } from "@/app/app/courses/[courseId]/assessment-form";
import { AssessmentActions } from "@/app/app/courses/[courseId]/assessment-actions";
import { CourseActions } from "@/app/app/courses/[courseId]/course-actions";
import { ClassSessionManager } from "./class-session-manager";
import { TopicManager } from "./topic-manager";
import { copy, locale } from "@/src/lib/i18n";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "课程详情" };

function dateTimeLocalValue(
  value: string | null,
  timeZone: string,
): string {
  if (!value) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(value));
  const map = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );
  return `${map.year}-${map.month}-${map.day}T${map.hour}:${map.minute}`;
}

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const user = await currentUserFromCookies();
  if (!user) redirect("/auth/sign-in");
  const t = (zh: string, en: string) =>
    copy(user.preferredLanguage, zh, en);
  const { courseId } = await params;
  const repository = getLearningRepository();
  const course = await repository.findCourse(user.id, courseId);
  if (!course) notFound();
  const academic = getAcademicRepository();
  const [
    assessments,
    classSessions,
    topics,
    tasks,
    resources,
    attempts,
  ] = await Promise.all([
    repository.listAssessments(user.id, courseId),
    academic.listClassSessions(user.id, courseId),
    academic.listTopics(user.id, courseId),
    academic.courseTaskSummary(user.id, courseId),
    academic.courseResourceSummary(user.id, courseId),
    academic.courseAttemptSummary(user.id, courseId),
  ]);

  return (
    <div className="saas-page">
      <Link className="saas-back-link" href="/app/courses">
        ← {t("返回课程", "Back to courses")}
      </Link>
      <section className={`saas-course-hero is-${course.colourKey}`}>
        <p className="saas-eyebrow">
          {course.courseCode || t("自定义课程", "Custom course")}
        </p>
        <h1>{course.courseName}</h1>
        <p>
          {course.instructorName || t("未设置教师", "No instructor set")} ·{" "}
          {course.sourceType === "template"
            ? t("由模板创建", "Created from template")
            : t("手动创建", "Created manually")}
        </p>
      </section>
      <CourseActions
        course={{
          id: course.id,
          courseCode: course.courseCode,
          courseName: course.courseName,
          colourKey: course.colourKey,
          instructorName: course.instructorName,
        }}
        language={user.preferredLanguage}
      />
      <div className="saas-inline-actions">
        <Link className="saas-button saas-button-secondary" href="/app/tutor">
          {t("打开 AI 导师", "Open AI tutor")}
        </Link>
        <Link
          className="saas-button saas-button-secondary"
          href={`/app/resources?courseId=${encodeURIComponent(course.id)}&resourceType=timetable`}
        >
          {t("导入课表或资料", "Import timetable or resources")}
        </Link>
      </div>

      <ClassSessionManager
        courseId={course.id}
        sessions={classSessions.map((session) => ({
          id: session.id,
          sessionType: session.sessionType,
          title: session.title,
          dayOfWeek: session.dayOfWeek,
          startTime: session.startTime,
          endTime: session.endTime,
          location: session.location,
          mapUrl: session.mapUrl,
          startDate: session.startDate,
          endDate: session.endDate,
          recurrenceRule: session.recurrenceRule,
        }))}
        language={user.preferredLanguage}
      />

      <section className="saas-card">
        <div className="saas-section-heading">
          <div>
            <p className="saas-eyebrow">{t("截止日期", "Deadlines")}</p>
            <h2>{t("作业与考试", "Assessments")}</h2>
          </div>
          <AssessmentForm
            courseId={course.id}
            language={user.preferredLanguage}
          />
        </div>
        {assessments.length ? (
          <ol className="saas-list saas-deadline-list">
            {assessments.map((assessment) => (
              <li className="saas-assessment-row" key={assessment.id}>
                <div className="saas-assessment-copy">
                  <strong>{assessment.title}</strong>
                  <span>
                    {assessment.assessmentType.replaceAll("_", " ")}
                    {assessment.weightPercent !== null
                      ? ` · ${assessment.weightPercent}%`
                      : ""}
                  </span>
                </div>
                <div className="saas-assessment-meta">
                  <time dateTime={assessment.dueAt ?? undefined}>
                    {assessment.dueAt
                      ? new Intl.DateTimeFormat(locale(user.preferredLanguage), {
                          timeZone: user.timezone,
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }).format(new Date(assessment.dueAt))
                      : t("未设置截止", "No due date")}
                  </time>
                  <AssessmentActions
                    assessment={{
                      ...assessment,
                      dueLocal: dateTimeLocalValue(
                        assessment.dueAt,
                        user.timezone,
                      ),
                    }}
                    language={user.preferredLanguage}
                  />
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <p className="saas-muted">
            {t("还没有 Assessment。", "No assessments yet.")}
          </p>
        )}
      </section>

      <TopicManager
        courseId={course.id}
        topics={topics.map((topic) => ({
          id: topic.id,
          title: topic.title,
          description: topic.description,
          weekNumber: topic.weekNumber,
          sequenceNumber: topic.sequenceNumber,
          masteryScore: topic.masteryScore,
          nextReviewAt: topic.nextReviewAt,
          attemptCount: topic.attemptCount,
        }))}
        language={user.preferredLanguage}
      />

      <div className="saas-two-column">
        <section className="saas-card">
          <div className="saas-section-heading">
            <div>
              <p className="saas-eyebrow">{t("学习任务", "Study tasks")}</p>
              <h2>{t("近期学习任务", "Recent study tasks")}</h2>
            </div>
            <Link href="/app/plan">{t("打开计划", "Open plan")}</Link>
          </div>
          {tasks.length ? (
            <ol className="saas-list">
              {tasks.slice(0, 8).map((task) => (
                <li key={String(task.id)}>
                  <div>
                    <strong>{String(task.title)}</strong>
                    <span>
                      {String(task.scheduledFor)} ·{" "}
                      {String(task.estimatedMinutes)} {t("分钟", "min")} ·{" "}
                      {String(task.status)}
                    </span>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <p className="saas-muted">
              {t(
                "还没有这门课的学习任务。",
                "No study tasks for this course yet.",
              )}
            </p>
          )}
        </section>

        <section className="saas-card">
          <div className="saas-section-heading">
            <div>
              <p className="saas-eyebrow">{t("近期练习", "Recent practice")}</p>
              <h2>{t("最近练习证据", "Recent practice evidence")}</h2>
            </div>
            <Link href="/app/practice">{t("开始练习", "Start practice")}</Link>
          </div>
          {attempts.length ? (
            <ol className="saas-list">
              {attempts.map((attempt) => (
                <li key={String(attempt.id)}>
                  <div>
                    <strong>{String(attempt.topicTitle)}</strong>
                    <span>
                      {attempt.isCorrect
                        ? t("正确", "Correct")
                        : t("需要继续建立", "Still building")}{" "}
                      ·{" "}
                      {Number(attempt.hintsUsed) > 0
                        ? t(
                            `使用 ${String(attempt.hintsUsed)} 个提示`,
                            `${String(attempt.hintsUsed)} hint(s) used`,
                          )
                        : t("独立完成", "Independent")}
                      {attempt.errorType
                        ? ` · ${String(attempt.errorType)}`
                        : ""}
                    </span>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <p className="saas-muted">
              {t("还没有练习记录。", "No practice evidence yet.")}
            </p>
          )}
        </section>
      </div>

      <section className="saas-card">
        <div className="saas-section-heading">
          <div>
            <p className="saas-eyebrow">{t("私人学习资料", "Private resources")}</p>
            <h2>{t("学习资料", "Study resources")}</h2>
          </div>
          <Link
            href={`/app/resources?courseId=${encodeURIComponent(course.id)}`}
          >
            {t("管理资料", "Manage resources")}
          </Link>
        </div>
        {resources.length ? (
          <ol className="saas-list">
            {resources.map((resource) => (
              <li key={String(resource.id)}>
                <div>
                  <strong>{String(resource.fileName)}</strong>
                  <span>
                    {String(resource.resourceType).replaceAll("_", " ")} ·{" "}
                    {String(resource.processingStatus)}
                  </span>
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <p className="saas-muted">
            {t(
              "没有上传到这门课的私人资料。",
              "No private resources uploaded for this course.",
            )}
          </p>
        )}
      </section>
    </div>
  );
}
