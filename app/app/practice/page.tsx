import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentUserFromCookies } from "@/src/application/session";
import { getLearningLoopRepository } from "@/src/application/runtime";
import { PracticeSetup } from "@/app/app/practice/practice-setup";
import { copy } from "@/src/lib/i18n";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "练习" };

export default async function PracticePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await currentUserFromCookies();
  if (!user) redirect("/auth/sign-in");
  if (!user.onboardingCompletedAt) redirect("/onboarding");
  const t = (zh: string, en: string) =>
    copy(user.preferredLanguage, zh, en);

  const params = await searchParams;
  const requestedCourseId =
    typeof params.courseId === "string" ? params.courseId : null;
  const requestedTaskId =
    typeof params.taskId === "string" ? params.taskId : null;
  const repository = getLearningLoopRepository();
  const [courses, active] = await Promise.all([
    repository.listPracticeCourses(user.id),
    repository.findActivePracticeSession(user.id),
  ]);
  const initialCourseId = courses.some(
    (course) => course.id === requestedCourseId,
  )
    ? requestedCourseId
    : courses[0]?.id ?? null;

  return (
    <div className="saas-page">
      <section className="saas-page-heading">
        <p className="saas-eyebrow">Retrieval practice</p>
        <h1>{t("先独立作答，再看解释", "Answer independently before seeing the explanation")}</h1>
        <p className="saas-lead">
          {t(
            "DeepStudy 根据到期复测和当前薄弱点选择题目。提示会被记录，因此使用提示后的正确答案不会被当作完全独立掌握。",
            "DeepStudy selects questions from due retests and current weak topics. Hint use is recorded, so a correct answer after hints is not treated as fully independent evidence.",
          )}
        </p>
      </section>
      <aside className="saas-integrity-note">
        <strong>{t("学习辅导模式", "Study support mode")}</strong>
        <span>
          {t(
            "私人题目用于练习和概念理解，不应复制正在评分的作业或考试答案。",
            "Private questions support practice and conceptual understanding; do not copy graded assignment or exam answers.",
          )}
        </span>
      </aside>
      <PracticeSetup
        courses={courses.map((course) => ({
          id: course.id,
          courseCode: course.courseCode,
          courseName: course.courseName,
          colourKey: course.colourKey,
          questionCount: course.questionCount,
          dueReviewCount: course.dueReviewCount,
        }))}
        initialCourseId={initialCourseId}
        initialTaskId={requestedTaskId}
        activeSession={
          active
            ? {
                id: active.sessionId,
                courseName: active.courseName,
                topicTitle: active.topicTitle,
              }
            : null
        }
        language={user.preferredLanguage}
      />
    </div>
  );
}
