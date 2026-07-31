import { useCallback, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { MasteryOverviewResponse } from "@/src/api/types";
import { useSession } from "@/src/auth/session-context";
import { formatReviewTime } from "@/src/lib/dates";
import {
  ActionButton,
  EmptyState,
  InlineNotice,
  LoadingState,
  PageHeading,
  Screen,
  Stat,
  Surface,
} from "@/src/ui/components";
import { courseColour, useAppTheme } from "@/src/ui/theme";
import { useCopy } from "@/src/i18n";

const bandLabels: Record<
  MasteryOverviewResponse["topics"][number]["band"],
  readonly [string, string]
> = {
  not_started: ["未开始", "Not started"],
  building: ["正在建立", "Building"],
  basic: ["基本掌握", "Basic mastery"],
  stable: ["稳定掌握", "Stable mastery"],
  review_due: ["需要复测", "Retest due"],
};

export default function MasteryScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const { api, user } = useSession();
  const { t, locale } = useCopy();
  const [data, setData] = useState<MasteryOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [startingTopicId, setStartingTopicId] = useState<string | null>(
    null,
  );
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setData(await api.mastery());
      setError("");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : t("无法加载掌握度。", "Mastery could not be loaded."),
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

  async function startReview(
    topic: MasteryOverviewResponse["topics"][number],
  ) {
    setStartingTopicId(topic.topicId);
    setError("");
    try {
      const result = await api.startPracticeSession({
        courseId: topic.courseId,
        topicId: topic.topicId,
        studyTaskId: topic.reviewTaskId,
        confidenceBefore: 3,
      });
      router.push({
        pathname: "/practice-session/[sessionId]",
        params: { sessionId: result.session.sessionId },
      });
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : t("无法开始这次复测。", "This retest could not be started."),
      );
    } finally {
      setStartingTopicId(null);
    }
  }

  if (loading) {
    return (
      <Screen scroll={false}>
        <LoadingState
          label={t("正在整理学习证据…", "Organising learning evidence…")}
        />
      </Screen>
    );
  }

  const timezone = data?.timezone ?? user?.timezone ?? "Australia/Sydney";

  return (
    <Screen scroll={false} contentStyle={styles.screen}>
      <FlatList
        data={data?.topics ?? []}
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
              eyebrow="Evidence, not self-rating"
              title={t("掌握度", "Mastery")}
              lead={t(
                "只显示可理解的掌握阶段；答案正确性、提示使用和延迟复测共同决定变化。",
                "Understandable stages replace false precision; correctness, hints, and delayed retests all drive changes.",
              )}
            />
            <Surface style={styles.summary}>
              <Stat
                label={t("到期复测", "Due retests")}
                value={data?.dueCount ?? 0}
              />
              <Stat
                label={t("稳定掌握", "Stable mastery")}
                value={data?.stableCount ?? 0}
              />
              <Stat
                label={t("已有证据", "Topics with evidence")}
                value={data?.topics.length ?? 0}
              />
            </Surface>
            {error ? (
              <InlineNotice
                tone="danger"
                title={t(
                  "掌握度暂时无法同步",
                  "Mastery could not be synced",
                )}
                body={error}
              />
            ) : null}
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            title={t("还没有掌握度证据", "No mastery evidence yet")}
            body={t(
              "完成第一道练习后，这里会显示知识点状态和复测安排。",
              "Complete one practice question to see topic state and retest timing.",
            )}
          />
        }
        renderItem={({ item }) => {
          const colour = courseColour(theme, item.colourKey);
          return (
            <Surface
              style={{
                borderLeftColor: item.isReviewDue ? theme.amber : colour,
                borderLeftWidth: 5,
                marginBottom: 12,
              }}
            >
              <View style={styles.topline}>
                <Text style={[styles.course, { color: colour }]}>
                  {[item.courseCode, item.courseName]
                    .filter(Boolean)
                    .join(" · ")}
                </Text>
                <View
                  style={[
                    styles.band,
                    {
                      backgroundColor: item.isReviewDue
                        ? theme.warningSurface
                        : theme.surfaceMuted,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.bandText,
                      { color: item.isReviewDue ? theme.amber : theme.ink },
                    ]}
                  >
                    {t(...bandLabels[item.band])}
                  </Text>
                </View>
              </View>
              <Text style={[styles.topic, { color: theme.ink }]}>
                {item.topicTitle}
              </Text>
              <Text style={[styles.meta, { color: theme.muted }]}>
                {t(
                  `${item.attemptCount} 次有效作答 · 连续正确 ${item.consecutiveCorrect} 次`,
                  `${item.attemptCount} valid attempt${
                    item.attemptCount === 1 ? "" : "s"
                  } · ${item.consecutiveCorrect} consecutive correct`,
                )}
              </Text>
              <Text style={[styles.reviewAt, { color: theme.muted }]}>
                {item.isReviewDue
                  ? t("应立即复测", "Retest now")
                  : t("下次复测", "Next retest")}
                :{" "}
                {formatReviewTime(item.nextReviewAt, locale, timezone)}
              </Text>
              {item.lastErrorType ? (
                <Text style={[styles.meta, { color: theme.muted }]}>
                  {t("最近错误类型", "Latest error type")}:{" "}
                  {item.lastErrorType}
                </Text>
              ) : null}
              {item.isReviewDue ? (
                <ActionButton
                  disabled={startingTopicId !== null}
                  label={
                    startingTopicId === item.topicId
                      ? t("正在准备复测…", "Preparing retest…")
                      : t("开始到期复测", "Start due retest")
                  }
                  onPress={() => void startReview(item)}
                />
              ) : null}
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
  summary: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  topline: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
  },
  course: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "900",
    letterSpacing: 0.3,
  },
  band: {
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  bandText: {
    fontSize: 11,
    fontWeight: "800",
  },
  topic: {
    fontSize: 21,
    lineHeight: 27,
    fontWeight: "800",
  },
  meta: {
    fontSize: 13,
    lineHeight: 19,
  },
  reviewAt: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
  },
});
