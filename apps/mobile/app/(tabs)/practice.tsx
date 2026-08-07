import { useCallback, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { PracticeOverviewResponse } from "@/src/api/types";
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

export default function PracticeScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const { api } = useSession();
  const { t } = useCopy();
  const [data, setData] = useState<PracticeOverviewResponse | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const result = await api.practiceOverview();
      setData(result);
      setSelectedCourseId((current) =>
        result.courses.some((course) => course.id === current)
          ? current
          : result.courses[0]?.id ?? null,
      );
      setError("");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : t("无法加载练习。", "Practice could not be loaded."),
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

  function openSession(sessionId: string) {
    router.push({
      pathname: "/practice-session/[sessionId]",
      params: { sessionId },
    });
  }

  async function start() {
    if (!selectedCourseId) return;
    setActionLoading(true);
    setError("");
    try {
      const result = await api.startPracticeSession({
        courseId: selectedCourseId,
        confidenceBefore: 3,
      });
      openSession(result.session.sessionId);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : t("无法开始练习。", "Practice could not be started."),
      );
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <Screen scroll={false}>
        <LoadingState
          label={t(
            "正在选择最值得练习的知识点…",
            "Selecting the most useful topic…",
          )}
        />
      </Screen>
    );
  }

  const selected = data?.courses.find(
    (course) => course.id === selectedCourseId,
  );
  return (
    <Screen>
      <PageHeading
        eyebrow="Retrieval practice"
        title={t(
          "先独立作答，再看解释",
          "Answer independently before seeing the explanation",
        )}
        lead={t(
          "提示和先前错误都会成为掌握度证据，因此支持后答对不会被算作完全独立掌握。",
          "Hints and prior errors are mastery evidence, so a supported correct answer is not treated as fully independent.",
        )}
      />
      <InlineNotice
        title={t("学习辅导模式", "Study support mode")}
        body={t(
          "私人题目用于练习和概念理解，不应复制正在评分的作业或考试答案。",
          "Private questions support practice and conceptual understanding; do not copy graded assignment or exam answers.",
        )}
      />
      {error ? (
        <InlineNotice
          tone="danger"
          title={t("暂时无法继续", "Unable to continue")}
          body={error}
        />
      ) : null}
      {data?.activeSession ? (
        <Surface style={{ borderLeftColor: theme.amber, borderLeftWidth: 4 }}>
          <Text style={[styles.kicker, { color: theme.amber }]}>
            ACTIVE SESSION
          </Text>
          <Text style={[styles.title, { color: theme.ink }]}>
            {data.activeSession.topicTitle}
          </Text>
          <Text style={[styles.meta, { color: theme.muted }]}>
            {data.activeSession.courseName} ·{" "}
            {t(
              `已使用 ${data.activeSession.hintsUsed} 个提示`,
              `${data.activeSession.hintsUsed} hint${
                data.activeSession.hintsUsed === 1 ? "" : "s"
              } used`,
            )}
          </Text>
          <ActionButton
            label={t("继续当前练习", "Continue current practice")}
            onPress={() => openSession(data.activeSession!.sessionId)}
          />
        </Surface>
      ) : null}

      {data?.courses.length ? (
        <Surface>
          <Text style={[styles.sectionTitle, { color: theme.ink }]}>
            {t("选择课程", "Choose a course")}
          </Text>
          <View style={styles.courseList}>
            {data.courses.map((course) => {
              const selectedCourse = selectedCourseId === course.id;
              const colour = courseColour(theme, course.colourKey);
              return (
                <Pressable
                  accessibilityRole="radio"
                  accessibilityState={{ selected: selectedCourse }}
                  key={course.id}
                  onPress={() => setSelectedCourseId(course.id)}
                  style={[
                    styles.courseRow,
                    {
                      backgroundColor: selectedCourse
                        ? theme.surfaceMuted
                        : theme.surface,
                      borderColor: selectedCourse ? colour : theme.line,
                    },
                  ]}
                >
                  <View
                    style={[styles.courseDot, { backgroundColor: colour }]}
                  />
                  <View style={styles.courseText}>
                    <Text style={[styles.courseName, { color: theme.ink }]}>
                      {[course.courseCode, course.courseName]
                        .filter(Boolean)
                        .join(" · ")}
                    </Text>
                    <Text style={[styles.meta, { color: theme.muted }]}>
                      {t(
                        `${course.questionCount} 道私人/可用题 · ${course.dueReviewCount} 个到期复测`,
                        `${course.questionCount} private/available question${
                          course.questionCount === 1 ? "" : "s"
                        } · ${course.dueReviewCount} due retest${
                          course.dueReviewCount === 1 ? "" : "s"
                        }`,
                      )}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
          {selected && selected.questionCount > 0 ? (
            <ActionButton
              disabled={actionLoading || Boolean(data.activeSession)}
              label={
                actionLoading
                  ? t("正在开始…", "Starting…")
                  : t("开始一组练习", "Start practice")
              }
              onPress={() => void start()}
            />
          ) : (
            <ActionButton
              label={t(
                "为这门课创建私人练习",
                "Create private practice for this course",
              )}
              onPress={() =>
                router.push({
                  pathname: "/new-question",
                  params: { courseId: selectedCourseId ?? "" },
                })
              }
            />
          )}
        </Surface>
      ) : (
        <EmptyState
          title={t("还没有可练习的课程", "No course ready for practice")}
          body={t(
            "先完成 Onboarding 并添加一门课程。",
            "Complete onboarding and add a course first.",
          )}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  kicker: {
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
  },
  meta: {
    fontSize: 13,
    lineHeight: 19,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
  },
  courseList: {
    gap: 9,
  },
  courseRow: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    borderWidth: 1,
    borderRadius: 12,
    padding: 11,
  },
  courseDot: {
    width: 11,
    height: 38,
    borderRadius: 6,
  },
  courseText: {
    flex: 1,
    gap: 3,
  },
  courseName: {
    fontSize: 15,
    fontWeight: "800",
  },
});
