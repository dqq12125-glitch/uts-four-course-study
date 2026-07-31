import { useCallback, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { Course } from "@/src/api/types";
import { useSession } from "@/src/auth/session-context";
import {
  ActionButton,
  EmptyState,
  InlineNotice,
  LoadingState,
  PageHeading,
  Screen,
  Surface,
} from "@/src/ui/components";
import {
  courseColour,
  useAppTheme,
} from "@/src/ui/theme";
import { useCopy } from "@/src/i18n";

export default function CoursesScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const { api } = useSession();
  const { t } = useCopy();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const result = await api.courses();
      setCourses(result.courses);
      setError("");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : t("无法加载课程。", "Courses could not be loaded."),
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [api, t]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  if (loading) {
    return (
      <Screen scroll={false}>
        <LoadingState label={t("正在加载课程…", "Loading courses…")} />
      </Screen>
    );
  }

  return (
    <Screen scroll={false} contentStyle={styles.screen}>
      <FlatList
        data={courses}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            tintColor={theme.accent}
            onRefresh={() => {
              setRefreshing(true);
              void load();
            }}
          />
        }
        ListHeaderComponent={
          <View style={styles.header}>
            <PageHeading
              eyebrow="Open courses"
              title={t("我的课程", "My courses")}
              lead={t(
                "课程名称是一等数据；课程代码和模板都可以为空。",
                "Course name is primary; code and template are optional.",
              )}
            />
            {error ? (
              <InlineNotice
                tone="danger"
                title={t("同步失败", "Sync failed")}
                body={error}
              />
            ) : null}
            <ActionButton
              label={t("添加任意课程", "Add any course")}
              onPress={() => router.push("/new-course")}
            />
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            title={t("还没有活跃课程", "No active courses")}
            body={t(
              "完成 Onboarding 后，你的第一门课程会显示在这里。",
              "Your first course appears here after onboarding.",
            )}
          />
        }
        ListFooterComponent={<View style={styles.footer} />}
        renderItem={({ item }) => {
          const colour = courseColour(theme, item.colourKey);
          return (
            <Surface
              style={{
                borderLeftColor: colour,
                borderLeftWidth: 5,
                marginBottom: 12,
              }}
            >
              <View style={styles.courseTopline}>
                <Text style={[styles.code, { color: colour }]}>
                  {item.courseCode || t("自定义课程", "Custom course")}
                </Text>
                <Text style={[styles.source, { color: theme.muted }]}>
                  {item.sourceType}
                </Text>
              </View>
              <Text style={[styles.name, { color: theme.ink }]}>
                {item.courseName}
              </Text>
              <Text style={[styles.meta, { color: theme.muted }]}>
                {t(
                  `${item.assessmentCount ?? 0} 个 Assessment`,
                  `${item.assessmentCount ?? 0} assessment${
                    Number(item.assessmentCount ?? 0) === 1 ? "" : "s"
                  }`,
                )}
                {item.instructorName ? ` · ${item.instructorName}` : ""}
              </Text>
              <ActionButton
                variant="secondary"
                label={t("课程详情", "Course details")}
                onPress={() =>
                  router.push({
                    pathname: "/course/[courseId]",
                    params: { courseId: item.id },
                  })
                }
              />
            </Surface>
          );
        }}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 0,
  },
  list: {
    flexGrow: 1,
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 112,
  },
  header: {
    gap: 14,
    marginBottom: 16,
  },
  courseTopline: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  code: {
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.8,
  },
  source: {
    fontSize: 12,
    fontWeight: "700",
  },
  name: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "800",
  },
  meta: {
    fontSize: 14,
  },
  footer: {
    marginTop: 12,
  },
});
