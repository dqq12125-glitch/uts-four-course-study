import Link from "next/link";
import { PublicLanguageSwitch } from "@/app/public-language-switch";
import { getPublicLocale } from "@/src/application/public-locale";

export default async function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const language = await getPublicLocale();
  return (
    <div className="public-site public-auth-page">
      <header className="auth-header">
        <Link className="public-wordmark" href="/">
          DeepStudy<span aria-hidden="true">/</span>
        </Link>
        <PublicLanguageSwitch language={language} />
      </header>
      <main className="auth-main">
        <aside className="auth-context">
          <p className="public-section-label">
            {language === "zh-CN" ? "自适应学习系统" : "Adaptive learning system"}
          </p>
          <h2>
            {language === "zh-CN"
              ? "学习，从明确的下一步开始。"
              : "Learning starts with a clear next step."}
          </h2>
          <p>
            {language === "zh-CN"
              ? "把课程资料、截止日期和真实掌握程度放进同一个每日计划。"
              : "Bring course material, deadlines and genuine mastery into one daily plan."}
          </p>
        </aside>
        <div className="auth-panel">{children}</div>
      </main>
    </div>
  );
}
