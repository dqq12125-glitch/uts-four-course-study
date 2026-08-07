import Link from "next/link";
import { getPublicLocale } from "@/src/application/public-locale";

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const [params, language] = await Promise.all([
    searchParams,
    getPublicLocale(),
  ]);
  const isChinese = language === "zh-CN";
  const message = params.error
    ? params.error === "AUTH_LINK_INVALID"
      ? isChinese
        ? "这个登录链接无效、已使用或已经过期。"
        : "This sign-in link is invalid, has already been used or has expired."
      : isChinese
        ? "无法验证这个登录链接。"
        : "We could not verify this sign-in link."
    : isChinese
      ? "请从邮箱中打开 DeepStudy 登录链接。"
      : "Open the DeepStudy sign-in link from your email.";

  return (
    <section className="saas-card saas-auth-card">
      <p className="saas-eyebrow">
        {isChinese ? "邮箱验证" : "Email verification"}
      </p>
      <h1>{isChinese ? "验证邮箱" : "Verify your email"}</h1>
      <p className={params.error ? "saas-error" : "saas-lead"}>{message}</p>
      <Link className="saas-button saas-button-primary" href="/auth/sign-in">
        {isChinese ? "获取新链接" : "Request a new link"}
      </Link>
    </section>
  );
}
