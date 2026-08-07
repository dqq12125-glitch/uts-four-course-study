"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function RebalanceButton({
  language,
}: {
  language: "zh-CN" | "en";
}) {
  const router = useRouter();
  const [criticalCount, setCriticalCount] = useState(0);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const t = (zh: string, en: string) =>
    language === "zh-CN" ? zh : en;

  async function rebalance(confirmCritical: boolean) {
    setSaving(true);
    setError("");
    setMessage("");
    const response = await fetch("/api/plan/rebalance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirmCritical }),
    });
    const result = (await response.json()) as {
      updated?: number;
      criticalWarnings?: unknown[];
      error?: { message?: string };
    };
    if (!response.ok) {
      setError(
        result.error?.message ??
          t("暂时无法重新排程。", "The plan could not be rebalanced."),
      );
      setSaving(false);
      return;
    }
    const warnings = result.criticalWarnings?.length ?? 0;
    setCriticalCount(warnings);
    setMessage(
      warnings
        ? t(
            `有 ${warnings} 项 Critical 任务需要你确认，尚未移动。`,
            `${warnings} critical task${
              warnings === 1 ? "" : "s"
            } still need your confirmation.`,
          )
        : t(
            `已重新安排 ${result.updated ?? 0} 项未完成任务。`,
            `${result.updated ?? 0} unfinished task${
              Number(result.updated ?? 0) === 1 ? "" : "s"
            } rescheduled.`,
          ),
    );
    setSaving(false);
    router.refresh();
  }

  return (
    <div className="saas-rebalance">
      <button
        type="button"
        className="saas-text-button"
        disabled={saving}
        onClick={() => rebalance(false)}
      >
        {saving
          ? t("正在计算…", "Calculating…")
          : t("重新安排逾期任务", "Reschedule overdue tasks")}
      </button>
      {criticalCount > 0 ? (
        <button
          type="button"
          className="saas-button saas-button-secondary"
          disabled={saving}
          onClick={() => rebalance(true)}
        >
          {t("确认移动 Critical 任务", "Confirm critical task moves")}
        </button>
      ) : null}
      {message ? <p className="saas-help">{message}</p> : null}
      {error ? (
        <p className="saas-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
