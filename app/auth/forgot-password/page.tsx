import { AuthForm } from "@/app/auth/auth-form";
import { getPublicLocale } from "@/src/application/public-locale";

export default async function ForgotPasswordPage() {
  const language = await getPublicLocale();
  const isChinese = language === "zh-CN";
  return (
    <section className="saas-card saas-auth-card">
      <p className="saas-eyebrow">
        {isChinese ? "无密码账户" : "Passwordless account"}
      </p>
      <h1>{isChinese ? "重新获取登录链接" : "Request a new sign-in link"}</h1>
      <p className="saas-lead">
        {isChinese
          ? "DeepStudy 使用一次性邮箱链接，没有需要重置的密码。输入注册邮箱即可重新登录。"
          : "DeepStudy uses one-time email links, so there is no password to reset. Enter your account email to sign in again."}
      </p>
      <AuthForm intent="sign-in" language={language} />
    </section>
  );
}
