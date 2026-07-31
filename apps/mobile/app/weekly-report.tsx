import { useCallback, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import type { WeeklyReport } from "@/src/api/types";
import { useSession } from "@/src/auth/session-context";
import { useCopy } from "@/src/i18n";
import {
  ActionButton,
  InlineNotice,
  LoadingState,
  PageHeading,
  Screen,
  Stat,
  Surface,
} from "@/src/ui/components";
import { useAppTheme } from "@/src/ui/theme";

export default function WeeklyReportScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const { api } = useSession();
  const { t } = useCopy();
  const [report, setReport] = useState<WeeklyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setReport(await api.weeklyReport());
      setError("");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : t("无法加载周报。", "Could not load the weekly report."),
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

  if (loading) {
    return (
      <Screen scroll={false}>
        <LoadingState
          label={t(
            "正在汇总一周学习证据…",
            "Summarising this week's learning evidence…",
          )}
        />
      </Screen>
    );
  }

  if (!report) {
    return (
      <Screen>
        <PageHeading
          eyebrow="Weekly report"
          title={t("本周学习报告", "This week's report")}
        />
        <InlineNotice
          tone="warning"
          title={t("周报当前不可用", "Weekly report unavailable")}
          body={
            error ||
            t(
              "需要有效的 Founding 或 Semester Pass。",
              "An active Founding or Semester Pass is required.",
            )
          }
        />
        <ActionButton
          variant="secondary"
          label={t("查看当前套餐", "View current plan")}
          onPress={() => router.push("/billing")}
        />
      </Screen>
    );
  }

  const accuracy =
    report.practiceAttempts > 0
      ? Math.round((report.correctAttempts / report.practiceAttempts) * 100)
      : null;

  return (
    <Screen>
      <PageHeading
        eyebrow="Weekly evidence"
        title={t("这周完成了什么", "What you completed this week")}
        lead={`${report.from.slice(0, 10)} → ${report.to.slice(0, 10)}`}
      />
      <View style={styles.stats}>
        <Stat label={t("完成任务", "Tasks completed")} value={report.completedTasks} />
        <Stat label={t("专注分钟", "Focus minutes")} value={report.focusMinutes} />
        <Stat label={t("练习", "Attempts")} value={report.practiceAttempts} />
        <Stat
          label={t("正确率", "Accuracy")}
          value={accuracy === null ? t("暂无", "None yet") : `${accuracy}%`}
        />
        <Stat label={t("完成复测", "Reviews completed")} value={report.reviewsCompleted} />
        <Stat label={t("待复测", "Reviews due")} value={report.dueReviews} />
      </View>
      {report.courses.map((course) => (
        <Surface key={course.courseId}>
          <Text style={[styles.title, { color: theme.ink }]}>
            {course.courseName}
          </Text>
          <Text style={[styles.body, { color: theme.muted }]}>
            {t(
              `${course.completedTasks} 项任务 · ${Math.floor(course.focusMinutes)} 分钟专注 · ${course.practiceAttempts} 次练习 · ${course.reviewsCompleted} 次复测`,
              `${course.completedTasks} tasks · ${Math.floor(course.focusMinutes)} focus minutes · ${course.practiceAttempts} attempts · ${course.reviewsCompleted} reviews`,
            )}
          </Text>
        </Surface>
      ))}
      <Surface>
        <Text style={[styles.title, { color: theme.ink }]}>
          {t("下一周优先巩固", "Priorities for next week")}
        </Text>
        {report.weakTopics.length ? (
          report.weakTopics.map((topic) => (
            <View style={styles.topic} key={`${topic.courseName}-${topic.topicTitle}`}>
              <Text style={[styles.topicTitle, { color: theme.ink }]}>
                {topic.topicTitle}
              </Text>
              <Text style={[styles.body, { color: theme.muted }]}>
                {topic.courseName}
                {topic.lastErrorType ? ` · ${topic.lastErrorType}` : ""}
              </Text>
            </View>
          ))
        ) : (
          <Text style={[styles.body, { color: theme.muted }]}>
            {t(
              "先完成一道独立练习以建立证据。",
              "Complete an independent question to start building evidence.",
            )}
          </Text>
        )}
      </Surface>
    </Screen>
  );
}

const styles = StyleSheet.create({
  stats: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  title: { fontSize: 19, fontWeight: "800" },
  body: { fontSize: 14, lineHeight: 21 },
  topic: { gap: 4 },
  topicTitle: { fontSize: 15, fontWeight: "800" },
});
