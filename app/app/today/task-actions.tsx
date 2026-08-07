"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function TaskActions({
  taskId,
  status,
  allowStart = true,
  language,
}: {
  taskId: string;
  status: string;
  allowStart?: boolean;
  language: "zh-CN" | "en";
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const t = (zh: string, en: string) =>
    language === "zh-CN" ? zh : en;

  async function update(nextStatus: "active" | "completed" | "skipped") {
    setSaving(true);
    setError("");
    const response = await fetch(`/api/study-tasks/${taskId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    if (!response.ok) {
      const result = (await response.json()) as {
        error?: { message?: string };
      };
      setError(
        result.error?.message ??
          t("暂时无法更新任务。", "The task could not be updated."),
      );
      setSaving(false);
      return;
    }
    router.refresh();
    setSaving(false);
  }

  return (
    <>
      <div className="saas-task-actions">
        {status === "queued" && allowStart ? (
          <button
            type="button"
            className="saas-button saas-button-primary"
            onClick={() => update("active")}
            disabled={saving}
          >
            {t("开始当前任务", "Start current task")}
          </button>
        ) : null}
        {status === "active" ? (
          <button
            type="button"
            className="saas-button saas-button-secondary"
            onClick={() => update("completed")}
            disabled={saving}
          >
            {t("不计时，直接标记完成", "Mark complete without timer")}
          </button>
        ) : null}
        {status !== "completed" ? (
          <button
            type="button"
            className="saas-button saas-button-secondary"
            onClick={() => update("skipped")}
            disabled={saving}
          >
            {t("跳过", "Skip")}
          </button>
        ) : null}
      </div>
      {error ? (
        <p className="saas-error" role="alert">
          {error}
        </p>
      ) : null}
    </>
  );
}
