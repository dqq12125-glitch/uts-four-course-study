"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function AssessmentForm({
  courseId,
  language,
}: {
  courseId: string;
  language: "zh-CN" | "en";
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const t = (zh: string, en: string) =>
    language === "zh-CN" ? zh : en;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch(`/api/courses/${courseId}/assessments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.get("title"),
        assessmentType: form.get("assessmentType"),
        dueLocal: form.get("dueLocal") || null,
        weightPercent: form.get("weightPercent")
          ? Number(form.get("weightPercent"))
          : null,
        estimatedMinutes: form.get("estimatedMinutes")
          ? Number(form.get("estimatedMinutes"))
          : null,
        notes: form.get("notes") || null,
      }),
    });
    if (!response.ok) {
      const result = (await response.json()) as {
        error?: { message?: string };
      };
      setError(
        result.error?.message ??
          t(
            "无法创建 Assessment。",
            "The assessment could not be created.",
          ),
      );
      setSaving(false);
      return;
    }
    event.currentTarget.reset();
    setOpen(false);
    setSaving(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button
        type="button"
        className="saas-button saas-button-secondary"
        onClick={() => setOpen(true)}
      >
        {t("添加 Assessment", "Add assessment")}
      </button>
    );
  }

  return (
    <form className="saas-form saas-inline-form" onSubmit={submit}>
      <div className="saas-form-grid">
        <div className="saas-field saas-field-wide">
          <label htmlFor="new-assessment-title">
            {t("名称", "Title")}
          </label>
          <input
            id="new-assessment-title"
            name="title"
            required
            maxLength={160}
          />
        </div>
        <div className="saas-field">
          <label htmlFor="new-assessment-type">
            {t("类型", "Type")}
          </label>
          <select
            id="new-assessment-type"
            name="assessmentType"
            defaultValue="assignment"
          >
            <option value="assignment">Assignment</option>
            <option value="quiz">Quiz</option>
            <option value="exam">Exam</option>
            <option value="lab">Lab</option>
            <option value="project">Project</option>
            <option value="presentation">Presentation</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div className="saas-field">
          <label htmlFor="new-assessment-due">
            {t("截止时间", "Due date and time")}
          </label>
          <input
            id="new-assessment-due"
            name="dueLocal"
            type="datetime-local"
          />
        </div>
        <div className="saas-field">
          <label htmlFor="new-assessment-weight">
            {t("权重 %", "Weight %")}
          </label>
          <input
            id="new-assessment-weight"
            name="weightPercent"
            type="number"
            min="0"
            max="100"
          />
        </div>
        <div className="saas-field">
          <label htmlFor="new-assessment-minutes">
            {t("预计分钟", "Estimated minutes")}
          </label>
          <input
            id="new-assessment-minutes"
            name="estimatedMinutes"
            type="number"
            min="5"
            defaultValue="60"
          />
        </div>
        <div className="saas-field saas-field-wide">
          <label htmlFor="new-assessment-notes">
            {t("备注（可选）", "Notes (optional)")}
          </label>
          <textarea
            id="new-assessment-notes"
            name="notes"
            rows={3}
            maxLength={2000}
          />
        </div>
      </div>
      {error ? (
        <p className="saas-error" role="alert">
          {error}
        </p>
      ) : null}
      <div className="saas-task-actions">
        <button
          className="saas-button saas-button-primary"
          type="submit"
          disabled={saving}
        >
          {saving ? t("保存中…", "Saving…") : t("保存", "Save")}
        </button>
        <button
          className="saas-button saas-button-secondary"
          type="button"
          onClick={() => setOpen(false)}
          disabled={saving}
        >
          {t("取消", "Cancel")}
        </button>
      </div>
    </form>
  );
}
