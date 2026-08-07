"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function ProductError({
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
        event: "product_error_boundary",
        digest: error.digest ?? null,
        errorName: error.name,
      }),
    );
  }, [error]);

  return (
    <div className="saas-page">
      <section className="saas-card">
        <p className="saas-eyebrow">DeepStudy</p>
        <h1>这部分暂时没有同步成功</h1>
        <p>请重试。内部堆栈、数据库内容和密钥不会显示在这里。</p>
        {error.digest ? <code>{error.digest}</code> : null}
        <div className="saas-inline-actions">
          <button
            className="saas-button saas-button-primary"
            type="button"
            onClick={reset}
          >
            重试
          </button>
          <Link className="saas-button saas-button-secondary" href="/app/today">
            返回今日
          </Link>
        </div>
      </section>
    </div>
  );
}
