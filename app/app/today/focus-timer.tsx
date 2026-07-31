"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface FocusSession {
  id: string;
  studyTaskId: string | null;
  plannedMinutes: number;
  startedAt: string;
  completionStatus: "active" | "completed" | "partial" | "abandoned";
}

function secondsRemaining(session: FocusSession | null): number {
  if (!session) return 0;
  const target =
    Date.parse(session.startedAt) + session.plannedMinutes * 60_000;
  return Math.max(0, Math.ceil((target - Date.now()) / 1_000));
}

function formatClock(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function FocusTimer({
  taskId,
  suggestedMinutes,
  initialSession,
  language,
}: {
  taskId: string;
  suggestedMinutes: number;
  initialSession: FocusSession | null;
  language: "zh-CN" | "en";
}) {
  const router = useRouter();
  const [plannedMinutes, setPlannedMinutes] = useState(
    [15, 25, 45].includes(suggestedMinutes) ? suggestedMinutes : 25,
  );
  const [session, setSession] = useState<FocusSession | null>(initialSession);
  const [remaining, setRemaining] = useState(() =>
    secondsRemaining(initialSession),
  );
  const [showReflection, setShowReflection] = useState(false);
  const [completionStatus, setCompletionStatus] = useState<
    "completed" | "partial" | "abandoned"
  >("completed");
  const [difficulty, setDifficulty] = useState(3);
  const [confidenceAfter, setConfidenceAfter] = useState(3);
  const [needsMorePractice, setNeedsMorePractice] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const t = (zh: string, en: string) =>
    language === "zh-CN" ? zh : en;

  useEffect(() => {
    if (!session) return;
    const timer = window.setInterval(() => {
      setRemaining(secondsRemaining(session));
    }, 1_000);
    return () => window.clearInterval(timer);
  }, [session]);

  async function start() {
    setSaving(true);
    setError("");
    const response = await fetch("/api/focus-sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId, plannedMinutes }),
    });
    const result = (await response.json()) as {
      session?: FocusSession;
      error?: { message?: string };
    };
    if (!response.ok || !result.session) {
      setError(
        result.error?.message ??
          t("暂时无法开始专注。", "Focus could not be started."),
      );
      setSaving(false);
      return;
    }
    setSession(result.session);
    setRemaining(secondsRemaining(result.session));
    setSaving(false);
    router.refresh();
  }

  async function finish() {
    if (!session) return;
    setSaving(true);
    setError("");
    const response = await fetch(`/api/focus-sessions/${session.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        completionStatus,
        difficulty,
        needsMorePractice,
        confidenceAfter,
      }),
    });
    const result = (await response.json()) as {
      error?: { message?: string };
    };
    if (!response.ok) {
      setError(
        result.error?.message ??
          t("暂时无法保存专注记录。", "The focus record could not be saved."),
      );
      setSaving(false);
      return;
    }
    setSession(null);
    setShowReflection(false);
    setSaving(false);
    router.refresh();
  }

  return (
    <section
      className="saas-focus-block"
      aria-label={t("专注计时器", "Focus timer")}
    >
      <div className="saas-focus-heading">
        <div>
          <span>FOCUS BLOCK</span>
          <strong>
            {session
              ? t("保持当前这一步", "Stay with this step")
              : t("选择一个专注时长", "Choose a focus duration")}
          </strong>
        </div>
        <output aria-live="polite">
          {session ? formatClock(remaining) : `${plannedMinutes}:00`}
        </output>
      </div>

      {!session ? (
        <>
          <div
            className="saas-duration-options"
            aria-label={t("专注时长", "Focus duration")}
          >
            {[15, 25, 45].map((minutes) => (
              <button
                type="button"
                className={plannedMinutes === minutes ? "is-selected" : ""}
                key={minutes}
                onClick={() => setPlannedMinutes(minutes)}
              >
                {t(`${minutes} 分钟`, `${minutes} min`)}
              </button>
            ))}
            <label>
              <span>{t("自定义", "Custom")}</span>
              <input
                aria-label={t(
                  "自定义专注分钟数",
                  "Custom focus duration in minutes",
                )}
                type="number"
                min="5"
                max="180"
                value={plannedMinutes}
                onChange={(event) =>
                  setPlannedMinutes(
                    Math.max(5, Math.min(180, Number(event.target.value))),
                  )
                }
              />
            </label>
          </div>
          <button
            type="button"
            className="saas-button saas-button-focus"
            disabled={saving}
            onClick={start}
          >
            {saving
              ? t("正在开始…", "Starting…")
              : t("开始专注", "Start focus")}
          </button>
        </>
      ) : (
        <>
          <div
            className="saas-focus-progress"
            role="progressbar"
            aria-label={t(
              "本次专注剩余时间",
              "Focus time remaining",
            )}
            aria-valuemin={0}
            aria-valuemax={session.plannedMinutes * 60}
            aria-valuenow={remaining}
          >
            <span
              style={{
                width: `${Math.max(
                  0,
                  Math.min(
                    100,
                    (remaining / (session.plannedMinutes * 60)) * 100,
                  ),
                )}%`,
              }}
            />
          </div>
          <button
            type="button"
            className="saas-button saas-button-focus"
            onClick={() => setShowReflection(true)}
          >
            {remaining === 0
              ? t("记录本次结果", "Record result")
              : t("结束并记录", "Finish and record")}
          </button>
        </>
      )}

      {session && showReflection ? (
        <div className="saas-focus-reflection">
          <div className="saas-field">
            <label htmlFor="focus-status">
              {t("是否达到完成标准？", "Did you meet the completion criteria?")}
            </label>
            <select
              id="focus-status"
              value={completionStatus}
              onChange={(event) =>
                setCompletionStatus(
                  event.target.value as
                    | "completed"
                    | "partial"
                    | "abandoned",
                )
              }
            >
              <option value="completed">{t("已完成", "Completed")}</option>
              <option value="partial">
                {t("完成了一部分", "Partly completed")}
              </option>
              <option value="abandoned">
                {t("未能继续", "Could not continue")}
              </option>
            </select>
          </div>
          <div className="saas-form-grid">
            <div className="saas-field">
              <label htmlFor="focus-difficulty">
                {t("实际难度", "Actual difficulty")}
              </label>
              <select
                id="focus-difficulty"
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
            <div className="saas-field">
              <label htmlFor="focus-confidence">
                {t("当前信心", "Current confidence")}
              </label>
              <select
                id="focus-confidence"
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
          </div>
          <label className="saas-check">
            <input
              type="checkbox"
              checked={needsMorePractice}
              onChange={(event) =>
                setNeedsMorePractice(event.target.checked)
              }
            />
            {t(
              "这个知识点还需要更多练习",
              "This topic needs more practice",
            )}
          </label>
          <button
            type="button"
            className="saas-button saas-button-primary"
            disabled={saving}
            onClick={finish}
          >
            {saving
              ? t("正在保存…", "Saving…")
              : t("保存本次专注", "Save focus record")}
          </button>
        </div>
      ) : null}

      {error ? (
        <p className="saas-error" role="alert">
          {error}
        </p>
      ) : null}
    </section>
  );
}
