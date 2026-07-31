"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

async function api(
  url: string,
  method: "PATCH" | "POST",
  body?: unknown,
) {
  const response = await fetch(url, {
    method,
    ...(body === undefined
      ? {}
      : {
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }),
  });
  const payload = (await response.json().catch(() => null)) as
    | { error?: { message?: string } }
    | null;
  if (!response.ok) {
    throw new Error(payload?.error?.message ?? "Admin action failed.");
  }
}

export function FeatureFlagToggle({
  flagKey,
  initialEnabled,
}: {
  flagKey: string;
  initialEnabled: boolean;
}) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(initialEnabled);
  const [busy, setBusy] = useState(false);
  async function toggle() {
    const next = !enabled;
    setBusy(true);
    try {
      await api(
        `/api/admin/feature-flags/${encodeURIComponent(flagKey)}`,
        "PATCH",
        { enabled: next },
      );
      setEnabled(next);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }
  return (
    <button
      className="saas-button saas-button-secondary"
      type="button"
      disabled={busy}
      onClick={toggle}
    >
      {enabled ? "Enabled" : "Disabled"}
    </button>
  );
}

export function UserStatusControl({
  userId,
  currentStatus,
}: {
  userId: string;
  currentStatus: "active" | "suspended";
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function update() {
    const next = currentStatus === "active" ? "suspended" : "active";
    if (
      next === "suspended" &&
      !window.confirm("停用此学生账户并撤销现有会话？")
    ) {
      return;
    }
    setBusy(true);
    try {
      await api(`/api/admin/users/${userId}/status`, "PATCH", {
        status: next,
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }
  return (
    <button
      className="saas-text-button"
      type="button"
      disabled={busy}
      onClick={update}
    >
      {currentStatus === "active" ? "停用" : "恢复"}
    </button>
  );
}

export function TemplateAdminForm({
  template,
}: {
  template: {
    id: string;
    courseCode: string | null;
    courseName: string;
    description: string | null;
    defaultLanguage: "zh-CN" | "en";
    isActive: number | boolean;
  };
}) {
  const [message, setMessage] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    try {
      await api(`/api/admin/course-templates/${template.id}`, "PATCH", {
        courseCode: form.get("courseCode") || null,
        courseName: form.get("courseName"),
        description: form.get("description") || null,
        defaultLanguage: form.get("defaultLanguage"),
        isActive: form.get("isActive") === "on",
      });
      setMessage("已保存");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "保存失败");
    }
  }
  return (
    <form className="saas-admin-template-form" onSubmit={submit}>
      <div className="saas-field">
        <label htmlFor={`${template.id}-code`}>代码</label>
        <input
          id={`${template.id}-code`}
          name="courseCode"
          defaultValue={template.courseCode ?? ""}
        />
      </div>
      <div className="saas-field">
        <label htmlFor={`${template.id}-name`}>名称</label>
        <input
          id={`${template.id}-name`}
          name="courseName"
          defaultValue={template.courseName}
          required
        />
      </div>
      <div className="saas-field">
        <label htmlFor={`${template.id}-description`}>描述</label>
        <textarea
          id={`${template.id}-description`}
          name="description"
          defaultValue={template.description ?? ""}
          rows={2}
        />
      </div>
      <div className="saas-field">
        <label htmlFor={`${template.id}-language`}>语言</label>
        <select
          id={`${template.id}-language`}
          name="defaultLanguage"
          defaultValue={template.defaultLanguage}
        >
          <option value="en">English</option>
          <option value="zh-CN">中文</option>
        </select>
      </div>
      <label className="saas-check-row">
        <input
          name="isActive"
          type="checkbox"
          defaultChecked={Boolean(template.isActive)}
        />
        <span>Active</span>
      </label>
      <button className="saas-button saas-button-secondary" type="submit">
        保存
      </button>
      <span role="status">{message}</span>
    </form>
  );
}

export function QuestionReviewControl({
  questionId,
  currentStatus,
}: {
  questionId: string;
  currentStatus: "draft" | "reviewed" | "rejected";
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function update(reviewStatus: "reviewed" | "rejected") {
    setBusy(true);
    try {
      await api(`/api/admin/questions/${questionId}/review`, "PATCH", {
        reviewStatus,
      });
      router.refresh();
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="saas-inline-actions">
      <span>{currentStatus}</span>
      <button
        className="saas-text-button"
        type="button"
        disabled={busy}
        onClick={() => update("reviewed")}
      >
        通过
      </button>
      <button
        className="saas-text-button is-danger"
        type="button"
        disabled={busy}
        onClick={() => update("rejected")}
      >
        拒绝
      </button>
    </div>
  );
}

export function RunJobsButton() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  async function run() {
    setMessage("运行中…");
    try {
      await api("/api/admin/jobs/run", "POST");
      setMessage("已完成");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "失败");
    }
  }
  return (
    <div>
      <button
        className="saas-button saas-button-secondary"
        type="button"
        onClick={run}
      >
        手动运行 Cron
      </button>
      {message ? <small role="status">{message}</small> : null}
    </div>
  );
}

export function CreateTemplateForm() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setMessage("保存中…");
    try {
      await api("/api/admin/course-templates", "POST", {
        institutionId: form.get("institutionId") || null,
        courseCode: form.get("courseCode") || null,
        courseName: form.get("courseName"),
        description: form.get("description") || null,
        defaultLanguage: form.get("defaultLanguage"),
        colourKey: form.get("colourKey"),
      });
      event.currentTarget.reset();
      setMessage("已创建草案模板");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "创建失败");
    }
  }
  return (
    <details>
      <summary className="saas-button saas-button-secondary">
        创建课程模板
      </summary>
      <form className="saas-admin-template-form" onSubmit={submit}>
        <div className="saas-field">
          <label htmlFor="new-template-institution">Institution ID（可空）</label>
          <input
            id="new-template-institution"
            name="institutionId"
            placeholder="inst_uts"
          />
        </div>
        <div className="saas-field">
          <label htmlFor="new-template-code">课程代码（可空）</label>
          <input id="new-template-code" name="courseCode" maxLength={32} />
        </div>
        <div className="saas-field">
          <label htmlFor="new-template-name">课程名称</label>
          <input
            id="new-template-name"
            name="courseName"
            required
            maxLength={160}
          />
        </div>
        <div className="saas-field">
          <label htmlFor="new-template-description">描述</label>
          <textarea
            id="new-template-description"
            name="description"
            maxLength={2000}
          />
        </div>
        <div className="saas-field">
          <label htmlFor="new-template-language">语言</label>
          <select
            id="new-template-language"
            name="defaultLanguage"
            defaultValue="en"
          >
            <option value="en">English</option>
            <option value="zh-CN">中文</option>
          </select>
        </div>
        <div className="saas-field">
          <label htmlFor="new-template-colour">颜色</label>
          <select
            id="new-template-colour"
            name="colourKey"
            defaultValue="ocean"
          >
            {["ocean", "forest", "amber", "violet", "rose", "slate"].map(
              (colour) => (
                <option value={colour} key={colour}>
                  {colour}
                </option>
              ),
            )}
          </select>
        </div>
        <button className="saas-button saas-button-primary" type="submit">
          创建
        </button>
        <span role="status">{message}</span>
      </form>
    </details>
  );
}

