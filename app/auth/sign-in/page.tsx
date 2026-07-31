import Link from "next/link";
import { AuthForm } from "@/app/auth/auth-form";

export default function SignInPage() {
  return (
    <section className="saas-card saas-auth-card">
      <p className="saas-eyebrow">Welcome back</p>
      <h1>继续今天的学习</h1>
      <p className="saas-lead">
        使用邮箱中的一次性链接登录，不需要记住密码。
      </p>
      <AuthForm intent="sign-in" />
      <p className="saas-footnote">
        还没有账户？ <Link href="/auth/sign-up">免费开始</Link>
      </p>
      <p className="saas-footnote">
        登录链接未收到？ <Link href="/auth/forgot-password">重新发送</Link>
      </p>
    </section>
  );
}
