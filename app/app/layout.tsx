import Link from "next/link";
import { redirect } from "next/navigation";
import { isPersonalOwner } from "@/src/application/personal-access";
import { currentUserFromCookies } from "@/src/application/session";
import { SignOutButton } from "@/app/app/sign-out-button";
import { copy } from "@/src/lib/i18n";

export const dynamic = "force-dynamic";

export default async function ProductLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await currentUserFromCookies();
  if (!user) redirect("/auth/sign-in");
  if (!user.onboardingCompletedAt) redirect("/onboarding");
  const t = (zh: string, en: string) =>
    copy(user.preferredLanguage, zh, en);

  return (
    <div
      className="saas-app"
      lang={user.preferredLanguage === "zh-CN" ? "zh-CN" : "en"}
    >
      <header className="saas-app-header">
        <Link className="saas-wordmark" href="/app/today">
          DeepStudy
        </Link>
        <div className="saas-account">
          {isPersonalOwner(user.email) ? (
            <Link href="/personal">
              {t("个人四课", "Personal four-course app")}
            </Link>
          ) : null}
          <Link
            href="/app/notifications"
            aria-label={t("学习提醒", "Study reminders")}
          >
            {t("提醒", "Reminders")}
          </Link>
          <Link href="/app/tutor">{t("AI 导师", "AI tutor")}</Link>
          <Link href="/app/settings/profile">{t("账户", "Account")}</Link>
          <span title={user.email}>
            {user.displayName || user.email.split("@")[0]}
          </span>
          <SignOutButton language={user.preferredLanguage} />
        </div>
      </header>
      <main className="saas-app-main">{children}</main>
      <nav
        className="saas-bottom-nav"
        aria-label={t("主要导航", "Primary navigation")}
      >
        <Link href="/app/today">
          <span aria-hidden="true">今</span>
          {t("今日", "Today")}
        </Link>
        <Link href="/app/courses">
          <span aria-hidden="true">课</span>
          {t("课程", "Courses")}
        </Link>
        <Link href="/app/plan">
          <span aria-hidden="true">排</span>
          {t("计划", "Plan")}
        </Link>
        <Link href="/app/practice">
          <span aria-hidden="true">练</span>
          {t("练习", "Practice")}
        </Link>
        <Link href="/app/more">
          <span aria-hidden="true">···</span>
          {t("更多", "More")}
        </Link>
      </nav>
    </div>
  );
}
