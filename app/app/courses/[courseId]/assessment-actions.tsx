"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

interface AssessmentActionsProps {
  assessment: {
    id: string;
    title: string;
    assessmentType: string;
    dueLocal: string;
    weightPercent: number | null;
    estimatedMinutes: number | null;
    status: string;
    notes: string | null;
  };
  language: "zh-CN" | "en";
}

export function AssessmentActions({
  assessment,
  language,
}: AssessmentActionsProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const t = (zh: string, en: string) =>
    language === "zh-CN" ? zh : en;

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const response = await fetch(`/api/assessments/${assessment.id}`, {
      method: "PATCH",
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
        status: form.get("status"),
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
            "无法更新 Assessment。",
            "The assessment could not be updated.",
          ),
      );
      return;
    }
    setEditing(false);
    router.refresh();
  }

  async function remove() {
    if (
      !window.confirm(
        t("删除这项 Assessment？", "Delete this assessment?"),
      )
    )
      return;
    const response = await fetch(`/api/assessments/${assessment.id}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      setError(
        t(
          "无法删除 Assessment。",
          "The assessment could not be deleted.",
        ),
      );
      return;
    }
    router.refresh();
  }

  if (!editing) {
    return (
      <div className="saas-row-actions">
        <button
          className="saas-text-button"
          type="button"
          onClick={() => setEditing(true)}
        >
          {t("编辑", "Edit")}
        </button>
        <button
          className="saas-text-button is-danger"
          type="button"
          onClick={remove}
        >
          {t("删除", "Delete")}
        </button>
        {error ? (
          <span className="saas-error" role="alert">
            {error}
          </span>
        ) : null}
      </div>
    );
  }

  return (
    <form className="saas-form saas-row-editor" onSubmit={save}>
      <div className="saas-form-grid">
        <div className="saas-field saas-field-wide">
          <label htmlFor={`assessment-title-${assessment.id}`}>
            {t("名称", "Title")}
          </label>
          <input
            id={`assessment-title-${assessment.id}`}
            name="title"
            defaultValue={assessment.title}
            required
          />
        </div>
        <div className="saas-field">
          <label htmlFor={`assessment-type-${assessment.id}`}>
            {t("类型", "Type")}
          </label>
          <select
            id={`assessment-type-${assessment.id}`}
            name="assessmentType"
            defaultValue={assessment.assessmentType}
          >
            <option value="assignment">Assignment</option>
            <option value="quiz">Quiz</option>
            <option value="skills_test">Skills test</option>
            <option value="exam">Exam</option>
            <option value="lab">Lab</option>
            <option value="project">Project</option>
            <option value="presentation">Presentation</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div className="saas-field">
          <label htmlFor={`assessment-status-${assessment.id}`}>
            {t("状态", "Status")}
          </label>
          <select
            id={`assessment-status-${assessment.id}`}
            name="status"
            defaultValue={assessment.status}
          >
            <option value="not_started">Not started</option>
            <option value="in_progress">In progress</option>
            <option value="submitted">Submitted</option>
            <option value="completed">Completed</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
        <div className="saas-field">
          <label htmlFor={`assessment-due-${assessment.id}`}>
            {t("截止时间", "Due date and time")}
          </label>
          <input
            id={`assessment-due-${assessment.id}`}
            name="dueLocal"
            type="datetime-local"
            defaultValue={assessment.dueLocal}
          />
        </div>
        <div className="saas-field">
          <label htmlFor={`assessment-weight-${assessment.id}`}>
            {t("权重 %", "Weight %")}
          </label>
          <input
            id={`assessment-weight-${assessment.id}`}
            name="weightPercent"
            type="number"
            min="0"
            max="100"
            defaultValue={assessment.weightPercent ?? ""}
          />
        </div>
        <div className="saas-field">
          <label htmlFor={`assessment-minutes-${assessment.id}`}>
            {t("预计分钟", "Estimated minutes")}
          </label>
          <input
            id={`assessment-minutes-${assessment.id}`}
            name="estimatedMinutes"
            type="number"
            min="5"
            defaultValue={assessment.estimatedMinutes ?? ""}
          />
        </div>
        <div className="saas-field saas-field-wide">
          <label htmlFor={`assessment-notes-${assessment.id}`}>
            {t("备注", "Notes")}
          </label>
          <textarea
            id={`assessment-notes-${assessment.id}`}
            name="notes"
            rows={3}
            defaultValue={assessment.notes ?? ""}
          />
        </div>
      </div>
      {error ? (
        <p className="saas-error" role="alert">
          {error}
        </p>
      ) : null}
      <div className="saas-task-actions">
        <button className="saas-button saas-button-primary" type="submit">
          {t("保存", "Save")}
        </button>
        <button
          className="saas-button saas-button-secondary"
          type="button"
          onClick={() => setEditing(false)}
        >
          {t("取消", "Cancel")}
        </button>
      </div>
    </form>
  );
}
