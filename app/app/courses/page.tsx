import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentUserFromCookies } from "@/src/application/session";
import {
  getEntitlementService,
  getLearningRepository,
} from "@/src/application/runtime";
import { CourseCreateForm } from "@/app/app/courses/course-create-form";
import { copy } from "@/src/lib/i18n";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "课程" };

export default async function CoursesPage() {
  const user = await currentUserFromCookies();
  if (!user) redirect("/auth/sign-in");
  const t = (zh: string, en: string) =>
    copy(user.preferredLanguage, zh, en);
  const repository = getLearningRepository();
  const [courses, entitlement] = await Promise.all([
    repository.listCourses(user.id),
    getEntitlementService().snapshot(user.id, user.role),
  ]);
  const templates =
    courses.length < entitlement.courseLimit
      ? await repository.listCourseTemplates()
      : [];

  return (
    <div className="saas-page">
      <section className="saas-page-heading">
        <p className="saas-eyebrow">Your semester</p>
        <h1>{t("课程", "Courses")}</h1>
        <p className="saas-lead">
          {t(
            "DeepStudy 不限定学科或课程代码；模板只是可选的起点。",
            "DeepStudy works with any subject or course code; templates are only optional starting points.",
          )}
        </p>
      </section>
      <div className="saas-course-grid">
        {courses.map((course) => (
          <Link
            className={`saas-course-card is-${course.colourKey}`}
            href={`/app/courses/${course.id}`}
            key={course.id}
          >
            <span>
              {course.courseCode || t("自定义课程", "Custom course")}
            </span>
            <h2>{course.courseName}</h2>
            <p>
              {t(
                `${course.assessmentCount ?? 0} 项 Assessment`,
                `${course.assessmentCount ?? 0} assessment${
                  Number(course.assessmentCount ?? 0) === 1 ? "" : "s"
                }`,
              )}
              {course.instructorName ? ` · ${course.instructorName}` : ""}
            </p>
          </Link>
        ))}
      </div>
      {courses.length < entitlement.courseLimit ? (
        <CourseCreateForm
          language={user.preferredLanguage}
          templates={templates.map((template) => ({
            id: template.id,
            courseCode: template.courseCode,
            courseName: template.courseName,
          }))}
        />
      ) : null}
      <aside className="saas-plan-note">
        <strong>
          {t(
            `当前方案：最多 ${entitlement.courseLimit} 门活跃课程`,
            `Current plan: up to ${entitlement.courseLimit} active course${
              entitlement.courseLimit === 1 ? "" : "s"
            }`,
          )}
        </strong>
        <span>
          {t(
            "课程可以来自任何大学、专业或学习项目。",
            "Courses may come from any university, discipline, or learning programme.",
          )}
          {courses.length >= entitlement.courseLimit ? (
            <>
              {" "}
              <Link href="/app/settings/billing">
                {t("查看可用升级方案。", "See available upgrades.")}
              </Link>
            </>
          ) : null}
        </span>
      </aside>
    </div>
  );
}
