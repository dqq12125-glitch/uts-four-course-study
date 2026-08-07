import { useCallback, useState } from "react";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { useFocusEffect, useRouter } from "expo-router";
import {
  Linking,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import type {
  AccountSettings,
  NotificationPreferences,
} from "@/src/api/types";
import { buildApiUrl } from "@/src/api/client";
import { useSession } from "@/src/auth/session-context";
import { useCopy } from "@/src/i18n";
import {
  ActionButton,
  Field,
  InlineNotice,
  LoadingState,
  PageHeading,
  Screen,
  Surface,
} from "@/src/ui/components";
import { useAppTheme } from "@/src/ui/theme";

const API_BASE =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://localhost:3000";

function bool(value: number | boolean): boolean {
  return value === true || value === 1;
}

function Toggle({
  label,
  value,
  onValueChange,
}: {
  label: string;
  value: boolean;
  onValueChange(value: boolean): void;
}) {
  const theme = useAppTheme();
  return (
    <View style={styles.toggle}>
      <Text style={[styles.toggleLabel, { color: theme.ink }]}>{label}</Text>
      <Switch value={value} onValueChange={onValueChange} />
    </View>
  );
}

export default function SettingsScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const { api, refreshSession, signOut } = useSession();
  const { t } = useCopy();
  const [settings, setSettings] = useState<AccountSettings | null>(null);
  const [notifications, setNotifications] =
    useState<NotificationPreferences | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [timezone, setTimezone] = useState("");
  const [dailyMinutes, setDailyMinutes] = useState("60");
  const [studyStart, setStudyStart] = useState("");
  const [deleteText, setDeleteText] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    try {
      const [profile, preferences] = await Promise.all([
        api.profileSettings(),
        api.notificationSettings(),
      ]);
      setSettings(profile.settings);
      setNotifications(preferences.settings);
      setDisplayName(profile.settings.displayName ?? "");
      setTimezone(profile.settings.timezone);
      setDailyMinutes(String(profile.settings.dailyStudyMinutes));
      setStudyStart(profile.settings.preferredStudyStartTime ?? "");
      setError("");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : t("无法加载设置。", "Could not load settings."),
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

  async function save() {
    if (!settings || !notifications) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await Promise.all([
        api.updateProfile({
          displayName: displayName.trim() || null,
          preferredLanguage: settings.preferredLanguage,
          timezone: timezone.trim(),
        }),
        api.updateStudySettings({
          dailyStudyMinutes: Number(dailyMinutes),
          preferredStudyStartTime: studyStart.trim() || null,
          weekStartsOn: settings.weekStartsOn,
          reminderEnabled: bool(settings.reminderEnabled),
          academicIntegrityMode: bool(settings.academicIntegrityMode),
          aiExplanationLanguage: settings.aiExplanationLanguage,
        }),
        api.updateNotificationSettings({
          tomorrowClasses: bool(notifications.tomorrowClasses),
          deadlineApproaching: bool(notifications.deadlineApproaching),
          dailyPlan: bool(notifications.dailyPlan),
          reviewDue: bool(notifications.reviewDue),
          weeklyReport: bool(notifications.weeklyReport),
          marketing: bool(notifications.marketing),
        }),
      ]);
      await refreshSession();
      setMessage(t("设置已保存。", "Settings saved."));
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : t("无法保存设置。", "Could not save settings."),
      );
    } finally {
      setBusy(false);
    }
  }

  function updateNotification(
    key: keyof Omit<NotificationPreferences, "unsubscribedAt">,
    value: boolean,
  ) {
    setNotifications((current) =>
      current ? { ...current, [key]: value } : current,
    );
  }

  async function exportData() {
    setBusy(true);
    setError("");
    try {
      const payload = await api.exportData();
      const file = new File(Paths.cache, `deepstudy-data-${Date.now()}.json`);
      file.write(JSON.stringify(payload, null, 2));
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri, {
          mimeType: "application/json",
          dialogTitle: t("导出 DeepStudy 数据", "Export DeepStudy data"),
        });
      } else {
        setMessage(
          t(`数据已暂存：${file.uri}`, `Data saved temporarily: ${file.uri}`),
        );
      }
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : t("无法导出数据。", "Could not export your data."),
      );
    } finally {
      setBusy(false);
    }
  }

  async function deleteAccount() {
    setBusy(true);
    setError("");
    try {
      await api.deleteAccount();
      await signOut().catch(() => undefined);
      router.replace("/sign-in");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : t("无法删除账户。", "Could not delete the account."),
      );
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <Screen scroll={false}>
        <LoadingState
          label={t("正在加载账户设置…", "Loading account settings…")}
        />
      </Screen>
    );
  }

  if (!settings || !notifications) {
    return (
      <Screen>
        <InlineNotice
          tone="danger"
          title={t("设置不可用", "Settings unavailable")}
          body={error || t("请稍后重试。", "Please try again later.")}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <PageHeading
        eyebrow="Account controls"
        title={t("账户、学习与隐私", "Account, study, and privacy")}
        lead={settings.email}
      />
      {error ? (
        <InlineNotice
          tone="danger"
          title={t("操作未完成", "Action not completed")}
          body={error}
        />
      ) : null}
      {message ? (
        <InlineNotice title={t("完成", "Done")} body={message} />
      ) : null}

      <Surface>
        <Text style={[styles.sectionTitle, { color: theme.ink }]}>
          {t("个人资料", "Profile")}
        </Text>
        <Field
          label={t("称呼", "Display name")}
          value={displayName}
          onChangeText={setDisplayName}
        />
        <Field
          label={t("时区", "Time zone")}
          autoCapitalize="none"
          value={timezone}
          onChangeText={setTimezone}
        />
        <Text style={[styles.label, { color: theme.ink }]}>
          {t("解释语言", "Explanation language")}
        </Text>
        <View style={styles.language}>
          {(["zh-CN", "en"] as const).map((language) => (
            <Pressable
              accessibilityRole="radio"
              accessibilityState={{
                selected: settings.preferredLanguage === language,
              }}
              key={language}
              onPress={() =>
                setSettings((current) =>
                  current
                    ? {
                        ...current,
                        preferredLanguage: language,
                        aiExplanationLanguage: language,
                      }
                    : current,
                )
              }
              style={[
                styles.languageButton,
                {
                  borderColor:
                    settings.preferredLanguage === language
                      ? theme.accent
                      : theme.line,
                },
              ]}
            >
              <Text style={{ color: theme.ink }}>
                {language === "zh-CN" ? "中文" : "English"}
              </Text>
            </Pressable>
          ))}
        </View>
      </Surface>

      <Surface>
        <Text style={[styles.sectionTitle, { color: theme.ink }]}>
          {t("学习设置", "Study settings")}
        </Text>
        <Field
          label={t("每日学习分钟", "Daily study minutes")}
          keyboardType="number-pad"
          value={dailyMinutes}
          onChangeText={setDailyMinutes}
        />
        <Field
          label={t(
            "偏好开始时间（HH:mm，可空）",
            "Preferred start time (HH:mm, optional)",
          )}
          value={studyStart}
          onChangeText={setStudyStart}
        />
        <Toggle
          label={t("允许学习提醒", "Allow study reminders")}
          value={bool(settings.reminderEnabled)}
          onValueChange={(value) =>
            setSettings((current) =>
              current ? { ...current, reminderEnabled: value } : current,
            )
          }
        />
        <Toggle
          label="Academic Integrity Mode"
          value={bool(settings.academicIntegrityMode)}
          onValueChange={(value) =>
            setSettings((current) =>
              current ? { ...current, academicIntegrityMode: value } : current,
            )
          }
        />
      </Surface>

      <Surface>
        <Text style={[styles.sectionTitle, { color: theme.ink }]}>
          {t("提醒类型", "Reminder types")}
        </Text>
        <Toggle
          label={t("明日课程", "Tomorrow's classes")}
          value={bool(notifications.tomorrowClasses)}
          onValueChange={(value) =>
            updateNotification("tomorrowClasses", value)
          }
        />
        <Toggle
          label={t("截止日期临近", "Deadline approaching")}
          value={bool(notifications.deadlineApproaching)}
          onValueChange={(value) =>
            updateNotification("deadlineApproaching", value)
          }
        />
        <Toggle
          label={t("今日计划", "Today's plan")}
          value={bool(notifications.dailyPlan)}
          onValueChange={(value) => updateNotification("dailyPlan", value)}
        />
        <Toggle
          label={t("复测到期", "Review due")}
          value={bool(notifications.reviewDue)}
          onValueChange={(value) => updateNotification("reviewDue", value)}
        />
        <Toggle
          label={t("周学习报告", "Weekly report")}
          value={bool(notifications.weeklyReport)}
          onValueChange={(value) => updateNotification("weeklyReport", value)}
        />
        <Toggle
          label={t(
            "营销邮件（默认关闭）",
            "Marketing email (off by default)",
          )}
          value={bool(notifications.marketing)}
          onValueChange={(value) => updateNotification("marketing", value)}
        />
      </Surface>

      <ActionButton
        disabled={busy}
        label={
          busy
            ? t("正在保存…", "Saving…")
            : t("保存全部设置", "Save all settings")
        }
        onPress={() => void save()}
      />

      <Surface>
        <Text style={[styles.sectionTitle, { color: theme.ink }]}>
          {t("数据控制", "Data controls")}
        </Text>
        <ActionButton
          variant="secondary"
          disabled={busy}
          label={t("导出我的数据", "Export my data")}
          onPress={() => void exportData()}
        />
        <View style={styles.legal}>
          <ActionButton
            variant="secondary"
            label={t("隐私说明", "Privacy notice")}
            onPress={() =>
              void Linking.openURL(buildApiUrl(API_BASE, "/legal/privacy"))
            }
          />
          <ActionButton
            variant="secondary"
            label={t("条款", "Terms")}
            onPress={() =>
              void Linking.openURL(buildApiUrl(API_BASE, "/legal/terms"))
            }
          />
        </View>
        <Field
          label={t(
            "输入 DELETE 以永久删除账户",
            "Enter DELETE to permanently delete the account",
          )}
          autoCapitalize="characters"
          value={deleteText}
          onChangeText={setDeleteText}
        />
        <ActionButton
          variant="danger"
          disabled={busy || deleteText !== "DELETE"}
          label={t(
            "永久删除账户及个人数据",
            "Permanently delete account and personal data",
          )}
          onPress={() => void deleteAccount()}
        />
      </Surface>
    </Screen>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { fontSize: 20, fontWeight: "800" },
  label: { fontSize: 14, fontWeight: "700" },
  language: { flexDirection: "row", gap: 8 },
  languageButton: {
    minHeight: 48,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: 12,
  },
  toggle: {
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14,
  },
  toggleLabel: { flex: 1, fontSize: 15, fontWeight: "700" },
  legal: { gap: 8 },
});
