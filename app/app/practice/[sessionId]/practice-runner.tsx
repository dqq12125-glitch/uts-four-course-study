"use client";

import Link from "next/link";
import { useState } from "react";
import type { SafePracticeSession } from "@/src/application/learning-loop-service";

interface AttemptResult {
  attemptId: string;
  isCorrect: boolean;
  retryAllowed: false;
  masteryUpdated: true;
  hadIncorrectAttempt: boolean;
  correctAnswer: string;
  explanation: string;
  masteryBand: string;
  nextReviewAt: string;
  reviewIntervalHours: number;
  hintsUsed: number;
  timeSpentSeconds: number;
}

interface RetryResult {
  isCorrect: false;
  retryAllowed: true;
  masteryUpdated: false;
  hintsUsed: number;
  incorrectAttempts: number;
  message: string;
}

const errorOptions = [
  ["concept", "概念", "Concept"],
  ["formula", "公式", "Formula"],
  ["algebra", "代数", "Algebra"],
  ["units", "单位", "Units"],
  ["sign", "正负号", "Sign"],
  ["interpretation", "题意理解", "Interpretation"],
  ["syntax", "语法", "Syntax"],
  ["logic", "逻辑", "Logic"],
  ["careless", "粗心", "Careless"],
  ["unknown", "暂不确定", "Not sure"],
] as const;

const bandLabels: Record<string, readonly [string, string]> = {
  not_started: ["未开始", "Not started"],
  building: ["正在建立", "Building"],
  basic: ["基本掌握", "Basic mastery"],
  stable: ["稳定掌握", "Stable mastery"],
  review_due: ["需要复测", "Retest due"],
};

