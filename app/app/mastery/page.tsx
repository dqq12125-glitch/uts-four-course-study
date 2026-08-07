import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUserFromCookies } from "@/src/application/session";
import { getLearningLoopRepository } from "@/src/application/runtime";
import {
  isReviewDue,
  masteryBand,
  type MasteryBand,
} from "@/src/domain/mastery/review-queue";
import { copy, locale } from "@/src/lib/i18n";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "掌握度" };

const bandLabels: Record<MasteryBand, readonly [string, string]> = {
  not_started: ["未开始", "Not started"],
  building: ["正在建立", "Building"],
  basic: ["基本掌握", "Basic mastery"],
  stable: ["稳定掌握", "Stable mastery"],
  review_due: ["需要复测", "Retest due"],
};

const errorLabels: Record<string, readonly [string, string]> = {
  concept: ["概念", "concept"],
  formula: ["公式", "formula"],
  algebra: ["代数", "algebra"],
  units: ["单位", "units"],
  sign: ["正负号", "sign"],
  interpretation: ["题意理解", "interpretation"],
  syntax: ["语法", "syntax"],
  logic: ["逻辑", "logic"],
  careless: ["粗心", "careless"],
  unknown: ["待判断", "unclassified"],
};

export default async function MasteryPage() {
  const user = await currentUserFromCookies();
  if (!user) redirect("/auth/sign-in");
  const t = (zh: string, en: string) =>
    copy(user.preferredLanguage, zh, en);
  const now = new Date();
  const records = await getLearningLoopRepository().listMastery(user.id);
  const dueCount = records.filter((record) =>
    isReviewDue(record.nextReviewAt, now),
  ).length;
  const stableCount = records.filter(
    (record) =>
      masteryBand(record, now) === "stable",
  ).length;

  return (
    <div className="saas-page">
      <section className="saas-page-heading">
        <p className="saas-eyebrow">
          {t("依据证据，而不只依据感觉", "Evidence, not confidence alone")}
        </p>
        <h1>
          {t(
            "掌握度来自独立作答和延迟复测",
            "Mastery comes from independent answers and delayed retests",
          )}
        </h1>
        <p className="saas-lead">
          {t(
            "界面使用区间而不是伪精确百分比。使用提示、错误类型、连续独立正确和延迟复测都会影响状态。",
            "Bands avoid false precision. Hint use, error type, consecutive independent answers, and delayed retests all affect the state.",
          )}
        </p>
      </section>
      <section
        className="saas-mastery-overview"
        aria-label={t("掌握度概览", "Mastery overview")}
      >
        <div className={dueCount ? "is-due" : ""}>
          <span>{t("到期复测", "Due retests")}</span>
          <strong>{dueCount}</strong>
          <small>{t("现在最值得处理", "Best next evidence")}</small>
        </div>
        <div>
          <span>{t("稳定掌握", "Stable mastery")}</span>
          <strong>{stableCount}</strong>
          <small>{t("已通过间隔证据", "Supported by spaced evidence")}</small>
        </div>
        <div>
          <span>{t("已记录知识点", "Recorded topics")}</span>
          <strong>{records.length}</strong>
          <small>{t("来自实际练习", "From real practice")}</small>
        </div>
      </section>

      {records.length ? (
        <section className="saas-mastery-list">
          {records.map((record) => {
            const band = masteryBand(record, now);
            const due = band === "review_due";
            const reviewHref =
              due && record.reviewTaskId
                ? `/app/practice?courseId=${encodeURIComponent(
                    record.courseId,
                  )}&taskId=${encodeURIComponent(record.reviewTaskId)}`
                : `/app/practice?courseId=${encodeURIComponent(
                    record.courseId,
                  )}`;
            return (
              <article
                className={`saas-mastery-row is-${band}`}
                key={record.id}
              >
                <div className="saas-mastery-course">
                  <span>
                    {record.courseCode || t("自定义课程", "Custom course")}
                  </span>
                  <strong>{record.courseName}</strong>
                </div>
                <div className="saas-mastery-topic">
                  <h2>{record.topicTitle}</h2>
                  <p>
                    {t(
                      `${record.attemptCount} 次作答 · 连续独立正确 ${record.consecutiveCorrect} 次`,
                      `${record.attemptCount} attempt${
                        record.attemptCount === 1 ? "" : "s"
                      } · ${record.consecutiveCorrect} consecutive independent correct`,
                    )}
                    {record.lastErrorType
                      ? ` · ${t("最近错误", "Latest error")}: ${
                          errorLabels[record.lastErrorType]
                            ? t(...errorLabels[record.lastErrorType])
                            : record.lastErrorType
                        }`
                      : ""}
                  </p>
                </div>
                <div className="saas-mastery-state">
                  <span>{t(...bandLabels[band])}</span>
                  <time dateTime={record.nextReviewAt ?? undefined}>
                    {record.nextReviewAt
                      ? due
                        ? t("现在到期", "Due now")
                        : new Intl.DateTimeFormat(locale(user.preferredLanguage), {
                            timeZone: user.timezone,
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }).format(new Date(record.nextReviewAt))
                      : t("等待首次练习", "Waiting for first practice")}
                  </time>
                  <Link
                    className={
                      due
                        ? "saas-button saas-button-primary"
                        : "saas-text-button"
                    }
                    href={reviewHref}
                  >
                    {due
                      ? t("开始复测", "Start retest")
                      : t("继续练习", "Continue practice")}
                  </Link>
                </div>
              </article>
            );
          })}
        </section>
      ) : (
        <section className="saas-empty">
          <p className="saas-eyebrow">{t("还没有证据", "No evidence yet")}</p>
          <h2>
            {t(
              "完成第一道练习后，这里才开始记录",
              "Mastery starts after your first completed practice",
            )}
          </h2>
          <p>
            {t(
              "单纯点击“我会了”不会提高掌握度。",
              'Simply saying “I know it” does not raise mastery.',
            )}
          </p>
          <Link className="saas-button saas-button-primary" href="/app/practice">
            {t("开始第一道练习", "Start first practice")}
          </Link>
        </section>
      )}
    </div>
  );
}
