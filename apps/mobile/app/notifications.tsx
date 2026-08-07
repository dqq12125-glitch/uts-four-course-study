import { useCallback, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { StyleSheet, Text } from "react-native";
import type { NotificationRecord } from "@/src/api/types";
import { useSession } from "@/src/auth/session-context";
import { useCopy } from "@/src/i18n";
import {
  ActionButton,
  EmptyState,
  InlineNotice,
  LoadingState,
  PageHeading,
  Screen,
  Surface,
} from "@/src/ui/components";
import { useAppTheme } from "@/src/ui/theme";

function nativeRoute(actionUrl: string | null):
  | "/(tabs)/today"
  | "/(tabs)/courses"
  | "/(tabs)/mastery"
  | "/weekly-report" {
  if (actionUrl?.includes("mastery")) return "/(tabs)/mastery";
  if (actionUrl?.includes("courses")) return "/(tabs)/courses";
  if (actionUrl?.includes("reports")) return "/weekly-report";
  return "/(tabs)/today";
}

export default function NotificationsScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const { api } = useSession();
  const { t, locale } = useCopy();
  const [items, setItems] = useState<NotificationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setItems((await api.notifications()).notifications);
      setError("");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : t("无法加载提醒。", "Could not load reminders."),
      );
    } finally {
      setLoading(false);
    }
  }, [api, t]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  async function open(item: NotificationRecord) {
    if (!item.readAt) {
      await api.markNotificationRead(item.id).catch(() => undefined);
    }
    router.push(nativeRoute(item.actionUrl));
  }

  if (loading) {
    return (
      <Screen scroll={false}>
        <LoadingState label={t("正在加载提醒…", "Loading reminders…")} />
      </Screen>
    );
  }

  return (
    <Screen>
      <PageHeading
        eyebrow="In-app reminders"
        title={t("学习提醒", "Study reminders")}
        lead={t(
          "提醒按你的时区生成，并使用去重键避免重复发送。",
          "Reminders use your time zone and a deduplication key to prevent duplicates.",
        )}
      />
      {error ? (
        <InlineNotice
          tone="danger"
          title={t("提醒未同步", "Reminders not synced")}
          body={error}
        />
      ) : null}
      {items.length ? (
        items.map((item) => (
          <Surface
            key={item.id}
            style={item.readAt ? styles.read : undefined}
          >
            <Text style={[styles.type, { color: theme.accent }]}>
              {item.notificationType.replaceAll("_", " ")}
            </Text>
            <Text style={[styles.title, { color: theme.ink }]}>
              {item.title}
            </Text>
            <Text style={[styles.body, { color: theme.muted }]}>
              {item.body}
            </Text>
            <Text style={[styles.time, { color: theme.muted }]}>
              {new Intl.DateTimeFormat(locale, {
                dateStyle: "medium",
                timeStyle: "short",
              }).format(new Date(item.scheduledFor))}
            </Text>
            <ActionButton
              variant="secondary"
              label={
                item.readAt
                  ? t("再次打开", "Open again")
                  : t("打开并标记已读", "Open and mark as read")
              }
              onPress={() => void open(item)}
            />
          </Surface>
        ))
      ) : (
        <EmptyState
          title={t("没有新提醒", "No new reminders")}
          body={t(
            "到期复测仍会直接出现在今日页。",
            "Due reviews still appear directly on Today.",
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  read: { opacity: 0.72 },
  type: { fontSize: 11, fontWeight: "900", textTransform: "uppercase" },
  title: { fontSize: 18, fontWeight: "800" },
  body: { fontSize: 14, lineHeight: 21 },
  time: { fontSize: 12 },
});
