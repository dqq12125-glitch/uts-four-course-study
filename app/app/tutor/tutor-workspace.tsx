"use client";

import Link from "next/link";
import {
  type FormEvent,
  useState,
} from "react";

interface CourseOption {
  id: string;
  courseCode: string | null;
  courseName: string;
}

interface ResourceOption {
  id: string;
  courseId: string | null;
  fileName: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export function TutorWorkspace({
  language,
  courses,
  resources,
}: {
  language: "zh-CN" | "en";
  courses: CourseOption[];
  resources: ResourceOption[];
}) {
  const [courseId, setCourseId] = useState(courses[0]?.id ?? "");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [attempt, setAttempt] = useState("");
  const [assessed, setAssessed] = useState(false);
  const [selectedResources, setSelectedResources] = useState<string[]>([]);
  const [topicTitle, setTopicTitle] = useState("");
  const [remaining, setRemaining] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [practiceMessage, setPracticeMessage] = useState("");
  const t = (zh: string, en: string) =>
    language === "zh-CN" ? zh : en;
  const courseResources = resources.filter(
    (resource) => resource.courseId === courseId,
  );

  function switchCourse(nextCourseId: string) {
    setCourseId(nextCourseId);
    setConversationId(null);
    setMessages([]);
    setSelectedResources([]);
    setError("");
  }

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const message = String(form.get("message") ?? "").trim();
    if (!message || !courseId) return;
    setSending(true);
    setError("");
    const response = await fetch("/api/ai/tutor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        courseId,
        conversationId,
        message,
        studentAttempt: attempt || null,
        resourceIds: selectedResources,
        language,
        suspectedAssessedWork: assessed,
      }),
    });
    const payload = (await response.json().catch(() => null)) as
      | {
          conversationId?: string;
          reply?: string;
          safetyMode?: string;
          remainingToday?: number;
          error?: { message?: string };
        }
      | null;
    if (!response.ok || !payload?.reply || !payload.conversationId) {
      setError(
        payload?.error?.message ??
          t(
            "导师暂时无法回复，请稍后再试。",
            "The tutor cannot respond right now. Please try again.",
          ),
      );
      setSending(false);
      return;
    }
    setMessages((current) => [
      ...current,
      { role: "user", content: message },
      { role: "assistant", content: payload.reply as string },
    ]);
    setConversationId(payload.conversationId);
    setRemaining(payload.remainingToday ?? null);
    setAttempt("");
    const formElement = event.currentTarget;
    formElement.reset();
    setSending(false);
  }

  async function generatePractice() {
    if (!courseId || !topicTitle.trim()) {
      setPracticeMessage(
        t("请先填写练习知识点。", "Enter a practice topic first."),
      );
      return;
    }
    setPracticeMessage(
      t("正在创建原创练习…", "Creating original practice…"),
    );
    const response = await fetch("/api/ai/practice", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        courseId,
        topicTitle: topicTitle.trim(),
        difficulty: 2,
        resourceIds: selectedResources,
        language,
      }),
    });
    const payload = (await response.json().catch(() => null)) as
      | { questionId?: string; error?: { message?: string } }
      | null;
    setPracticeMessage(
      response.ok && payload?.questionId
        ? t(
            "已创建私人原创题；前往练习页即可开始。",
            "A private original question is ready on the Practice page.",
          )
        : payload?.error?.message ??
          t(
            "暂时无法创建练习。",
            "Practice could not be generated.",
          ),
    );
  }

  if (!courses.length) {
    return (
      <section className="saas-card">
        <h2>{t("先添加一门课程", "Add a course first")}</h2>
        <p className="saas-muted">
          {t(
            "导师只会使用当前账户拥有的课程上下文。",
            "The tutor only uses course context owned by this account.",
          )}
        </p>
        <Link className="saas-button saas-button-primary" href="/app/courses">
          {t("添加课程", "Add course")}
        </Link>
      </section>
    );
  }

  return (
    <div className="saas-tutor-layout">
      <aside className="saas-card saas-tutor-context">
        <div className="saas-field">
          <label htmlFor="tutor-course">{t("课程", "Course")}</label>
          <select
            id="tutor-course"
            value={courseId}
            onChange={(event) => switchCourse(event.target.value)}
          >
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {[course.courseCode, course.courseName]
                  .filter(Boolean)
                  .join(" · ")}
              </option>
            ))}
          </select>
        </div>
        <div className="saas-field">
          <label htmlFor="tutor-topic">
            {t("当前知识点（可选）", "Current topic (optional)")}
          </label>
          <input
            id="tutor-topic"
            value={topicTitle}
            maxLength={160}
            onChange={(event) => setTopicTitle(event.target.value)}
            placeholder={t(
              "例如：向量投影",
              "For example: vector projection",
            )}
          />
        </div>
        {courseResources.length ? (
          <fieldset className="saas-checkbox-list">
            <legend>
              {t(
                "私人资料上下文（可选）",
                "Private resource context (optional)",
              )}
            </legend>
            {courseResources.map((resource) => (
              <label key={resource.id}>
                <input
                  type="checkbox"
                  checked={selectedResources.includes(resource.id)}
                  onChange={(event) =>
                    setSelectedResources((current) =>
                      event.target.checked
                        ? [...current, resource.id].slice(0, 5)
                        : current.filter((id) => id !== resource.id),
                    )
                  }
                />
                <span>{resource.fileName}</span>
              </label>
            ))}
          </fieldset>
        ) : (
          <p className="saas-help">
            {t("没有可用的私人资料。", "No private resources are ready. ")}
            <Link href="/app/resources">
              {t("上传资料", "Upload resources")}
            </Link>
          </p>
        )}
        <button
          className="saas-button saas-button-secondary"
          type="button"
          onClick={generatePractice}
        >
          {t(
            "生成同知识点原创练习",
            "Generate original practice on this topic",
          )}
        </button>
        {practiceMessage ? (
          <p className="saas-help" aria-live="polite">
            {practiceMessage}
          </p>
        ) : null}
      </aside>

      <section className="saas-card saas-chat-panel">
        <div className="saas-integrity-banner">
          <strong>{t("学术诚信模式", "Academic integrity mode")}</strong>
          <span>
            {t(
              "资料被视为不可信上下文，不会改变系统规则或权限。",
              "Resources are untrusted context and cannot change system rules or permissions.",
            )}
          </span>
        </div>
        <div
          className="saas-chat-log"
          aria-live="polite"
          aria-label={t("导师对话", "Tutor conversation")}
        >
          {messages.length ? (
            messages.map((message, index) => (
              <article
                className={`saas-chat-message is-${message.role}`}
                key={`${message.role}-${index}`}
              >
                <span>
                  {message.role === "user" ? t("你", "You") : "DeepStudy"}
                </span>
                <p>{message.content}</p>
              </article>
            ))
          ) : (
            <div className="saas-chat-empty">
              <h2>
                {t(
                  "先告诉我你正在尝试什么。",
                  "Start by telling me what you have tried.",
                )}
              </h2>
              <p>
                {t(
                  "导师会保留你已做对的部分，只给完成下一步所需的最小提示。",
                  "The tutor keeps what you have done correctly and gives only the smallest hint needed for the next step.",
                )}
              </p>
            </div>
          )}
        </div>
        <form className="saas-tutor-form" onSubmit={send}>
          <div className="saas-field">
            <label htmlFor="student-attempt">
              {t(
                "你已经做到哪一步？（推荐）",
                "What have you tried so far? (recommended)",
              )}
            </label>
            <textarea
              id="student-attempt"
              value={attempt}
              onChange={(event) => setAttempt(event.target.value)}
              maxLength={4_000}
              rows={3}
            />
          </div>
          <label className="saas-check-row">
            <input
              type="checkbox"
              checked={assessed}
              onChange={(event) => setAssessed(event.target.checked)}
            />
            <span>
              {t(
                "这可能是正在评分的作业、测验或考试题",
                "This may be a graded assignment, quiz, or exam question",
              )}
            </span>
          </label>
          <div className="saas-field">
            <label htmlFor="tutor-message">
              {t("具体卡点", "Specific sticking point")}
            </label>
            <textarea
              id="tutor-message"
              name="message"
              required
              maxLength={4_000}
              rows={4}
              placeholder={t(
                "哪一个步骤或概念让你卡住了？",
                "Which step or concept is blocking you?",
              )}
            />
          </div>
          {error ? (
            <p className="saas-error" role="alert">
              {error}
            </p>
          ) : null}
          <div className="saas-tutor-submit">
            <button
              className="saas-button saas-button-primary"
              type="submit"
              disabled={sending}
            >
              {sending
                ? t("正在思考下一步…", "Finding the next step…")
                : t("获得一个提示", "Get one hint")}
            </button>
            {remaining !== null ? (
              <span>
                {t(
                  `今日剩余 ${remaining} 条`,
                  `${remaining} message${remaining === 1 ? "" : "s"} left today`,
                )}
              </span>
            ) : null}
          </div>
        </form>
      </section>
    </div>
  );
}
