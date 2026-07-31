"use client";

import { useEffect } from "react";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset(): void;
}) {
  useEffect(() => {
    console.error(
      JSON.stringify({
        level: "error",
        event: "root_error_boundary",
        digest: error.digest ?? null,
        errorName: error.name,
      }),
    );
  }, [error]);

  return (
    <main className="saas-error-page">
      <section className="saas-card">
        <p className="saas-eyebrow">Something went wrong</p>
        <h1>页面暂时无法加载</h1>
        <p>你的数据没有因此被删除。请重试；如果问题持续，可记录下面的错误编号。</p>
        {error.digest ? <code>{error.digest}</code> : null}
        <button
          className="saas-button saas-button-primary"
          type="button"
          onClick={reset}
        >
          重新加载
        </button>
      </section>
    </main>
  );
}
