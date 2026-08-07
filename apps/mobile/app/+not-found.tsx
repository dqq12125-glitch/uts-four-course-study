import { useRouter } from "expo-router";
import { useCopy } from "@/src/i18n";
import {
  ActionButton,
  EmptyState,
  Screen,
} from "@/src/ui/components";

export default function NotFoundScreen() {
  const router = useRouter();
  const { t } = useCopy();
  return (
    <Screen>
      <EmptyState
        title={t("找不到这个页面", "Page not found")}
        body={t(
          "链接可能已经失效，或当前版本尚未包含这个功能。",
          "The link may have expired, or this feature is not included in this build.",
        )}
      />
      <ActionButton
        label={t("返回今日计划", "Back to Today")}
        onPress={() => router.replace("/")}
      />
    </Screen>
  );
}
