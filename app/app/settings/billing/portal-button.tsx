"use client";

import { useState } from "react";

export function BillingPortalButton({
  language,
}: {
  language: "zh-CN" | "en";
}) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const t = (zh: string, en: string) =>
    language === "zh-CN" ? zh : en;

  async function openPortal() {
    setLoading(true);
    setError("");
    const response = await fetch("/api/billing/portal", { method: "POST" });
    const payload = (await response.json().catch(() => null)) as
      | { portalUrl?: string; error?: { message?: string } }
      | null;
    if (!response.ok || !payload?.portalUrl) {
      setError(
        payload?.error?.message ??
          t(
            "当前账户没有可管理的订阅。",
            "This account has no manageable subscription.",
          ),
      );
      setLoading(false);
      return;
    }
    window.location.assign(payload.portalUrl);
  }

  return (
    <div className="saas-checkout-action">
      <button
        className="saas-button saas-button-secondary"
        type="button"
        disabled={loading}
        onClick={openPortal}
      >
        {loading
          ? t("正在打开…", "Opening…")
          : t("管理未来订阅", "Manage future subscriptions")}
      </button>
      {error ? (
        <p className="saas-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
