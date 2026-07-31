"use client";

import { type FormEvent, useState } from "react";

export function StudySettingsForm({
  initial,
  language,
}: {
  initial: {
    dailyStudyMinutes: number;
    preferredStudyStartTime: string | null;
    weekStartsOn: number;
    reminderEnabled: boolean;
    academicIntegrityMode: boolean;
    aiExplanationLanguage: "zh-CN" | "en";
  };
  language: "zh-CN" | "en";
}) {
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const t = (zh: string, en: string) =>
    language === "zh-CN" ? zh : en;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/settings/study", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dailyStudyMinutes: Number(form.get("dailyStudyMinutes")),
        preferredStudyStartTime:
          String(form.get("preferredStudyStartTime") ?? "") || null,
        weekStartsOn: Number(form.get("weekStartsOn")),
        reminderEnabled: form.get("reminderEnabled") === "on",
        academicIntegrityMode:
          form.get("academicIntegrityMode") === "on",
        aiExplanationLanguage: form.get("aiExplanationLanguage"),
      }),
    });
    const body = (await response.json().catch(() => null)) as
      | { error?: { message?: string } }
      | null;
    setMessage(
      response.ok
        ? t("学习设置已保存。", "Study settings saved.")
        : body?.error?.message ?? t("保存失败。", "Save failed."),
    );
    setSaving(false);
  }

  return (
    <form className="saas-card saas-form" onSubmit={submit}>
      <div className="saas-form-grid">
        <div className="saas-field">
          <label htmlFor="daily-study-minutes">
            {t("每日学习容量（分钟）", "Daily study capacity (minutes)")}
          </label>
          <input
            id="daily-study-minutes"
            name="dailyStudyMinutes"
            type="number"
            min={15}
            max={720}
            step={5}
            defaultValue={initial.dailyStudyMinutes}
            required
          />
        </div>
        <div className="saas-field">
          <label htmlFor="study-start-time">
            {t("偏好开始时间（可选）", "Preferred start time (optional)")}
          </label>
          <input
            id="study-start-time"
            name="preferredStudyStartTime"
            type="time"
            defaultValue={initial.preferredStudyStartTime ?? ""}
          />
        </div>
        <div className="saas-field">
          <label htmlFor="week-starts-on">
            {t("每周开始日", "Week starts on")}
          </label>
          <select
            id="week-starts-on"
            name="weekStartsOn"
            defaultValue={initial.weekStartsOn}
          >
            <option value={1}>{t("周一", "Monday")}</option>
            <option value={0}>{t("周日", "Sunday")}</option>
          </select>
        </div>
        <div className="saas-field">
          <label htmlFor="ai-explanation-language">
            {t("AI 解释语言", "AI explanation language")}
          </label>
          <select
            id="ai-explanation-language"
            name="aiExplanationLanguage"
            defaultValue={initial.aiExplanationLanguage}
          >
            <option value="zh-CN">中文</option>
            <option value="en">English</option>
          </select>
        </div>
      </div>
      <label className="saas-check-row">
        <input
          name="reminderEnabled"
          type="checkbox"
          defaultChecked={initial.reminderEnabled}
        />
        <span>
          {t(
            "启用我选择的学习提醒",
            "Enable my selected study reminders",
          )}
        </span>
      </label>
      <label className="saas-check-row">
        <input
          name="academicIntegrityMode"
          type="checkbox"
          defaultChecked={initial.academicIntegrityMode}
        />
        <span>
          {t(
            "始终显示学术诚信提醒（核心安全限制无论此设置如何都会执行）",
            "Always show academic-integrity reminders (core safeguards apply regardless of this setting)",
          )}
        </span>
      </label>
      <button
        className="saas-button saas-button-primary"
        type="submit"
        disabled={saving}
      >
        {saving
          ? t("保存中…", "Saving…")
          : t("保存学习设置", "Save study settings")}
      </button>
      {message ? (
        <p role="status" className="saas-help">
          {message}
        </p>
      ) : null}
    </form>
  );
}
