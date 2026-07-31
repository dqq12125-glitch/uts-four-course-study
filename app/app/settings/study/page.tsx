import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { currentUserFromCookies } from "@/src/application/session";
import { getAccountService } from "@/src/application/runtime";
import { StudySettingsForm } from "./study-form";
import { copy } from "@/src/lib/i18n";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "学习设置" };

export default async function StudySettingsPage() {
  const user = await currentUserFromCookies();
  if (!user) redirect("/auth/sign-in");
  const t = (zh: string, en: string) =>
    copy(user.preferredLanguage, zh, en);
  const settings = await getAccountService().settings(user.id);
  return (
    <div className="saas-page">
      <section className="saas-page-heading">
        <p className="saas-eyebrow">Study preferences</p>
        <h1>{t("学习设置", "Study settings")}</h1>
        <p className="saas-lead">
          {t(
            "每日容量用于规则引擎排程；Critical 任务超出容量时仍会明确提醒。",
            "Daily capacity guides rule-based scheduling; critical overloads are still shown explicitly.",
          )}
        </p>
      </section>
      <StudySettingsForm
        language={user.preferredLanguage}
        initial={{
          dailyStudyMinutes: settings.dailyStudyMinutes,
          preferredStudyStartTime: settings.preferredStudyStartTime,
          weekStartsOn: settings.weekStartsOn,
          reminderEnabled: Boolean(settings.reminderEnabled),
          academicIntegrityMode: Boolean(settings.academicIntegrityMode),
          aiExplanationLanguage: settings.aiExplanationLanguage,
        }}
      />
    </div>
  );
}
