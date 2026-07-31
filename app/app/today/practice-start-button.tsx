"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function PracticeStartButton({
  courseId,
  taskId,
  language,
}: {
  courseId: string;
  taskId: string;
  language: "zh-CN" | "en";
}) {
  const router = useRouter();
  const [confidence, setConfidence] = useState(3);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const t = (zh: string, en: string) =>
    language === "zh-CN" ? zh : en;

  async function start() {
    setSaving(true);
    setError("");
    const response = await fetch("/api/practice/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        courseId,
        studyTaskId: taskId,
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
          t("暂时无法开始复测。", "The retest could not be started."),
      );
      setSaving(false);
      return;
    }
    router.push(`/app/practice/${sessionId}`);
  }

  return (
    <div className="saas-retest-start">
      <label>
        <span>{t("开始前信心", "Confidence before starting")}</span>
        <select
          value={confidence}
          onChange={(event) => setConfidence(Number(event.target.value))}
        >
          {[1, 2, 3, 4, 5].map((value) => (
            <option value={value} key={value}>
              {value} / 5
            </option>
          ))}
        </select>
      </label>
      <button
        type="button"
        className="saas-button saas-button-focus"
        disabled={saving}
        onClick={start}
      >
        {saving
          ? t("正在准备…", "Preparing…")
          : t("开始到期复测", "Start due retest")}
      </button>
      {error ? (
        <p className="saas-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
