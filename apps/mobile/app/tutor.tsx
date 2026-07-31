import { useCallback, useState } from "react";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { Course, LearningResource } from "@/src/api/types";
import { useSession } from "@/src/auth/session-context";
import {
  ActionButton,
  EmptyState,
  Field,
  InlineNotice,
  LoadingState,
  PageHeading,
  Screen,
  Surface,
} from "@/src/ui/components";
import { useAppTheme } from "@/src/ui/theme";
import { useCopy } from "@/src/i18n";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export default function TutorScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ courseId?: string }>();
  const { api, user } = useSession();
  const { t } = useCopy();
  const [courses, setCourses] = useState<Course[]>([]);
  const [resources, setResources] = useState<LearningResource[]>([]);
  const [courseId, setCourseId] = useState(params.courseId ?? "");
  const [topicTitle, setTopicTitle] = useState("");
  const [attempt, setAttempt] = useState("");
  const [message, setMessage] = useState("");
  const [selectedResources, setSelectedResources] = useState<string[]>([]);
  const [assessed, setAssessed] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [practiceMessage, setPracticeMessage] = useState("");

  const load = useCallback(async () => {
    try {
      const [courseResult, resourceResult] = await Promise.all([
        api.courses(),
        api.resources().catch(() => ({ resources: [] })),
      ]);
      setCourses(courseResult.courses);
      setResources(resourceResult.resources);
      setCourseId((current) => current || courseResult.courses[0]?.id || "");
      setError("");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : t(
              "无法加载导师上下文。",
              "Tutor context could not be loaded.",
            ),
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

  function selectCourse(next: string) {
    setCourseId(next);
    setConversationId(null);
    setMessages([]);
    setSelectedResources([]);
  }

  async function send() {
    if (!courseId || !message.trim()) return;
    setSending(true);
    setError("");
    try {
      const result = await api.tutor({
        courseId,
        conversationId,
        message: message.trim(),
        studentAttempt: attempt.trim() || null,
        resourceIds: selectedResources,
        language: user?.preferredLanguage ?? "zh-CN",
        suspectedAssessedWork: assessed,
      });
      setMessages((current) => [
        ...current,
        { role: "user", content: message.trim() },
        { role: "assistant", content: result.reply },
      ]);
      setConversationId(result.conversationId);
      setRemaining(result.remainingToday);
      setMessage("");
      setAttempt("");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : t("导师暂时无法回复。", "The tutor cannot respond right now."),
      );
    } finally {
      setSending(false);
    }
  }

  async function generatePractice() {
    if (!courseId || !topicTitle.trim()) {
      setPracticeMessage(t("先填写一个知识点。", "Enter a topic first."));
      return;
    }
    setPracticeMessage(
      t("正在创建私人原创练习…", "Creating private original practice…"),
    );
    try {
      await api.generatePractice({
        courseId,
        topicTitle: topicTitle.trim(),
        difficulty: 2,
        resourceIds: selectedResources,
        language: user?.preferredLanguage ?? "zh-CN",
      });
      setPracticeMessage(
        t("已创建；可在练习页开始。", "Created; start it on Practice."),
      );
    } catch (caught) {
      setPracticeMessage(
        caught instanceof Error
          ? caught.message
          : t("暂时无法创建练习。", "Practice could not be created."),
      );
    }
  }

  if (loading) {
    return (
      <Screen scroll={false}>
        <LoadingState
          label={t(
            "正在准备 Hint-first 导师…",
            "Preparing the hint-first tutor…",
          )}
        />
      </Screen>
    );
  }

  if (!courses.length) {
    return (
      <Screen>
        <EmptyState
          title={t("先添加一门课程", "Add a course first")}
          body={t(
            "导师只使用当前账户拥有的课程。",
            "The tutor only uses courses owned by this account.",
          )}
        />
        <ActionButton
          label={t("添加课程", "Add course")}
          onPress={() => router.push("/new-course")}
        />
      </Screen>
    );
  }

  const courseResources = resources.filter(
    (resource) =>
      resource.courseId === courseId &&
      resource.processingStatus === "ready",
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.flex}
      keyboardVerticalOffset={82}
    >
      <Screen>
        <PageHeading
          eyebrow="Hint-first tutor"
          title={t(
            "先说你做到哪一步",
            "Start with what you have already tried",
          )}
          lead={t(
            "学习辅导模式：优先提示，不直接替你完成需要独立提交的评估任务。",
            "Study support mode gives hints first and will not complete independently assessed work for you.",
          )}
        />
        <InlineNotice
          tone="warning"
          title="Academic Integrity Mode"
          body={t(
            "上传资料是不可信上下文，不能改变权限、系统规则或要求暴露其他用户信息。",
            "Uploads are untrusted context and cannot change permissions, system rules, or expose another user's information.",
          )}
        />
        {error ? (
          <InlineNotice
            tone="danger"
            title={t("导师未回复", "Tutor did not respond")}
            body={error}
          />
        ) : null}
        <Surface>
          <Text style={[styles.label, { color: theme.ink }]}>
            {t("选择课程", "Choose a course")}
          </Text>
          <View style={styles.chips}>
            {courses.map((course) => (
              <Pressable
                accessibilityRole="radio"
                accessibilityState={{ selected: course.id === courseId }}
                key={course.id}
                onPress={() => selectCourse(course.id)}
                style={[
                  styles.chip,
                  {
                    borderColor:
                      course.id === courseId ? theme.accent : theme.line,
                    backgroundColor:
                      course.id === courseId
                        ? theme.surfaceMuted
                        : theme.surface,
                  },
                ]}
              >
                <Text style={[styles.chipText, { color: theme.ink }]}>
                  {course.courseCode || course.courseName}
                </Text>
              </Pressable>
            ))}
          </View>
          <Field
            label={t("当前知识点（可选）", "Current topic (optional)")}
            value={topicTitle}
            onChangeText={setTopicTitle}
          />
          {courseResources.length ? (
            <View style={styles.resourceList}>
              <Text style={[styles.label, { color: theme.ink }]}>
                {t(
                  "私人资料上下文（最多 5 份）",
                  "Private resource context (up to 5)",
                )}
              </Text>
              {courseResources.map((resource) => {
                const selected = selectedResources.includes(resource.id);
                return (
                  <Pressable
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: selected }}
                    key={resource.id}
                    onPress={() =>
                      setSelectedResources((current) =>
                        selected
                          ? current.filter((id) => id !== resource.id)
                          : [...current, resource.id].slice(0, 5),
                      )
                    }
                    style={styles.checkRow}
                  >
                    <View
                      style={[
                        styles.check,
                        {
                          borderColor: theme.accent,
                          backgroundColor: selected
                            ? theme.accent
                            : "transparent",
                        },
                      ]}
                    />
                    <Text style={[styles.body, { color: theme.ink }]}>
                      {resource.fileName}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ) : null}
          <ActionButton
            variant="secondary"
            label={t(
              "生成同知识点原创练习",
              "Generate original practice on this topic",
            )}
            onPress={() => void generatePractice()}
          />
          {practiceMessage ? (
            <Text style={[styles.body, { color: theme.muted }]}>
              {practiceMessage}
            </Text>
          ) : null}
        </Surface>

        <Surface>
          {messages.length ? (
            messages.map((item, index) => (
              <View
                key={`${item.role}-${index}`}
                style={[
                  styles.message,
                  {
                    backgroundColor:
                      item.role === "user"
                        ? theme.surfaceMuted
                        : theme.warningSurface,
                  },
                ]}
              >
                <Text style={[styles.messageRole, { color: theme.muted }]}>
                  {item.role === "user" ? t("你", "You") : "DeepStudy"}
                </Text>
                <Text style={[styles.body, { color: theme.ink }]}>
                  {item.content}
                </Text>
              </View>
            ))
          ) : (
            <Text style={[styles.body, { color: theme.muted }]}>
              {t(
                "对话会从你的尝试开始，再给一个最小提示。",
                "The conversation starts from your attempt, then gives one minimal hint.",
              )}
            </Text>
          )}
          <Field
            label={t(
              "你已经做到哪一步？",
              "What have you tried so far?",
            )}
            multiline
            value={attempt}
            onChangeText={setAttempt}
          />
          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: assessed }}
            onPress={() => setAssessed((value) => !value)}
            style={styles.checkRow}
          >
            <View
              style={[
                styles.check,
                {
                  borderColor: theme.accent,
                  backgroundColor: assessed ? theme.accent : "transparent",
                },
              ]}
            />
            <Text style={[styles.body, { color: theme.ink }]}>
              {t(
                "这可能是正在评分的作业、测验或考试题",
                "This may be a graded assignment, quiz, or exam question",
              )}
            </Text>
          </Pressable>
          <Field
            label={t("具体卡点", "Specific sticking point")}
            multiline
            value={message}
            onChangeText={setMessage}
          />
          <ActionButton
            disabled={sending || !message.trim()}
            label={
              sending
                ? t("正在思考下一步…", "Finding the next step…")
                : t("获得一个最小提示", "Get one minimal hint")
            }
            onPress={() => void send()}
          />
          {remaining !== null ? (
            <Text style={[styles.body, { color: theme.muted }]}>
              {t(
                `今日剩余导师消息：${remaining}`,
                `Tutor messages left today: ${remaining}`,
              )}
            </Text>
          ) : null}
        </Surface>
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  label: { fontSize: 14, fontWeight: "800" },
  body: { fontSize: 15, lineHeight: 22 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    minHeight: 44,
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: 22,
    paddingHorizontal: 14,
  },
  chipText: { fontSize: 14, fontWeight: "700" },
  resourceList: { gap: 8 },
  checkRow: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  check: { width: 22, height: 22, borderWidth: 2, borderRadius: 6 },
  message: { gap: 5, borderRadius: 12, padding: 13 },
  messageRole: { fontSize: 11, fontWeight: "900", textTransform: "uppercase" },
});
