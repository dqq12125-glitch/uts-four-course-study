import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentUserFromCookies } from "@/src/application/session";
import { getAccountRepository } from "@/src/application/runtime";
import { PrivacySettings } from "./privacy-settings";
import { copy } from "@/src/lib/i18n";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "隐私与通知" };

export default async function PrivacySettingsPage() {
  const user = await currentUserFromCookies();
  if (!user) redirect("/auth/sign-in");
  const t = (zh: string, en: string) =>
    copy(user.preferredLanguage, zh, en);
  const preferences =
    await getAccountRepository().notificationPreferences(
      user.id,
      new Date().toISOString(),
    );
  return (
    <div className="saas-page">
      <section className="saas-page-heading">
        <p className="saas-eyebrow">Privacy & data</p>
        <h1>{t("隐私与通知", "Privacy and reminders")}</h1>
        <p className="saas-lead">
          {t(
            "私人课程资料不会自动分享给其他用户，也不会用于训练公共模型。",
            "Private course resources are never automatically shared with other users or used to train public models.",
          )}
        </p>
      </section>
      <PrivacySettings
        language={user.preferredLanguage}
        initial={{
          tomorrowClasses: Boolean(preferences.tomorrowClasses),
          deadlineApproaching: Boolean(preferences.deadlineApproaching),
          dailyPlan: Boolean(preferences.dailyPlan),
          reviewDue: Boolean(preferences.reviewDue),
          weeklyReport: Boolean(preferences.weeklyReport),
          marketing: Boolean(preferences.marketing),
        }}
      />
    </div>
  );
}
