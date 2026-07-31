import { Redirect } from "expo-router";
import { useSession } from "@/src/auth/session-context";
import { useCopy } from "@/src/i18n";
import { Screen, LoadingState, InlineNotice } from "@/src/ui/components";

export default function IndexScreen() {
  const { status, user, error } = useSession();
  const { t } = useCopy();
  if (status === "loading") {
    return (
      <Screen scroll={false}>
        <LoadingState
          label={t("正在恢复安全会话…", "Restoring your secure session…")}
        />
      </Screen>
    );
  }
  if (status === "error") {
    return (
      <Screen scroll={false}>
        <InlineNotice
          tone="danger"
          title={t(
            "暂时无法连接 DeepStudy",
            "Could not connect to DeepStudy",
          )}
          body={
            error ??
            t(
              "请检查网络后重新打开应用。",
              "Check your connection and reopen the app.",
            )
          }
        />
      </Screen>
    );
  }
  if (!user) return <Redirect href="/sign-in" />;
  if (!user.onboardingCompleted) return <Redirect href="/onboarding" />;
  return <Redirect href="/(tabs)/today" />;
}
