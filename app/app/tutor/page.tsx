import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentUserFromCookies } from "@/src/application/session";
import {
  getLearningRepository,
  getResourceService,
} from "@/src/application/runtime";
import { TutorWorkspace } from "./tutor-workspace";
import { copy } from "@/src/lib/i18n";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "AI 学习导师" };

export default async function TutorPage() {
  const user = await currentUserFromCookies();
  if (!user) redirect("/auth/sign-in");
  const t = (zh: string, en: string) =>
    copy(user.preferredLanguage, zh, en);
  const [courses, resources] = await Promise.all([
    getLearningRepository().listCourses(user.id),
    getResourceService().list(user.id),
  ]);

  return (
    <div className="saas-page saas-tutor-page">
      <section className="saas-page-heading">
        <p className="saas-eyebrow">{t("提示优先的导师", "Hint-first tutor")}</p>
        <h1>{t("AI 学习导师", "AI study tutor")}</h1>
        <p className="saas-lead">
          {t(
            "学习辅导模式：优先提示，不直接替你完成需要独立提交的评估任务。",
            "Study support mode: hints come first, and the tutor will not complete independently assessed work for you.",
          )}
        </p>
      </section>
      <TutorWorkspace
        language={user.preferredLanguage}
        courses={courses.map((course) => ({
          id: course.id,
          courseCode: course.courseCode,
          courseName: course.courseName,
        }))}
        resources={resources
          .filter(
            (resource) =>
              resource.processingStatus === "ready" ||
              resource.processingStatus === "awaiting_confirmation",
          )
          .map((resource) => ({
            id: resource.id,
            courseId: resource.courseId,
            fileName: resource.fileName,
          }))}
      />
    </div>
  );
}
