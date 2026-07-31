"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

interface TurnstileApi {
  render(
    container: HTMLElement,
    options: {
      sitekey: string;
      callback(token: string): void;
      "expired-callback"(): void;
      "error-callback"(): void;
      theme: "auto";
    },
  ): string;
  reset(widgetId: string): void;
  remove(widgetId: string): void;
}

function turnstileApi(): TurnstileApi | undefined {
  return (
    window as typeof window & { turnstile?: TurnstileApi }
  ).turnstile;
}

interface AuthFormProps {
  intent: "sign-up" | "sign-in";
  language?: "zh-CN" | "en";
}

export function AuthForm({
  intent,
  language = "zh-CN",
}: AuthFormProps) {
  const [state, setState] = useState<
    "idle" | "submitting" | "sent" | "error"
  >("idle");
  const [message, setMessage] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [turnstileEnabled, setTurnstileEnabled] = useState(false);
  const [turnstileReady, setTurnstileReady] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileContainer = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function configure() {
      let response: Response;
      try {
        response = await fetch("/api/security/turnstile", {
          cache: "force-cache",
        });
      } catch {
        if (!cancelled) setTurnstileReady(true);
        return;
      }
      if (!response.ok || cancelled) {
        setTurnstileReady(true);
        return;
      }
      const config = (await response.json()) as {
        enabled: boolean;
        siteKey: string | null;
      };
      if (!config.enabled || !config.siteKey) {
        setTurnstileReady(true);
        return;
      }
      setTurnstileEnabled(true);
      const render = () => {
        if (
          cancelled ||
          !turnstileContainer.current ||
          widgetId.current ||
          !turnstileApi()
        ) {
          return;
        }
        widgetId.current = turnstileApi()?.render(
          turnstileContainer.current,
          {
            sitekey: config.siteKey!,
            callback(token) {
              setTurnstileToken(token);
              setTurnstileReady(true);
            },
            "expired-callback"() {
              setTurnstileToken(null);
              setTurnstileReady(false);
            },
            "error-callback"() {
              setTurnstileToken(null);
              setTurnstileReady(false);
            },
            theme: "auto",
          },
        ) ?? null;
      };
      if (turnstileApi()) {
        render();
        return;
      }
      let script = document.getElementById(
        "deepstudy-turnstile",
      ) as HTMLScriptElement | null;
      if (!script) {
        script = document.createElement("script");
        script.id = "deepstudy-turnstile";
        script.src =
          "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
      }
      script.addEventListener("load", render, { once: true });
    }
    void configure();
    return () => {
      cancelled = true;
      if (widgetId.current && turnstileApi()) {
        turnstileApi()?.remove(widgetId.current);
        widgetId.current = null;
      }
    };
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState("submitting");
    setMessage("");
    setPreviewUrl(null);

    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/request-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: form.get("email"),
        intent,
        language,
        turnstileToken,
      }),
    });
    const result = (await response.json()) as {
      message?: string;
      developmentPreviewUrl?: string;
      error?: { message?: string };
    };
    if (!response.ok) {
      setState("error");
      setMessage(
        result.error?.message ??
          "Unable to send a sign-in link. Please try again.",
      );
      if (widgetId.current) turnstileApi()?.reset(widgetId.current);
      setTurnstileToken(null);
      setTurnstileReady(!turnstileEnabled);
      return;
    }

    setState("sent");
    setMessage(
      language === "zh-CN"
        ? "请检查邮箱。安全登录链接 15 分钟内有效。"
        : "Check your inbox. The secure link is valid for 15 minutes.",
    );
    setPreviewUrl(result.developmentPreviewUrl ?? null);
  }

  const isChinese = language === "zh-CN";
  return (
    <form className="saas-form" onSubmit={submit} noValidate>
      <div className="saas-field">
        <label htmlFor={`${intent}-email`}>
          {isChinese ? "邮箱" : "Email"}
        </label>
        <input
          id={`${intent}-email`}
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          maxLength={254}
          placeholder="you@example.com"
          aria-describedby={`${intent}-email-help`}
        />
        <p id={`${intent}-email-help`} className="saas-help">
          {isChinese
            ? "我们会发送一次性安全登录链接，无需密码。"
            : "We will send a one-time secure link. No password needed."}
        </p>
      </div>
      <div
        ref={turnstileContainer}
        className="saas-turnstile"
        aria-label={
          isChinese ? "安全验证" : "Security verification"
        }
      />
      <button
        className="saas-button saas-button-primary"
        type="submit"
        disabled={
          state === "submitting" ||
          !turnstileReady ||
          (turnstileEnabled && !turnstileToken)
        }
      >
        {state === "submitting"
          ? isChinese
            ? "正在发送…"
            : "Sending…"
          : isChinese
            ? intent === "sign-up"
              ? "免费开始"
              : "发送登录链接"
            : intent === "sign-up"
              ? "Start free"
              : "Send sign-in link"}
      </button>
      {message ? (
        <p
          className={state === "error" ? "saas-error" : "saas-success"}
          role={state === "error" ? "alert" : "status"}
        >
          {message}
        </p>
      ) : null}
      {previewUrl ? (
        <a className="saas-dev-link" href={previewUrl}>
          {isChinese ? "开发环境：打开登录链接" : "Development: open sign-in link"}
        </a>
      ) : null}
    </form>
  );
}
