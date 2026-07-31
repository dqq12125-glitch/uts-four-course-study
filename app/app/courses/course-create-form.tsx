"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

interface TemplateOption {
  id: string;
  courseCode: string | null;
  courseName: string;
}

export function CourseCreateForm({
  templates,
  language,
}: {
  templates: TemplateOption[];
  language: "zh-CN" | "en";
}) {
  const router = useRouter();
  const [mode, setMode] = useState<"manual" | "template">("manual");
  const [templateId, setTemplateId] = useState(templates[0]?.id ?? "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const selected = useMemo(
    () => templates.find((template) => template.id === templateId),
    [templateId, templates],
  );
  const t = (zh: string, en: string) =>
    language === "zh-CN" ? zh : en;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/courses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        templateId: mode === "template" ? templateId : null,
        courseCode: mode === "manual" ? form.get("courseCode") || null : null,
        courseName: mode === "manual" ? form.get("courseName") : null,
        instructorName: form.get("instructorName") || null,
        colourKey: form.get("colourKey"),
      }),
    });
    const result = (await response.json()) as {
      courseId?: string;
      error?: { message?: string };
    };
    if (!response.ok || !result.courseId) {
      setError(
        result.error?.message ??
          t("无法创建课程。", "The course could not be created."),
      );
      setSaving(false);
      return;
    }
    router.push(`/app/courses/${result.courseId}`);
    router.refresh();
  }

  return (
    <form className="saas-card saas-form" onSubmit={submit}>
      <div>
        <p className="saas-eyebrow">Open course</p>
        <h2>{t("添加一门课程", "Add a course")}</h2>
        <p className="saas-muted">
          {t(
            "课程不需要出现在模板中；名称是唯一必填项。",
            "A course does not need a template; only its name is required.",
          )}
        </p>
      </div>
      <div
        className="saas-segmented"
        role="group"
        aria-label={t("课程添加方式", "Course creation method")}
      >
        <button
          type="button"
          className={mode === "manual" ? "is-selected" : ""}
          onClick={() => setMode("manual")}
        >
          {t("创建任意课程", "Create any course")}
        </button>
        <button
          type="button"
          className={mode === "template" ? "is-selected" : ""}
          onClick={() => setMode("template")}
          disabled={!templates.length}
        >
          {t("使用模板", "Use a template")}
        </button>
      </div>
      <div className="saas-form-grid">
        {mode === "template" ? (
          <div className="saas-field saas-field-wide">
            <label htmlFor="new-course-template">
              {t("课程模板", "Course template")}
            </label>
            <select
              id="new-course-template"
              value={templateId}
              onChange={(event) => setTemplateId(event.target.value)}
            >
              {templates.map((template) => (
                <option value={template.id} key={template.id}>
                  {[template.courseCode, template.courseName]
                    .filter(Boolean)
                    .join(" · ")}
                </option>
              ))}
            </select>
            {selected ? (
              <p className="saas-help">
                {t(
                  `将创建 ${selected.courseName} 的私人副本。`,
                  `A private copy of ${selected.courseName} will be created.`,
                )}
              </p>
            ) : null}
          </div>
        ) : (
          <>
            <div className="saas-field">
              <label htmlFor="new-course-code">
                {t("课程代码（可选）", "Course code (optional)")}
              </label>
              <input
                id="new-course-code"
                name="courseCode"
                maxLength={32}
                placeholder="BIO101"
              />
            </div>
            <div className="saas-field">
              <label htmlFor="new-course-name">
                {t("课程名称", "Course name")}
              </label>
              <input
                id="new-course-name"
                name="courseName"
                required
                maxLength={160}
                placeholder="Academic English"
              />
            </div>
          </>
        )}
        <div className="saas-field">
          <label htmlFor="new-course-instructor">
            {t("教师（可选）", "Instructor (optional)")}
          </label>
          <input
            id="new-course-instructor"
            name="instructorName"
            maxLength={120}
          />
        </div>
        <div className="saas-field">
          <label htmlFor="new-course-colour">
            {t("颜色", "Colour")}
          </label>
          <select id="new-course-colour" name="colourKey" defaultValue="ocean">
            <option value="ocean">{t("海蓝", "Ocean")}</option>
            <option value="forest">{t("森林", "Forest")}</option>
            <option value="amber">{t("琥珀", "Amber")}</option>
            <option value="violet">{t("紫罗兰", "Violet")}</option>
            <option value="rose">{t("玫瑰", "Rose")}</option>
            <option value="slate">{t("岩灰", "Slate")}</option>
          </select>
        </div>
      </div>
      {error ? (
        <p className="saas-error" role="alert">
          {error}
        </p>
      ) : null}
      <button
        className="saas-button saas-button-primary"
        type="submit"
        disabled={saving}
      >
        {saving
          ? t("创建中…", "Creating…")
          : t(
              "创建课程并生成起步任务",
              "Create course and starting task",
            )}
      </button>
    </form>
  );
}
