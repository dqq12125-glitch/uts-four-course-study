import Link from "next/link";

const errorMessages: Record<string, string> = {
  AUTH_LINK_INVALID: "这个登录链接无效、已使用或已经过期。",
};

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const message = params.error
    ? (errorMessages[params.error] ?? "无法验证这个登录链接。")
    : "请从邮箱中打开 DeepStudy 登录链接。";

  return (
    <section className="saas-card saas-auth-card">
      <p className="saas-eyebrow">Email verification</p>
      <h1>验证邮箱</h1>
      <p className={params.error ? "saas-error" : "saas-lead"}>{message}</p>
      <Link className="saas-button saas-button-primary" href="/auth/sign-in">
        获取新链接
      </Link>
    </section>
  );
}
