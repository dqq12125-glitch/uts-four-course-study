import Link from "next/link";
import { AuthForm } from "@/app/auth/auth-form";
import { getPublicLocale } from "@/src/application/public-locale";

export default async function SignInPage() {
  const language = await getPublicLocale();
  const isChinese = language === "zh-CN";
  return (
    <section className="saas-card saas-auth-card">
      <p className="saas-eyebrow">
        {isChinese ? "欢迎回来" : "Welcome back"}
      </p>
      <h1>{isChinese ? "继续今天的学习" : "Continue today’s learning"}</h1>
      <p className="saas-lead">
        {isChinese
          ? "使用邮箱中的一次性安全链接登录，无需记住密码。"
          : "Sign in with a one-time secure email link. There is no password to remember."}
      </p>
      <AuthForm intent="sign-in" language={language} />
      <p className="saas-footnote">
        {isChinese ? "还没有账户？" : "New to DeepStudy?"}{" "}
        <Link href="/auth/sign-up">
          {isChinese ? "免费开始" : "Start free"}
        </Link>
      </p>
      <p className="saas-footnote">
        {isChinese ? "没有收到登录链接？" : "Didn’t receive the link?"}{" "}
        <Link href="/auth/forgot-password">
          {isChinese ? "重新发送" : "Send it again"}
        </Link>
      </p>
    </section>
  );
}
