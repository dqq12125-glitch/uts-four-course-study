import Link from "next/link";
import { getPublicLocale } from "@/src/application/public-locale";

export default async function ResetPasswordPage() {
  const language = await getPublicLocale();
  const isChinese = language === "zh-CN";
  return (
    <section className="saas-card saas-auth-card">
      <p className="saas-eyebrow">
        {isChinese ? "无密码账户" : "Passwordless account"}
      </p>
      <h1>{isChinese ? "无需重置密码" : "There is no password to reset"}</h1>
      <p className="saas-lead">
        {isChinese
          ? "DeepStudy 不保存账户密码。请申请一个新的邮箱登录链接。"
          : "DeepStudy does not store an account password. Request a new email sign-in link instead."}
      </p>
      <Link className="saas-button saas-button-primary" href="/auth/sign-in">
        {isChinese ? "返回登录" : "Return to sign in"}
      </Link>
    </section>
  );
}
