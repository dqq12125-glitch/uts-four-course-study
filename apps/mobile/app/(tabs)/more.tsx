import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { useSession } from "@/src/auth/session-context";
import {
  ActionButton,
  PageHeading,
  Screen,
  Surface,
} from "@/src/ui/components";
import { useAppTheme } from "@/src/ui/theme";
import { useCopy } from "@/src/i18n";

const destinations = [
  ["/tutor", "AI 导师", "AI tutor", "Hint-first 辅导与学术诚信模式", "Hint-first support and academic-integrity mode"],
  ["/(tabs)/mastery", "掌握度与复测", "Mastery and retests", "薄弱点、间隔复测和近期进步", "Weak topics, spaced retests, and recent progress"],
  ["/resources", "私人资料", "Private resources", "上传、确认导入和删除课程资料", "Upload, confirm imports, and delete course resources"],
  ["/weekly-report", "周学习报告", "Weekly study report", "任务、专注、练习和复测证据", "Task, focus, practice, and retest evidence"],
  ["/notifications", "站内提醒", "In-app reminders", "今日计划、截止日期和复测提醒", "Plan, deadline, and retest reminders"],
  ["/billing", "套餐与购买记录", "Plans and purchases", "查看当前权限和 Web 端购买状态", "View current access and web purchase status"],
  ["/settings", "账户与隐私", "Account and privacy", "语言、时区、通知、导出和删除", "Language, timezone, reminders, export, and deletion"],
] as const;

export default function MoreScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const { user, signOut } = useSession();
  const { t } = useCopy();

  async function exit() {
    await signOut();
    router.replace("/sign-in");
  }

  return (
    <Screen>
      <PageHeading
        eyebrow={user?.email ?? "DeepStudy"}
        title={t("更多", "More")}
        lead={t(
          "学习工具、提醒、套餐和账户控制。",
          "Learning tools, reminders, plans, and account controls.",
        )}
      />
      <View style={styles.list}>
        {destinations.map(([href, titleZh, titleEn, bodyZh, bodyEn]) => (
          <Surface key={href}>
            <Text style={[styles.title, { color: theme.ink }]}>
              {t(titleZh, titleEn)}
            </Text>
            <Text style={[styles.body, { color: theme.muted }]}>
              {t(bodyZh, bodyEn)}
            </Text>
            <ActionButton
              variant="secondary"
              label={t("打开", "Open")}
              onPress={() => router.push(href)}
            />
          </Surface>
        ))}
      </View>
      <ActionButton
        variant="secondary"
        label={t("退出当前账户", "Sign out")}
        onPress={() => void exit()}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
  },
  body: {
    fontSize: 14,
    lineHeight: 21,
  },
});