export function CreatePublicQuestionForm({
  templates,
}: {
  templates: Array<{
    id: string;
    courseCode: string | null;
    courseName: string;
  }>;
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const options = String(form.get("options") || "")
      .split("\n")
      .map((value) => value.trim())
      .filter(Boolean);
    setMessage("保存中…");
    try {
      await api("/api/admin/questions", "POST", {
        courseTemplateId: form.get("courseTemplateId"),
        questionType: form.get("questionType"),
        difficulty: Number(form.get("difficulty")),
        prompt: form.get("prompt"),
        options,
        solution: form.get("solution"),
        hint1: form.get("hint1") || null,
        hint2: form.get("hint2") || null,
        hint3: form.get("hint3") || null,
        explanation: form.get("explanation"),
        language: form.get("language"),
      });
      event.currentTarget.reset();
      setMessage("已创建待审核原创题");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "创建失败");
    }
  }
  return (
    <details>
      <summary className="saas-button saas-button-secondary">
        创建原创公共题
      </summary>
      <form className="saas-admin-template-form" onSubmit={submit}>
        <div className="saas-field">
          <label htmlFor="question-template">课程模板</label>
          <select id="question-template" name="courseTemplateId" required>
            {templates.map((template) => (
              <option value={template.id} key={template.id}>
                {[template.courseCode, template.courseName]
                  .filter(Boolean)
                  .join(" · ")}
              </option>
            ))}
          </select>
        </div>
        <div className="saas-field">
          <label htmlFor="question-type">题型</label>
          <select
            id="question-type"
            name="questionType"
            defaultValue="single_choice"
          >
            <option value="single_choice">single choice</option>
            <option value="multiple_choice">multiple choice</option>
            <option value="short_answer">short answer</option>
            <option value="numeric">numeric</option>
          </select>
        </div>
        <div className="saas-field">
          <label htmlFor="question-difficulty">难度 1–5</label>
          <input
            id="question-difficulty"
            name="difficulty"
            type="number"
            min={1}
            max={5}
            defaultValue={2}
            required
          />
        </div>
        <div className="saas-field">
          <label htmlFor="question-language">语言</label>
          <select id="question-language" name="language" defaultValue="en">
            <option value="en">English</option>
            <option value="zh-CN">中文</option>
          </select>
        </div>
        <div className="saas-field saas-field-wide">
          <label htmlFor="question-prompt">题目</label>
          <textarea id="question-prompt" name="prompt" required maxLength={2000} />
        </div>
        <div className="saas-field saas-field-wide">
          <label htmlFor="question-options">选项（每行一个）</label>
          <textarea id="question-options" name="options" maxLength={3000} />
        </div>
        <div className="saas-field saas-field-wide">
          <label htmlFor="question-solution">标准答案</label>
          <textarea
            id="question-solution"
            name="solution"
            required
            maxLength={2000}
          />
        </div>
        {["hint1", "hint2", "hint3"].map((name, index) => (
          <div className="saas-field" key={name}>
            <label htmlFor={`question-${name}`}>提示 {index + 1}</label>
            <textarea
              id={`question-${name}`}
              name={name}
              maxLength={1000}
            />
          </div>
        ))}
        <div className="saas-field saas-field-wide">
          <label htmlFor="question-explanation">讲解</label>
          <textarea
            id="question-explanation"
            name="explanation"
            required
            maxLength={3000}
          />
        </div>
        <button className="saas-button saas-button-primary" type="submit">
          保存为待审核
        </button>
        <span role="status">{message}</span>
      </form>
    </details>
  );
}
