import Link from "next/link";
import { AuthForm } from "@/app/auth/auth-form";

export default function SignUpPage() {
  return (
    <section className="saas-card saas-auth-card">
      <p className="saas-eyebrow">DeepStudy</p>
      <h1>建立你的学期执行系统</h1>
      <p className="saas-lead">
        任意学校、任意课程。先添加一门课，几分钟内得到今天的下一步。
      </p>
      <AuthForm intent="sign-up" />
      <p className="saas-footnote">
        已有账户？ <Link href="/auth/sign-in">登录</Link>
      </p>
    </section>
  );
}
