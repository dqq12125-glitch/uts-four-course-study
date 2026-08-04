"use client";

import { useState, type ReactNode } from "react";

export function CheckoutButton({
  productKey,
  children,
  language = "zh-CN",
}: {
  productKey: "founding_pass" | "semester_pass" | "exam_sprint";
  children: ReactNode;
  language?: "zh-CN" | "en";
}) {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const t = (zh: string, en: string) =>
    language === "zh-CN" ? zh : en;

  async function startCheckout() {
    setLoading(true);
    setError("");
    const response = await fetch("/api/billing/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productKey }),
    });
    const payload = (await response.json().catch(() => null)) as
      | { checkoutUrl?: string; error?: { message?: string } }
      | null;
    if (!response.ok || !payload?.checkoutUrl) {
      setError(
        t(
          "暂时无法启动安全支付，请稍后再试。",
          "Secure checkout could not be started. Please try again.",
        ),
      );
      setLoading(false);
      return;
    }
    window.location.assign(payload.checkoutUrl);
  }

  return (
    <div className="saas-checkout-action">
      <button
        className="saas-button saas-button-primary"
        type="button"
        disabled={loading}
        onClick={startCheckout}
      >
        {loading ? t("正在前往安全支付…", "Opening secure checkout…") : children}
      </button>
      {error ? (
        <p className="saas-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
