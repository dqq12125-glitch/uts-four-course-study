import { AuthForm } from "@/app/auth/auth-form";

export default function ForgotPasswordPage() {
  return (
    <section className="saas-card saas-auth-card">
      <p className="saas-eyebrow">Passwordless account</p>
      <h1>重新获取登录链接</h1>
      <p className="saas-lead">
        DeepStudy 使用邮箱 Magic Link，没有可重置的密码。输入注册邮箱即可重新登录。
      </p>
      <AuthForm intent="sign-in" />
    </section>
  );
}
