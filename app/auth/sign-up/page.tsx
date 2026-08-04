import Link from "next/link";
import { AuthForm } from "@/app/auth/auth-form";
import { getPublicLocale } from "@/src/application/public-locale";

export default async function SignUpPage() {
  const language = await getPublicLocale();
  const isChinese = language === "zh-CN";
  return (
    <section className="saas-card saas-auth-card">
      <p className="saas-eyebrow">
        {isChinese ? "创建账户" : "Create your account"}
      </p>
      <h1>
        {isChinese
          ? "建立你的学期学习系统"
          : "Build your semester learning system"}
      </h1>
      <p className="saas-lead">
        {isChinese
          ? "适用于任何学校与科目。先添加一门课程，再得到今天最值得做的下一步。"
          : "Use it with any institution or subject. Add one course, then get the most valuable next step for today."}
      </p>
      <AuthForm intent="sign-up" language={language} />
      <p className="saas-footnote">
        {isChinese ? "已有账户？" : "Already have an account?"}{" "}
        <Link href="/auth/sign-in">
          {isChinese ? "登录" : "Sign in"}
        </Link>
      </p>
    </section>
  );
}
