import "react-native-gesture-handler";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SessionProvider } from "@/src/auth/session-context";
import { useAppTheme } from "@/src/ui/theme";
import { useCopy } from "@/src/i18n";

function RootNavigator() {
  const theme = useAppTheme();
  const { t } = useCopy();
  return (
    <>
      <StatusBar style={theme.isDark ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: theme.canvas },
          headerShadowVisible: false,
          headerTintColor: theme.ink,
          contentStyle: { backgroundColor: theme.canvas },
          headerTitleStyle: { fontWeight: "800" },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen
          name="sign-in"
          options={{ headerShown: false, title: t("登录", "Sign in") }}
        />
        <Stack.Screen
          name="auth/callback"
          options={{ headerShown: false, title: t("安全登录", "Secure sign-in") }}
        />
        <Stack.Screen
          name="onboarding"
          options={{ title: t("设置我的学期", "Set up my semester"), headerBackVisible: false }}
        />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="practice-session/[sessionId]"
          options={{ title: t("独立练习", "Independent practice"), presentation: "card" }}
        />
        <Stack.Screen
          name="new-question"
          options={{ title: t("创建私人练习", "Create private practice"), presentation: "modal" }}
        />
        <Stack.Screen name="new-task" options={{ title: t("添加任务", "Add task") }} />
        <Stack.Screen name="new-course" options={{ title: t("添加课程", "Add course") }} />
        <Stack.Screen name="edit-course" options={{ title: t("编辑课程", "Edit course") }} />
        <Stack.Screen
          name="course/[courseId]"
          options={{ title: t("课程详情", "Course details") }}
        />
        <Stack.Screen
          name="new-assessment"
          options={{ title: t("添加 Assessment", "Add assessment"), presentation: "modal" }}
        />
        <Stack.Screen
          name="edit-assessment"
          options={{ title: t("编辑 Assessment", "Edit assessment"), presentation: "modal" }}
        />
        <Stack.Screen
          name="new-class"
          options={{ title: t("添加课程安排", "Add class session"), presentation: "modal" }}
        />
        <Stack.Screen
          name="edit-class"
          options={{ title: t("编辑课程安排", "Edit class session"), presentation: "modal" }}
        />
        <Stack.Screen
          name="new-topic"
          options={{ title: t("添加知识点", "Add topic"), presentation: "modal" }}
        />
        <Stack.Screen
          name="edit-topic"
          options={{ title: t("编辑知识点", "Edit topic"), presentation: "modal" }}
        />
        <Stack.Screen name="tutor" options={{ title: t("AI 导师", "AI tutor") }} />
        <Stack.Screen name="resources" options={{ title: t("私人资料", "Private resources") }} />
        <Stack.Screen
          name="resource/[resourceId]"
          options={{ title: t("确认导入", "Confirm import") }}
        />
        <Stack.Screen name="notifications" options={{ title: t("提醒", "Reminders") }} />
        <Stack.Screen name="billing" options={{ title: t("套餐与账单", "Plans and billing") }} />
        <Stack.Screen name="weekly-report" options={{ title: t("周学习报告", "Weekly report") }} />
        <Stack.Screen name="settings" options={{ title: t("账户与设置", "Account and settings") }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <SessionProvider>
      <RootNavigator />
    </SessionProvider>
  );
}
