import Link from "next/link";

export default function ResetPasswordPage() {
  return (
    <section className="saas-card saas-auth-card">
      <p className="saas-eyebrow">Passwordless account</p>
      <h1>无需重置密码</h1>
      <p className="saas-lead">
        DeepStudy 不保存账户密码。请申请新的邮箱登录链接。
      </p>
      <Link className="saas-button saas-button-primary" href="/auth/sign-in">
        返回登录
      </Link>
    </section>
  );
}
