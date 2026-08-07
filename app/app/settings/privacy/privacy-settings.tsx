"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";

const TYPES = [
  ["tomorrowClasses", "明日课程", "Tomorrow's classes"],
  ["deadlineApproaching", "截止日期临近", "Approaching deadlines"],
  ["dailyPlan", "今日计划", "Today's plan"],
  ["reviewDue", "复测到期", "Retest due"],
  ["weeklyReport", "周学习报告", "Weekly study report"],
  [
    "marketing",
    "产品和营销邮件（默认关闭）",
    "Product and marketing email (off by default)",
  ],
] as const;

export function PrivacySettings({
  initial,
  language,
}: {
  initial: Record<(typeof TYPES)[number][0], boolean>;
  language: "zh-CN" | "en";
}) {
  const [message, setMessage] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const t = (zh: string, en: string) =>
    language === "zh-CN" ? zh : en;

  async function saveNotifications(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/settings/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        Object.fromEntries(
          TYPES.map(([key]) => [key, form.get(key) === "on"]),
        ),
      ),
    });
    const body = (await response.json().catch(() => null)) as
      | { error?: { message?: string } }
      | null;
    setMessage(
      response.ok
        ? t("通知偏好已保存。", "Reminder preferences saved.")
        : body?.error?.message ?? t("保存失败。", "Save failed."),
    );
    setBusy(false);
  }

  async function deleteAccount() {
    if (confirmation !== "DELETE") return;
    if (
      !window.confirm(
        t(
          "这会永久删除账户、课程、练习、AI 对话和私人文件。继续吗？",
          "This permanently deletes the account, courses, practice, AI conversations, and private files. Continue?",
        ),
      )
    ) {
      return;
    }
    setBusy(true);
    const response = await fetch("/api/account", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirmation }),
    });
    const body = (await response.json().catch(() => null)) as
      | { error?: { message?: string } }
      | null;
    if (response.ok) {
      window.location.assign("/");
      return;
    }
    setMessage(
      body?.error?.message ??
        t("账户删除失败。", "Account deletion failed."),
    );
    setBusy(false);
  }

  return (
    <div className="saas-settings-stack">
      <form className="saas-card saas-form" onSubmit={saveNotifications}>
        <div>
          <p className="saas-eyebrow">{t("通知选择", "Notification choices")}</p>
          <h2>{t("通知类型", "Reminder types")}</h2>
          <p className="saas-muted">
            {t(
              "不会默认发送营销邮件。你可以单独关闭每类提醒。",
              "Marketing email is off by default. Each reminder type can be disabled independently.",
            )}
          </p>
        </div>
        {TYPES.map(([key, zh, en]) => (
          <label className="saas-check-row" key={key}>
            <input
              name={key}
              type="checkbox"
              defaultChecked={initial[key]}
            />
            <span>{t(zh, en)}</span>
          </label>
        ))}
        <button
          className="saas-button saas-button-primary"
          type="submit"
          disabled={busy}
        >
          {t("保存通知偏好", "Save reminder preferences")}
        </button>
      </form>

      <section className="saas-card saas-form">
        <div>
          <p className="saas-eyebrow">{t("你的数据", "Your data")}</p>
          <h2>{t("导出与文件管理", "Export and file management")}</h2>
          <p className="saas-muted">
            {t(
              "JSON 导出包含课程、任务、练习、掌握度和 AI 对话；认证 Token 和存储密钥会被排除。",
              "The JSON export includes courses, tasks, practice, mastery, and AI conversations. Authentication tokens and storage keys are excluded.",
            )}
          </p>
        </div>
        <div className="saas-inline-actions">
          <a
            className="saas-button saas-button-secondary"
            href="/api/account/export"
          >
            {t("下载个人数据", "Download personal data")}
          </a>
          <Link
            className="saas-button saas-button-secondary"
            href="/app/resources"
          >
            {t("删除上传资料", "Delete uploaded resources")}
          </Link>
        </div>
      </section>

      <section className="saas-card saas-danger-zone">
        <div>
          <p className="saas-eyebrow">{t("危险操作", "Danger zone")}</p>
          <h2>{t("永久删除账户", "Permanently delete account")}</h2>
          <p>
            {t(
              "删除会撤销会话，并永久移除数据库中的个人数据和私人文件。此操作不可撤销。",
              "Deletion revokes sessions and permanently removes personal database records and private files. It cannot be undone.",
            )}
          </p>
        </div>
        <div className="saas-field">
          <label htmlFor="delete-confirmation">
            {t("输入 DELETE 以确认", "Type DELETE to confirm")}
          </label>
          <input
            id="delete-confirmation"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            autoComplete="off"
          />
        </div>
        <button
          className="saas-button saas-button-danger"
          type="button"
          disabled={busy || confirmation !== "DELETE"}
          onClick={deleteAccount}
        >
          {t("永久删除账户", "Permanently delete account")}
        </button>
      </section>
      {message ? (
        <p className="saas-status-message" role="status">
          {message}
        </p>
      ) : null}
    </div>
  );
}
