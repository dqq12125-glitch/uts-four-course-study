"use client";

import { type FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function ProfileSettingsForm({
  initial,
}: {
  initial: {
    email: string;
    displayName: string | null;
    preferredLanguage: "zh-CN" | "en";
    timezone: string;
  };
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const t = (zh: string, en: string) =>
    initial.preferredLanguage === "zh-CN" ? zh : en;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/settings/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        displayName: form.get("displayName") || null,
        preferredLanguage: form.get("preferredLanguage"),
        timezone: form.get("timezone"),
      }),
    });
    const body = (await response.json().catch(() => null)) as
      | { error?: { message?: string } }
      | null;
    setMessage(
      response.ok
        ? t("个人资料已保存。", "Profile saved.")
        : body?.error?.message ?? t("保存失败。", "Save failed."),
    );
    setSaving(false);
    if (response.ok) router.refresh();
  }

  return (
    <form className="saas-card saas-form" onSubmit={submit}>
      <div className="saas-field">
        <label htmlFor="profile-email">{t("邮箱", "Email")}</label>
        <input
          id="profile-email"
          value={initial.email}
          readOnly
          aria-describedby="profile-email-note"
        />
        <p id="profile-email-note" className="saas-help">
          {t(
            "Magic Link 会发送到这个已验证邮箱。",
            "Magic links are sent to this verified address.",
          )}
        </p>
      </div>
      <div className="saas-form-grid">
        <div className="saas-field">
          <label htmlFor="profile-name">
            {t("显示名称", "Display name")}
          </label>
          <input
            id="profile-name"
            name="displayName"
            defaultValue={initial.displayName ?? ""}
            maxLength={80}
          />
        </div>
        <div className="saas-field">
          <label htmlFor="profile-language">
            {t("界面语言", "Interface language")}
          </label>
          <select
            id="profile-language"
            name="preferredLanguage"
            defaultValue={initial.preferredLanguage}
          >
            <option value="zh-CN">中文</option>
            <option value="en">English</option>
          </select>
        </div>
        <div className="saas-field saas-field-wide">
          <label htmlFor="profile-timezone">
            {t("IANA 时区", "IANA timezone")}
          </label>
          <input
            id="profile-timezone"
            name="timezone"
            defaultValue={initial.timezone}
            list="timezone-options"
            required
            maxLength={100}
          />
          <datalist id="timezone-options">
            <option value="Australia/Sydney" />
            <option value="Australia/Melbourne" />
            <option value="Australia/Brisbane" />
            <option value="Australia/Perth" />
            <option value="Asia/Shanghai" />
            <option value="Asia/Hong_Kong" />
            <option value="Asia/Singapore" />
            <option value="UTC" />
          </datalist>
        </div>
      </div>
      <button
        className="saas-button saas-button-primary"
        type="submit"
        disabled={saving}
      >
        {saving
          ? t("保存中…", "Saving…")
          : t("保存个人资料", "Save profile")}
      </button>
      {message ? (
        <p role="status" className="saas-help">
          {message}
        </p>
      ) : null}
    </form>
  );
}
