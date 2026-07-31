"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface PracticeCourse {
  id: string;
  courseCode: string | null;
  courseName: string;
  colourKey: string;
  questionCount: number;
  dueReviewCount: number;
}

export function PracticeSetup({
  courses,
  initialCourseId,
  initialTaskId,
  activeSession,
  language,
}: {
  courses: PracticeCourse[];
  initialCourseId: string | null;
  initialTaskId: string | null;
  activeSession: {
    id: string;
    courseName: string;
    topicTitle: string;
  } | null;
  language: "zh-CN" | "en";
}) {
  const router = useRouter();
  const [courseId, setCourseId] = useState(initialCourseId ?? "");
  const [confidence, setConfidence] = useState(3);
  const [topicTitle, setTopicTitle] = useState("");
  const [difficulty, setDifficulty] = useState(2);
  const [prompt, setPrompt] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correctChoiceIndex, setCorrectChoiceIndex] = useState(0);
  const [hint1, setHint1] = useState("");
  const [hint2, setHint2] = useState("");
  const [hint3, setHint3] = useState("");
  const [explanation, setExplanation] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const t = (zh: string, en: string) =>
    language === "zh-CN" ? zh : en;

  const selectedCourse = courses.find((course) => course.id === courseId);

  async function startPractice() {
    setSaving(true);
    setError("");
    setMessage("");
    const response = await fetch("/api/practice/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        courseId,
        studyTaskId:
          courseId === initialCourseId ? initialTaskId : null,
        confidenceBefore: confidence,
      }),
    });
    const result = (await response.json()) as {
      session?: { sessionId?: string };
      error?: { message?: string };
    };
    const sessionId = result.session?.sessionId;
    if (!response.ok || !sessionId) {
      setError(
        result.error?.message ??
          t("暂时无法开始练习。", "Practice could not be started."),
      );
      setSaving(false);
      return;
    }
    router.push(`/app/practice/${sessionId}`);
  }

  async function createQuestion(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    const response = await fetch("/api/practice/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        courseId,
        topicTitle,
        difficulty,
        prompt,
        options,
        correctChoiceIndex,
        hint1,
        hint2: hint2 || null,
        hint3: hint3 || null,
        explanation,
        language,
      }),
    });
    const result = (await response.json()) as {
      error?: { message?: string };
    };
    if (!response.ok) {
      setError(
        result.error?.message ??
          t(
            "暂时无法保存练习题。",
            "The practice question could not be saved.",
          ),
      );
      setSaving(false);
      return;
    }
    setMessage(
      t(
        "私人练习题已保存，现在可以开始练习。",
        "Your private question is saved and ready to practise.",
      ),
    );
    setPrompt("");
    setOptions(["", "", "", ""]);
    setHint1("");
    setHint2("");
    setHint3("");
    setExplanation("");
    setSaving(false);
    router.refresh();
  }

  if (!courses.length) {
    return (
      <section className="saas-empty">
        <h2>{t("先添加一门课程", "Add a course first")}</h2>
        <p>
          {t(
            "任意课程都可以建立私人题目和掌握度记录。",
            "Any course can have private questions and mastery evidence.",
          )}
        </p>
        <Link className="saas-button saas-button-primary" href="/app/courses">
          {t("前往课程", "Go to courses")}
        </Link>
      </section>
    );
  }

  return (
    <div className="saas-practice-layout">
      <section className="saas-practice-launch">
        <div>
          <p className="saas-eyebrow">Next question</p>
          <h2>{t("选择要检查的课程", "Choose a course to check")}</h2>
        </div>
        {activeSession ? (
          <aside className="saas-resume-session">
            <span>{t("未完成的练习", "Unfinished practice")}</span>
            <strong>
              {activeSession.courseName} · {activeSession.topicTitle}
            </strong>
            <Link
              className="saas-button saas-button-primary"
              href={`/app/practice/${activeSession.id}`}
            >
              {t("继续作答", "Continue")}
            </Link>
          </aside>
        ) : (
          <>
            <div className="saas-field">
              <label htmlFor="practice-course">
                {t("课程", "Course")}
              </label>
              <select
                id="practice-course"
                value={courseId}
                onChange={(event) => setCourseId(event.target.value)}
              >
                {courses.map((course) => (
                  <option value={course.id} key={course.id}>
                    {[course.courseCode, course.courseName]
                      .filter(Boolean)
                      .join(" · ")}
                  </option>
                ))}
              </select>
            </div>
            <div className="saas-practice-course-state">
              <div>
                <span>{t("可用私人题目", "Private questions")}</span>
                <strong>{selectedCourse?.questionCount ?? 0}</strong>
              </div>
              <div>
                <span>{t("到期复测", "Due retests")}</span>
                <strong>{selectedCourse?.dueReviewCount ?? 0}</strong>
              </div>
            </div>
            <div className="saas-field">
              <label htmlFor="practice-confidence">
                {t("开始前信心", "Confidence before starting")}
              </label>
              <select
                id="practice-confidence"
                value={confidence}
                onChange={(event) => setConfidence(Number(event.target.value))}
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
              disabled={saving || !courseId}
              onClick={startPractice}
            >
              {saving
                ? t("正在选择题目…", "Selecting a question…")
                : t("开始一道题", "Start one question")}
            </button>
          </>
        )}
      </section>

      <details className="saas-card saas-question-builder">
        <summary>
          <span>
            <strong>
              {t(
                "为任意课程建立私人题目",
                "Create a private question for any course",
              )}
            </strong>
            <small>
              {t(
                "你的题目不会共享给其他用户",
                "Your question is never shared with other users",
              )}
            </small>
          </span>
          <span aria-hidden="true">＋</span>
        </summary>
        <form className="saas-form" onSubmit={createQuestion}>
          <div className="saas-form-grid">
            <div className="saas-field">
              <label htmlFor="question-topic">
                {t("知识点", "Topic")}
              </label>
              <input
                id="question-topic"
                value={topicTitle}
                onChange={(event) => setTopicTitle(event.target.value)}
                placeholder={t(
                  "例如：向量投影、指针、细胞膜",
                  "For example: vector projection, pointers, cell membranes",
                )}
                required
              />
            </div>
            <div className="saas-field">
              <label htmlFor="question-difficulty">
                {t("难度", "Difficulty")}
              </label>
              <select
                id="question-difficulty"
                value={difficulty}
                onChange={(event) => setDifficulty(Number(event.target.value))}
              >
                {[1, 2, 3, 4, 5].map((value) => (
                  <option value={value} key={value}>
                    {value} / 5
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="saas-field">
            <label htmlFor="question-prompt">
              {t("题目", "Question")}
            </label>
            <textarea
              id="question-prompt"
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder={t(
                "写一道可以独立检查理解的题目",
                "Write a question that checks understanding independently",
              )}
              required
            />
          </div>
          <fieldset className="saas-option-builder">
            <legend>{t("选项与正确答案", "Options and correct answer")}</legend>
            {options.map((option, index) => (
              <label key={index}>
                <input
                  type="radio"
                  name="correct-choice"
                  checked={correctChoiceIndex === index}
                  onChange={() => setCorrectChoiceIndex(index)}
                />
                <span>{String.fromCharCode(65 + index)}</span>
                <input
                  aria-label={t(
                    `选项 ${String.fromCharCode(65 + index)}`,
                    `Option ${String.fromCharCode(65 + index)}`,
                  )}
                  value={option}
                  onChange={(event) =>
                    setOptions((current) =>
                      current.map((item, optionIndex) =>
                        optionIndex === index ? event.target.value : item,
                      ),
                    )
                  }
                  required
                />
              </label>
            ))}
          </fieldset>
          <div className="saas-field">
            <label htmlFor="question-hint-1">
              {t("最小提示", "Minimal hint")}
            </label>
            <textarea
              id="question-hint-1"
              value={hint1}
              onChange={(event) => setHint1(event.target.value)}
              placeholder={t(
                "只指出下一步，不直接给答案",
                "Point to the next step without giving the answer",
              )}
              required
            />
          </div>
          <div className="saas-form-grid">
            <div className="saas-field">
              <label htmlFor="question-hint-2">
                {t("第二提示（可选）", "Second hint (optional)")}
              </label>
              <textarea
                id="question-hint-2"
                value={hint2}
                onChange={(event) => setHint2(event.target.value)}
              />
            </div>
            <div className="saas-field">
              <label htmlFor="question-hint-3">
                {t("第三提示（可选）", "Third hint (optional)")}
              </label>
              <textarea
                id="question-hint-3"
                value={hint3}
                onChange={(event) => setHint3(event.target.value)}
              />
            </div>
          </div>
          <div className="saas-field">
            <label htmlFor="question-explanation">
              {t("答案解释", "Answer explanation")}
            </label>
            <textarea
              id="question-explanation"
              value={explanation}
              onChange={(event) => setExplanation(event.target.value)}
              placeholder={t(
                "说明为什么正确，以及常见错误",
                "Explain why it is correct and describe common errors",
              )}
              required
            />
          </div>
          <button
            type="submit"
            className="saas-button saas-button-secondary"
            disabled={saving || !courseId}
          >
            {saving
              ? t("正在保存…", "Saving…")
              : t("保存为私人题目", "Save private question")}
          </button>
        </form>
      </details>
      {message ? (
        <p className="saas-success" role="status">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="saas-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
