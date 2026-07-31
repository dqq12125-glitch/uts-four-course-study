import { Ionicons } from "@expo/vector-icons";
import { Redirect, Tabs } from "expo-router";
import { useSession } from "@/src/auth/session-context";
import { LoadingState, Screen } from "@/src/ui/components";
import { useAppTheme } from "@/src/ui/theme";
import { useCopy } from "@/src/i18n";

const icons = {
  today: ["today-outline", "today"] as const,
  courses: ["library-outline", "library"] as const,
  plan: ["calendar-outline", "calendar"] as const,
  practice: ["create-outline", "create"] as const,
  mastery: ["pulse-outline", "pulse"] as const,
  more: ["ellipsis-horizontal-circle-outline", "ellipsis-horizontal-circle"] as const,
};

export default function TabsLayout() {
  const theme = useAppTheme();
  const { t } = useCopy();
  const { status, user } = useSession();
  if (status === "loading") {
    return (
      <Screen scroll={false}>
        <LoadingState />
      </Screen>
    );
  }
  if (!user) return <Redirect href="/sign-in" />;
  if (!user.onboardingCompleted) return <Redirect href="/onboarding" />;

  return (
    <Tabs
      screenOptions={({ route }) => {
        const pair = icons[route.name as keyof typeof icons] ?? icons.today;
        return {
          headerStyle: { backgroundColor: theme.canvas },
          headerShadowVisible: false,
          headerTintColor: theme.ink,
          headerTitleStyle: { fontWeight: "800" },
          sceneStyle: { backgroundColor: theme.canvas },
          tabBarActiveTintColor: theme.accent,
          tabBarInactiveTintColor: theme.muted,
          tabBarStyle: {
            backgroundColor: theme.surface,
            borderTopColor: theme.line,
            height: 78,
            paddingBottom: 12,
            paddingTop: 8,
          },
          tabBarLabelStyle: { fontSize: 12, fontWeight: "700" },
          tabBarIcon: ({ color, focused, size }) => (
            <Ionicons
              color={color}
              name={focused ? pair[1] : pair[0]}
              size={size}
            />
          ),
        };
      }}
    >
      <Tabs.Screen name="today" options={{ title: t("今日", "Today") }} />
      <Tabs.Screen name="plan" options={{ title: t("计划", "Plan") }} />
      <Tabs.Screen name="courses" options={{ title: t("课程", "Courses") }} />
      <Tabs.Screen name="practice" options={{ title: t("练习", "Practice") }} />
      <Tabs.Screen
        name="mastery"
        options={{ title: t("掌握度", "Mastery"), href: null }}
      />
      <Tabs.Screen name="more" options={{ title: t("更多", "More") }} />
    </Tabs>
  );
}
