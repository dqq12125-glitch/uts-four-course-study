import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Redirect, useRouter } from "expo-router";
import { useSession } from "@/src/auth/session-context";
import {
  ActionButton,
  Field,
  InlineNotice,
  PageHeading,
  Screen,
  Surface,
} from "@/src/ui/components";
import { useAppTheme } from "@/src/ui/theme";
import { mobileCopy, type MobileLanguage } from "@/src/i18n";

export default function SignInScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const { api, user, acceptMobileSession } = useSession();
  const [email, setEmail] = useState("");
  const [intent, setIntent] = useState<"sign-in" | "sign-up">("sign-in");
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [language, setLanguage] = useState<MobileLanguage>(() =>
    Intl.DateTimeFormat().resolvedOptions().locale
      .toLowerCase()
      .startsWith("zh")
      ? "zh-CN"
      : "en",
  );
  const t = (zh: string, en: string) => mobileCopy(language, zh, en);

  if (user) return <Redirect href="/" />;

  async function sendLink() {
    setSending(true);
    setError("");
    setMessage("");
    setPreviewUrl(null);
    try {
      const result = await api.requestMagicLink({
        email,
        intent,
        language,
      });
      setMessage(
        t(
          "如果该邮箱可以使用，安全登录链接已经发送。请在同一台手机上打开邮件。",
          "If the address can be used, a secure sign-in link has been sent. Open it on this phone.",
        ),
      );
      setPreviewUrl(result.developmentPreviewUrl ?? null);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : t(
              "暂时无法发送登录链接。",
              "The sign-in link could not be sent.",
            ),
      );
    } finally {
      setSending(false);
    }
  }

  async function completeDevelopmentSignIn() {
    if (!previewUrl) return;
    setSending(true);
    setError("");
    try {
      const token = new URL(previewUrl).searchParams.get("token");
      if (!token) throw new Error("The local sign-in link has no token.");
      const result = await api.exchangeMagicToken(token);
      await acceptMobileSession(result.sessionToken, result.user);
      router.replace(
        result.user.onboardingCompleted
          ? "/(tabs)/today"
          : "/onboarding",
      );
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : t("无法完成本地登录。", "Could not complete local sign-in."),
      );
    } finally {
      setSending(false);
    }
  }

  return (
    <Screen>
      <PageHeading
        eyebrow="Turn your semester into today’s next step"
        title={t(
          "打开 App，就知道今天学什么。",
          "Open the app and know exactly what to study today.",
        )}
        lead={t(
          "同一个 DeepStudy 账户可在 iPhone、iPad、Android 和网页端使用。",
          "Use the same DeepStudy account on iPhone, iPad, Android, and the web.",
        )}
      />
      <Surface>
        <View
          accessibilityRole="tablist"
          style={[styles.intent, { backgroundColor: theme.surfaceMuted }]}
        >
          {(["sign-in", "sign-up"] as const).map((value) => (
            <Pressable
              accessibilityRole="tab"
              accessibilityState={{ selected: intent === value }}
              key={value}
              onPress={() => setIntent(value)}
              style={[
                styles.intentButton,
                intent === value
                  ? { backgroundColor: theme.surface }
                  : undefined,
              ]}
            >
              <Text style={[styles.intentLabel, { color: theme.ink }]}>
                {value === "sign-in"
                  ? t("登录", "Sign in")
                  : t("注册", "Sign up")}
              </Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.languageRow}>
          {(["zh-CN", "en"] as const).map((value) => (
            <Pressable
              accessibilityRole="radio"
              accessibilityState={{ selected: language === value }}
              key={value}
              onPress={() => setLanguage(value)}
              style={[
                styles.languageButton,
                {
                  borderColor:
                    language === value ? theme.accent : theme.line,
                  backgroundColor:
                    language === value
                      ? theme.surfaceMuted
                      : theme.surface,
                },
              ]}
            >
              <Text style={[styles.intentLabel, { color: theme.ink }]}>
                {value === "zh-CN" ? "中文" : "English"}
              </Text>
            </Pressable>
          ))}
        </View>
        <Field
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          label={t("学校或个人邮箱", "Institution or personal email")}
          placeholder="name@example.com"
          returnKeyType="send"
          textContentType="emailAddress"
          value={email}
          onChangeText={setEmail}
          onSubmitEditing={() => void sendLink()}
        />
        <ActionButton
          disabled={sending || !email.trim()}
          label={
            sending
              ? t("正在发送…", "Sending…")
              : t("发送安全登录链接", "Send secure sign-in link")
          }
          onPress={() => void sendLink()}
        />
      </Surface>
      {message ? (
        <InlineNotice
          title={t("检查你的邮箱", "Check your email")}
          body={message}
        />
      ) : null}
      {previewUrl ? (
        <ActionButton
          variant="secondary"
          label={t(
            "直接完成本地开发登录",
            "Complete local development sign-in",
          )}
          onPress={() => void completeDevelopmentSignIn()}
        />
      ) : null}
      {error ? (
        <InlineNotice
          tone="danger"
          title={t("发送失败", "Could not send")}
          body={error}
        />
      ) : null}
      <InlineNotice
        title="Academic Integrity"
        body={t(
          "DeepStudy 用于学习计划、概念理解和原创练习，不替代你完成需要独立提交的评估。",
          "DeepStudy supports study planning, conceptual understanding, and original practice. It does not replace your independently submitted work.",
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  intent: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 3,
  },
  intentButton: {
    flex: 1,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 9,
  },
  intentLabel: {
    fontSize: 15,
    fontWeight: "800",
  },
  languageRow: {
    flexDirection: "row",
    gap: 8,
  },
  languageButton: {
    minHeight: 44,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: 10,
  },
});
