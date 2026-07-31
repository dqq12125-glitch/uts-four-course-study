import { useCallback, useState } from "react";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { Alert, StyleSheet, Text, View } from "react-native";
import type {
  Assessment,
  ClassSession,
  Course,
  Topic,
} from "@/src/api/types";
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

const DAYS = {
  "zh-CN": ["周日", "周一", "周二", "周三", "周四", "周五", "周六"],
  en: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
} as const;

export default function CourseDetailScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ courseId: string }>();
  const courseId = params.courseId;
  const { api } = useSession();
  const { t, language, locale } = useCopy();
  const [course, setCourse] = useState<Course | null>(null);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [classes, setClasses] = useState<ClassSession[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!courseId) return;
    try {
      const [courseResult, classResult, topicResult] = await Promise.all([
        api.course(courseId),
        api.classSessions(courseId),
        api.topics(courseId),
      ]);
      setCourse(courseResult.course);
      setAssessments(courseResult.assessments);
      setClasses(classResult.classSessions);
      setTopics(topicResult.topics);
      setError("");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : t("无法加载课程。", "Could not load the course."),
      );
    } finally {
      setLoading(false);
    }
  }, [api, courseId, t]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  async function removeAssessment(id: string) {
    try {
      await api.deleteAssessment(id);
      await load();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : t("无法删除 Assessment。", "Could not delete the assessment."),
      );
    }
  }

  async function completeAssessment(assessment: Assessment) {
    try {
      await api.updateAssessment(assessment.id, {
        title: assessment.title,
        assessmentType: assessment.assessmentType,
        dueAt: assessment.dueAt,
        weightPercent: assessment.weightPercent,
        estimatedMinutes: assessment.estimatedMinutes,
        notes: assessment.notes,
        status: "completed",
      });
      await load();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : t("无法更新 Assessment。", "Could not update the assessment."),
      );
    }
  }

  async function removeClass(id: string) {
    try {
      await api.deleteClassSession(id);
      await load();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : t("无法删除课表。", "Could not delete the class session."),
      );
    }
  }

  async function removeTopic(id: string) {
    try {
      await api.deleteTopic(id);
      await load();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : t(
              "已有练习证据的知识点不能删除。",
              "A topic with practice evidence cannot be deleted.",
            ),
      );
    }
  }

  function confirmArchive() {
    Alert.alert(
      t("归档课程", "Archive course"),
      t(
        "课程及其任务会从当前学期界面隐藏。已有学习证据不会跨用户共享。",
        "The course and its tasks will be hidden from the active semester. Existing learning evidence is never shared across users.",
      ),
      [
        { text: t("取消", "Cancel"), style: "cancel" },
        {
          text: t("归档", "Archive"),
          style: "destructive",
          onPress: () => {
            void api
              .archiveCourse(courseId)
              .then(() => router.replace("/(tabs)/courses"))
              .catch((caught: unknown) =>
                setError(
                  caught instanceof Error
                    ? caught.message
                    : t("无法归档课程。", "Could not archive the course."),
                ),
              );
          },
        },
      ],
    );
  }

  if (loading) {
    return (
      <Screen scroll={false}>
        <LoadingState
          label={t("正在加载课程详情…", "Loading course details…")}
        />
      </Screen>
    );
  }
  if (!course) {
    return (
      <Screen>
        <InlineNotice
          tone="danger"
          title={t("课程不可用", "Course unavailable")}
          body={
            error ||
            t(
              "课程不存在或不属于当前账户。",
              "This course does not exist or does not belong to this account.",
            )
          }
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <PageHeading
        eyebrow={course.courseCode || t("自定义课程", "Custom course")}
        title={course.courseName}
        lead={course.instructorName || t("未设置教师", "No instructor set")}
      />
      {error ? (
        <InlineNotice
          tone="danger"
          title={t("操作未完成", "Action not completed")}
          body={error}
        />
      ) : null}
      <View style={styles.actions}>
        <ActionButton
          variant="secondary"
          label={t("编辑课程", "Edit course")}
          onPress={() =>
            router.push({ pathname: "/edit-course", params: { courseId } })
          }
        />
        <ActionButton
          variant="secondary"
          label={t("AI 导师", "AI tutor")}
          onPress={() =>
            router.push({ pathname: "/tutor", params: { courseId } })
          }
        />
        <ActionButton
          variant="secondary"
          label={t("私人资料", "Private resources")}
          onPress={() =>
            router.push({ pathname: "/resources", params: { courseId } })
          }
        />
      </View>

      <Surface>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.ink }]}>
            Assessments
          </Text>
          <ActionButton
            variant="secondary"
            label={t("添加", "Add")}
            onPress={() =>
              router.push({
                pathname: "/new-assessment",
                params: { courseId },
              })
            }
          />
        </View>
        {assessments.length ? (
          assessments.map((assessment) => (
            <View
              style={[styles.row, { borderTopColor: theme.line }]}
              key={assessment.id}
            >
              <Text style={[styles.rowTitle, { color: theme.ink }]}>
                {assessment.title}
              </Text>
              <Text style={[styles.meta, { color: theme.muted }]}>
                {assessment.assessmentType} · {assessment.status}
                {assessment.dueAt
                  ? ` · ${new Intl.DateTimeFormat(locale, {
                      dateStyle: "medium",
                    }).format(new Date(assessment.dueAt))}`
                  : ""}
              </Text>
              <View style={styles.actions}>
                <ActionButton
                  variant="secondary"
                  label={t("编辑", "Edit")}
                  onPress={() =>
                    router.push({
                      pathname: "/edit-assessment",
                      params: {
                        courseId,
                        assessmentId: assessment.id,
                      },
                    })
                  }
                />
                <ActionButton
                  variant="secondary"
                  label={t("完成", "Complete")}
                  onPress={() => void completeAssessment(assessment)}
                />
                <ActionButton
                  variant="danger"
                  label={t("删除", "Delete")}
                  onPress={() =>
                    Alert.alert(
                      t("删除 Assessment？", "Delete assessment?"),
                      assessment.title,
                      [
                      { text: t("取消", "Cancel"), style: "cancel" },
                      {
                        text: t("删除", "Delete"),
                        style: "destructive",
                        onPress: () => void removeAssessment(assessment.id),
                      },
                    ])
                  }
                />
              </View>
            </View>
          ))
        ) : (
          <EmptyState
            title={t("没有 Assessment", "No assessments")}
            body={t(
              "添加截止日期以改善任务优先级。",
              "Add a deadline to improve task prioritisation.",
            )}
          />
        )}
      </Surface>

      <Surface>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.ink }]}>
            {t("课表", "Class schedule")}
          </Text>
          <ActionButton
            variant="secondary"
            label={t("添加", "Add")}
            onPress={() =>
              router.push({ pathname: "/new-class", params: { courseId } })
            }
          />
        </View>
        <ActionButton
          variant="secondary"
          label={t(
            "导入 ICS、截图、PDF 或课表文字",
            "Import ICS, screenshot, PDF, or timetable text",
          )}
          onPress={() =>
            router.push({
              pathname: "/resources",
              params: { courseId, resourceType: "timetable" },
            })
          }
        />
        {classes.length ? (
          classes.map((session) => (
            <View
              style={[styles.row, { borderTopColor: theme.line }]}
              key={session.id}
            >
              <Text style={[styles.rowTitle, { color: theme.ink }]}>
                {DAYS[language][session.dayOfWeek]} {session.startTime}–
                {session.endTime}
              </Text>
              <Text style={[styles.meta, { color: theme.muted }]}>
                {session.title}
                {session.location ? ` · ${session.location}` : ""}
              </Text>
              <View style={styles.actions}>
                <ActionButton
                  variant="secondary"
                  label={t("编辑", "Edit")}
                  onPress={() =>
                    router.push({
                      pathname: "/edit-class",
                      params: {
                        courseId,
                        classSessionId: session.id,
                      },
                    })
                  }
                />
                <ActionButton
                  variant="danger"
                  label={t("删除", "Delete")}
                  onPress={() =>
                    Alert.alert(
                      t("删除课程安排？", "Delete class session?"),
                      session.title,
                      [
                      { text: t("取消", "Cancel"), style: "cancel" },
                      {
                        text: t("删除", "Delete"),
                        style: "destructive",
                        onPress: () => void removeClass(session.id),
                      },
                    ])
                  }
                />
              </View>
            </View>
          ))
        ) : (
          <EmptyState
            title={t("没有固定课表", "No recurring class schedule")}
            body={t(
              "可手动添加每周课程安排。",
              "Add weekly class sessions manually.",
            )}
          />
        )}
      </Surface>

      <Surface>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.ink }]}>
            {t("知识点", "Topics")}
          </Text>
          <ActionButton
            variant="secondary"
            label={t("添加", "Add")}
            onPress={() =>
              router.push({ pathname: "/new-topic", params: { courseId } })
            }
          />
        </View>
        {topics.length ? (
          topics.map((topic) => (
            <View
              style={[styles.row, { borderTopColor: theme.line }]}
              key={topic.id}
            >
              <Text style={[styles.rowTitle, { color: theme.ink }]}>
                {topic.title}
              </Text>
              <Text style={[styles.meta, { color: theme.muted }]}>
                {t(
                  `${topic.attemptCount} 次练习`,
                  `${topic.attemptCount} practice attempts`,
                )}
                {topic.nextReviewAt
                  ? t(
                      ` · 下次复测 ${new Intl.DateTimeFormat(locale, {
                        dateStyle: "short",
                        timeStyle: "short",
                      }).format(new Date(topic.nextReviewAt))}`,
                      ` · Next review ${new Intl.DateTimeFormat(locale, {
                        dateStyle: "short",
                        timeStyle: "short",
                      }).format(new Date(topic.nextReviewAt))}`,
                    )
                  : ""}
              </Text>
              <View style={styles.actions}>
                <ActionButton
                  variant="secondary"
                  label={t("编辑", "Edit")}
                  onPress={() =>
                    router.push({
                      pathname: "/edit-topic",
                      params: { courseId, topicId: topic.id },
                    })
                  }
                />
                <ActionButton
                  variant="danger"
                  label={t("删除", "Delete")}
                  onPress={() =>
                    Alert.alert(t("删除知识点？", "Delete topic?"), topic.title, [
                      { text: t("取消", "Cancel"), style: "cancel" },
                      {
                        text: t("删除", "Delete"),
                        style: "destructive",
                        onPress: () => void removeTopic(topic.id),
                      },
                    ])
                  }
                />
              </View>
            </View>
          ))
        ) : (
          <EmptyState
            title={t("没有知识点", "No topics")}
            body={t(
              "可手动建立，也可在练习时创建。",
              "Create one manually or while starting practice.",
            )}
          />
        )}
      </Surface>

      <ActionButton
        variant="danger"
        label={t("归档这门课程", "Archive this course")}
        onPress={confirmArchive}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
  },
  row: {
    gap: 7,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 13,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: "800",
  },
  meta: {
    fontSize: 13,
    lineHeight: 19,
  },
});