export function PracticeRunner({
  session,
  timezone,
  language,
}: {
  session: SafePracticeSession;
  timezone: string;
  language: "zh-CN" | "en";
}) {
  const t = (zh: string, en: string) =>
    language === "zh-CN" ? zh : en;
  const [answer, setAnswer] = useState("");
  const [hints, setHints] = useState(session.revealedHints);
  const [retryNotice, setRetryNotice] = useState(
    session.incorrectAttempts > 0
      ? t(
          "上一次答案尚未通过。请求一个最小提示，再独立尝试一次。",
          "The previous answer did not pass. Request one minimal hint, then try independently again.",
        )
      : "",
  );
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [errorType, setErrorType] = useState("unknown");
  const [confidenceAfter, setConfidenceAfter] = useState(3);
  const [reflectionSaved, setReflectionSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function requestHint() {
    setSaving(true);
    setError("");
    const response = await fetch(
      `/api/practice/sessions/${session.sessionId}/hint`,
      { method: "POST" },
    );
    const payload = (await response.json()) as {
      hint?: string;
      error?: { message?: string };
    };
    if (!response.ok || !payload.hint) {
      setError(
        payload.error?.message ??
          t("暂时没有更多提示。", "No more hints are available."),
      );
      setSaving(false);
      return;
    }
    setHints((current) => [...current, payload.hint as string]);
    setSaving(false);
  }

  async function submit() {
    setSaving(true);
    setError("");
    const response = await fetch(
      `/api/practice/sessions/${session.sessionId}/attempt`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer }),
      },
    );
    const payload = (await response.json()) as (
      | AttemptResult
      | RetryResult
    ) & {
      error?: { message?: string };
    };
    if (!response.ok) {
      setError(
        payload.error?.message ??
          t("暂时无法提交答案。", "The answer could not be submitted."),
      );
      setSaving(false);
      return;
    }
    if (payload.retryAllowed) {
      setRetryNotice(payload.message);
      setAnswer("");
      setSaving(false);
      return;
    }
    setResult(payload);
    setErrorType(
      payload.isCorrect && !payload.hadIncorrectAttempt
        ? "unknown"
        : "concept",
    );
    setSaving(false);
  }

  async function saveReflection() {
    if (!result) return;
    setSaving(true);
    setError("");
    const response = await fetch(
      `/api/practice/attempts/${result.attemptId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ errorType, confidenceAfter }),
      },
    );
    const payload = (await response.json()) as {
      error?: { message?: string };
    };
    if (!response.ok) {
      setError(
        payload.error?.message ??
          t("暂时无法保存反思。", "The reflection could not be saved."),
      );
      setSaving(false);
      return;
    }
    setReflectionSaved(true);
    setSaving(false);
  }

  return (
    <article className="saas-practice-card">
      <header>
        <div>
          <p className="saas-eyebrow">
            {[session.courseCode, session.courseName]
              .filter(Boolean)
              .join(" · ")}
          </p>
          <h1>{session.topicTitle}</h1>
        </div>
        <span>
          {t("难度", "Difficulty")} {session.difficulty} / 5
        </span>
      </header>
      <section className="saas-question-prompt">
        <span>{t("独立作答", "Independent answer")}</span>
        <h2>{session.prompt}</h2>
      </section>

      {!result ? (
        <>
          <fieldset className="saas-answer-options">
            <legend>{t("选择一个答案", "Choose one answer")}</legend>
            {session.options.map((option, index) => (
              <label
                className={answer === String(index) ? "is-selected" : ""}
                key={option}
              >
                <input
                  type="radio"
                  name="practice-answer"
                  value={index}
                  checked={answer === String(index)}
                  onChange={(event) => setAnswer(event.target.value)}
                />
                <span>{String.fromCharCode(65 + index)}</span>
                <strong>{option}</strong>
              </label>
            ))}
          </fieldset>
          {hints.length ? (
            <ol
              className="saas-hint-stack"
              aria-label={t("已使用提示", "Used hints")}
            >
              {hints.map((hint, index) => (
                <li key={`${index}-${hint}`}>
                  <span>
                    {t(`提示 ${index + 1}`, `Hint ${index + 1}`)}
                  </span>
                  <p>{hint}</p>
                </li>
              ))}
            </ol>
          ) : null}
          {retryNotice ? (
            <div className="saas-retry-feedback" role="status">
              <strong>
                {t(
                  "先定位卡点，再试一次",
                  "Identify the sticking point, then try again",
                )}
              </strong>
              <p>{retryNotice}</p>
              <span>
                {t(
                  "当前未揭示正确答案，也未更新掌握度。",
                  "The correct answer remains hidden and mastery has not changed.",
                )}
              </span>
            </div>
          ) : null}
          <div className="saas-practice-actions">
            <button
              type="button"
              className="saas-button saas-button-primary"
              disabled={saving || !answer}
              onClick={submit}
            >
              {saving
                ? t("正在评分…", "Checking…")
                : retryNotice
                  ? t("再次提交答案", "Submit again")
                  : t("提交独立答案", "Submit independent answer")}
            </button>
            <button
              type="button"
              className="saas-button saas-button-secondary"
              disabled={saving || hints.length >= 3}
              onClick={requestHint}
            >
              {t("给我一个最小提示", "Give me one minimal hint")}
            </button>
          </div>
        </>
      ) : (
        <section
          className={`saas-attempt-result ${
            result.isCorrect ? "is-correct" : "is-incorrect"
          }`}
        >
          <div className="saas-result-verdict">
            <span>
              {result.isCorrect
                ? t("独立答案正确", "Independent answer correct")
                : t("这次还未通过", "Not passed yet")}
            </span>
            <strong>
              {t(
                ...(bandLabels[result.masteryBand] ?? [
                  "正在建立",
                  "Building",
                ]),
              )}
            </strong>
          </div>
          <dl>
            <div>
              <dt>{t("正确答案", "Correct answer")}</dt>
              <dd>{result.correctAnswer}</dd>
            </div>
            <div>
              <dt>{t("为什么", "Why")}</dt>
              <dd>{result.explanation}</dd>
            </div>
            <div>
              <dt>{t("下次复测", "Next retest")}</dt>
              <dd>
                {new Intl.DateTimeFormat(
                  language === "zh-CN" ? "zh-CN" : "en-AU",
                  {
                  timeZone: timezone,
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  },
                ).format(new Date(result.nextReviewAt))}
              </dd>
            </div>
          </dl>

          {!reflectionSaved ? (
            <div className="saas-reflection-card">
              <h2>{t("记录这次证据", "Record this evidence")}</h2>
              {!result.isCorrect || result.hadIncorrectAttempt ? (
                <div className="saas-field">
                  <label htmlFor="attempt-error">
                    {t("主要错误类型", "Main error type")}
                  </label>
                  <select
                    id="attempt-error"
                    value={errorType}
                    onChange={(event) => setErrorType(event.target.value)}
                  >
                    {errorOptions.map(([value, zh, en]) => (
                      <option value={value} key={value}>
                        {t(zh, en)}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}
              <div className="saas-field">
                <label htmlFor="attempt-confidence">
                  {t("作答后的信心", "Confidence after answering")}
                </label>
                <select
                  id="attempt-confidence"
                  value={confidenceAfter}
                  onChange={(event) =>
                    setConfidenceAfter(Number(event.target.value))
                  }
                >
                  {[1, 2, 3, 4, 5].map((value) => (
                    <option value={value} key={value}>
                      {value} / 5
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                className="saas-button saas-button-primary"
                disabled={saving}
                onClick={saveReflection}
              >
                {saving
                  ? t("正在保存…", "Saving…")
                  : t(
                      "保存错误类型与信心",
                      "Save error type and confidence",
                    )}
              </button>
            </div>
          ) : (
            <div className="saas-result-actions">
              <Link
                className="saas-button saas-button-primary"
                href="/app/mastery"
              >
                {t("查看掌握度", "View mastery")}
              </Link>
              <Link
                className="saas-button saas-button-secondary"
                href="/app/practice"
              >
                {t("返回练习", "Back to practice")}
              </Link>
            </div>
          )}
        </section>
      )}
      {error ? (
        <p className="saas-error" role="alert">
          {error}
        </p>
      ) : null}
    </article>
  );
}
