import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function MobileCallbackFallback({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const token = (await searchParams).token?.slice(0, 512) ?? "";
  const appUrl = new URL("deepstudy://auth/callback");
  if (token) appUrl.searchParams.set("token", token);
  const browserUrl = `/api/auth/verify?token=${encodeURIComponent(token)}`;

  return (
    <section className="saas-card saas-auth-card">
      <p className="saas-eyebrow">Secure mobile sign-in</p>
      <h1>在 DeepStudy App 中继续</h1>
      <p className="saas-lead">
        如果 App 已安装，系统通常会自动打开。这个一次性链接将在验证后失效。
      </p>
      {token ? (
        <>
          <a className="saas-button saas-button-primary" href={appUrl.toString()}>
            打开 DeepStudy App
          </a>
          <Link
            className="saas-button saas-button-secondary"
            href={browserUrl}
          >
            改为在浏览器登录
          </Link>
        </>
      ) : (
        <p className="saas-error" role="alert">
          登录链接缺少一次性 Token，请重新申请。
        </p>
      )}
    </section>
  );
}
