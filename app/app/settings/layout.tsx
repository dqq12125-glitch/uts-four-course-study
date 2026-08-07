import Link from "next/link";
import { redirect } from "next/navigation";
import { currentUserFromCookies } from "@/src/application/session";
import { copy } from "@/src/lib/i18n";

export default async function SettingsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await currentUserFromCookies();
  if (!user) redirect("/auth/sign-in");
  const t = (zh: string, en: string) =>
    copy(user.preferredLanguage, zh, en);
  return (
    <>
      <nav
        className="saas-settings-nav"
        aria-label={t("账户设置", "Account settings")}
      >
        <Link href="/app/settings/profile">
          {t("个人资料", "Profile")}
        </Link>
        <Link href="/app/settings/study">
          {t("学习设置", "Study")}
        </Link>
        <Link href="/app/settings/privacy">
          {t("隐私与通知", "Privacy and reminders")}
        </Link>
        <Link href="/app/settings/billing">
          {t("套餐与购买", "Plans and purchases")}
        </Link>
      </nav>
      {children}
    </>
  );
}
