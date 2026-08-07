import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentUserFromCookies } from "@/src/application/session";
import { getAccountService } from "@/src/application/runtime";
import { ProfileSettingsForm } from "./profile-form";
import { copy } from "@/src/lib/i18n";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "个人资料" };

export default async function ProfileSettingsPage() {
  const user = await currentUserFromCookies();
  if (!user) redirect("/auth/sign-in");
  const t = (zh: string, en: string) =>
    copy(user.preferredLanguage, zh, en);
  const settings = await getAccountService().settings(user.id);
  return (
    <div className="saas-page">
      <section className="saas-page-heading">
        <p className="saas-eyebrow">{t("账户", "Account")}</p>
        <h1>{t("个人资料", "Profile")}</h1>
        <p className="saas-lead">
          {t(
            "语言和时区会影响日期、每日额度和学习计划显示。",
            "Language and timezone affect dates, daily limits, and study-plan display.",
          )}
        </p>
      </section>
      <ProfileSettingsForm
        initial={{
          email: settings.email,
          displayName: settings.displayName,
          preferredLanguage: settings.preferredLanguage,
          timezone: settings.timezone,
        }}
      />
    </div>
  );
}
