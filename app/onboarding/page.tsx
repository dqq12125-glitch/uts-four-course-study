import { redirect } from "next/navigation";
import { currentUserFromCookies } from "@/src/application/session";
import { getLearningRepository } from "@/src/application/runtime";
import { OnboardingWizard } from "@/app/onboarding/wizard";
import { AnalyticsEvent } from "@/app/analytics-event";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const user = await currentUserFromCookies();
  if (!user) redirect("/auth/sign-in");
  if (user.onboardingCompletedAt) redirect("/app/today");

  const templates = await getLearningRepository().listCourseTemplates();
  return (
    <main className="saas-shell saas-onboarding-shell">
      <AnalyticsEvent eventName="onboarding_started" />
      <header className="saas-onboarding-header">
        <span className="saas-wordmark">DeepStudy</span>
        <span className="saas-muted">约 5 分钟</span>
      </header>
      <OnboardingWizard
        initialLanguage={user.preferredLanguage}
        initialTimezone={user.timezone}
        templates={templates}
      />
    </main>
  );
}
