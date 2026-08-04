import Link from "next/link";
import { getPublicLocale } from "@/src/application/public-locale";

export const dynamic = "force-dynamic";

export default async function MobileCallbackFallback({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const [params, language] = await Promise.all([
    searchParams,
    getPublicLocale(),
  ]);
  const isChinese = language === "zh-CN";
  const token = params.token?.slice(0, 512) ?? "";
  const appUrl = new URL("deepstudy://auth/callback");
  if (token) appUrl.searchParams.set("token", token);
  const browserUrl = `/api/auth/verify?token=${encodeURIComponent(token)}`;

  return (
    <section className="saas-card saas-auth-card">
      <p className="saas-eyebrow">
        {isChinese ? "安全移动端登录" : "Secure mobile sign-in"}
      </p>
      <h1>
        {isChinese ? "在 DeepStudy 应用中继续" : "Continue in the DeepStudy app"}
      </h1>
      <p className="saas-lead">
        {isChinese
          ? "如果应用已经安装，系统通常会自动打开。这个一次性链接会在验证后失效。"
          : "If the app is installed, it should open automatically. This one-time link expires after verification."}
      </p>
      {token ? (
        <>
          <a className="saas-button saas-button-primary" href={appUrl.toString()}>
            {isChinese ? "打开 DeepStudy 应用" : "Open the DeepStudy app"}
          </a>
          <Link
            className="saas-button saas-button-secondary"
            href={browserUrl}
          >
            {isChinese ? "改为在浏览器登录" : "Sign in with the browser instead"}
          </Link>
        </>
      ) : (
        <p className="saas-error" role="alert">
          {isChinese
            ? "登录链接缺少一次性令牌，请重新申请。"
            : "The sign-in link is missing its one-time token. Request a new link."}
        </p>
      )}
    </section>
  );
}
