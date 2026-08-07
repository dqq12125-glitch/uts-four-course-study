"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset(): void;
}) {
  return (
    <html lang="zh-CN">
      <body>
        <main
          style={{
            maxWidth: 560,
            margin: "12vh auto",
            padding: 24,
            fontFamily: "system-ui, sans-serif",
          }}
        >
          <h1>DeepStudy 暂时无法启动</h1>
          <p>请检查网络后重试。系统不会在这个页面显示内部错误或密钥。</p>
          <button type="button" onClick={reset}>
            重试
          </button>
        </main>
      </body>
    </html>
  );
}
