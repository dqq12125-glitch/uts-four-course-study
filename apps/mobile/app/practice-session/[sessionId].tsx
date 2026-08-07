import { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type {
  CompletedAttemptResponse,
  SafePracticeSession,
} from "@/src/api/types";
import { useSession } from "@/src/auth/session-context";
import { useCopy } from "@/src/i18n";
import { formatReviewTime } from "@/src/lib/dates";
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

const errorOptions = [
  ["concept", "概念", "Concept"],
  ["formula", "公式", "Formula"],
  ["algebra", "代数", "Algebra"],
  ["units", "单位", "Units"],
  ["sign", "正负号", "Sign"],
  ["interpretation", "题意理解", "Interpretation"],
  ["syntax", "语法", "Syntax"],
  ["logic", "逻辑", "Logic"],
  ["careless", "粗心", "Careless"],
  ["unknown", "暂不确定", "Not sure"],
] as const;

const bandLabels: Record<string, readonly [string, string]> = {
  not_started: ["未开始", "Not started"],
  building: ["正在建立", "Building"],
  basic: ["基本掌握", "Basic mastery"],
  stable: ["稳定掌握", "Stable mastery"],
  review_due: ["需要复测", "Review due"],
};

export default function PracticeSessionScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{
    sessionId?: string | string[];
  }>();
  const { api, user } = useSession();
  const { t } = useCopy();
  const sessionId =
    typeof params.sessionId === "string"
      ? params.sessionId
      : params.sessionId?.[0] ?? "";
  const [session, setSession] = useState<SafePracticeSession | null>(null);
  const [answer, setAnswer] = useState("");
  const [hints, setHints] = useState<string[]>([]);
  const [retryNotice, setRetryNotice] = useState("");
  const [result, setResult] =
    useState<CompletedAttemptResponse | null>(null);
  const [errorType, setErrorType] = useState("unknown");
  const [confidenceAfter, setConfidenceAfter] = useState(3);
  const [reflectionSaved, setReflectionSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const loaded = await api.practiceSession(sessionId);
        if (!active) return;
        setSession(loaded);
        setHints(loaded.revealedHints);
        setRetryNotice(
          loaded.incorrectAttempts > 0
            ? t(
                "上一次答案尚未通过。请求一个最小提示，再独立尝试一次。",
                "Your last answer did not pass. Ask for one small hint, then try independently again.",
              )
            : "",
        );
      } catch (caught) {
        if (active) {
          setError(
            caught instanceof Error
              ? caught.message
              : t("无法加载练习。", "Could not load the practice session."),
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    if (sessionId) void load();
    return () => {
      active = false;
    };
  }, [api, sessionId, t]);

  async function requestHint() {
    setSaving(true);
    setError("");
    try {
      const response = await api.requestHint(sessionId);
      setHints((current) => [...current, response.hint]);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : t("暂时没有更多提示。", "No more hints are available right now."),
      );
    } finally {
      setSaving(false);
    }
  }

  async function submit() {
    if (answer === "") return;
    setSaving(true);
    setError("");
    try {
      const response = await api.submitPracticeAnswer(sessionId, answer);
      if (response.retryAllowed) {
        setRetryNotice(response.message);
        setAnswer("");
      } else {
        setResult(response);
        setErrorType(
          response.isCorrect && !response.hadIncorrectAttempt
            ? "unknown"
            : "concept",
        );
      }
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : t("暂时无法提交答案。", "Could not submit your answer right now."),
      );
    } finally {
      setSaving(false);
    }
  }

  async function saveReflection() {
    if (!result) return;
    setSaving(true);
    setError("");
    try {
      await api.saveAttemptReflection(result.attemptId, {
        errorType,
        confidenceAfter,
      });
      setReflectionSaved(true);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : t("无法保存本次反思。", "Could not save this reflection."),
      );
    } finally {
      setSaving(false);
    }
  }

  if (!sessionId) {
    return (
      <Screen>
        <EmptyState
          title={t("无法打开练习", "Could not open practice")}
          body={t("练习链接无效。", "The practice link is invalid.")}
        />
        <ActionButton
          variant="secondary"
          label={t("返回练习", "Back to practice")}
          onPress={() => router.replace("/(tabs)/practice")}
        />
      </Screen>
    );
  }

  if (loading) {
    return (
      <Screen scroll={false}>
        <LoadingState
          label={t(
            "正在准备独立练习…",
            "Preparing independent practice…",
          )}
        />
      </Screen>
    );
  }

  if (!session) {
    return (
      <Screen>
        <EmptyState
          title={t("无法打开练习", "Could not open practice")}
          body={error || t("练习不存在。", "The practice session does not exist.")}
        />
        <ActionButton
          variant="secondary"
          label={t("返回练习", "Back to practice")}
          onPress={() => router.replace("/(tabs)/practice")}
        />
      </Screen>
    );
  }

  if (session.status !== "active" && !result) {
    return (
      <Screen>
        <EmptyState
          title={t("这次练习已经结束", "This practice session has ended")}
          body={t(
            "返回掌握度页面查看复测时间和最新学习证据。",
            "Go to Mastery to see your next review and latest learning evidence.",
          )}
        />
        <ActionButton
          label={t("查看掌握度", "View mastery")}
          onPress={() => router.replace("/(tabs)/mastery")}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <PageHeading
        eyebrow={[session.courseCode, session.courseName]
          .filter(Boolean)
          .join(" · ")}
        title={session.topicTitle}
        lead={t(
          `难度 ${session.difficulty} / 5 · 先独立判断，卡住时只展开一个最小提示。`,
          `Difficulty ${session.difficulty} / 5 · Decide independently first, then reveal one small hint if you are stuck.`,
        )}
      />
      <InlineNotice
        title={t("Hint-first 学习辅导模式", "Hint-first learning mode")}
        body={t(
          "第一次答错不会揭示正确答案，也不会虚增掌握度。",
          "A first incorrect attempt does not reveal the answer or inflate mastery.",
        )}
      />
      <Surface>
        <Text style={[styles.promptLabel, { color: theme.accent }]}>
          {t("独立作答", "Independent attempt")}
        </Text>
        <Text style={[styles.prompt, { color: theme.ink }]}>
          {session.prompt}
        </Text>
      </Surface>

      {!result ? (
        <>
          <Surface accessibilityLabel={t("答案选项", "Answer options")}>
            {session.options.map((option, index) => {
              const value = String(index);
              const selected = answer === value;
              return (
                <Pressable
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  key={`${index}-${option}`}
                  onPress={() => setAnswer(value)}
                  style={[
                    styles.option,
                    {
                      backgroundColor: selected
                        ? theme.surfaceMuted
                        : theme.surface,
                      borderColor: selected ? theme.accent : theme.line,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.optionLetter,
                      {
                        backgroundColor: selected
                          ? theme.accent
                          : theme.surfaceMuted,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.optionLetterText,
                        { color: selected ? theme.inverted : theme.ink },
                      ]}
                    >
                      {String.fromCharCode(65 + index)}
                    </Text>
                  </View>
                  <Text style={[styles.optionText, { color: theme.ink }]}>
                    {option}
                  </Text>
                </Pressable>
              );
            })}
          </Surface>
          {hints.map((hint, index) => (
            <InlineNotice
              key={`${index}-${hint}`}
              tone="warning"
              title={t(`提示 ${index + 1}`, `Hint ${index + 1}`)}
              body={hint}
            />
          ))}
          {retryNotice ? (
            <InlineNotice
              tone="warning"
              title={t(
                "先定位卡点，再试一次",
                "Find the sticking point, then try again",
              )}
              body={t(
                `${retryNotice} 当前未揭示正确答案，也未更新掌握度。`,
                `${retryNotice} The correct answer is still hidden, and mastery has not been updated.`,
              )}
            />
          ) : null}
          {error ? (
            <InlineNotice
              tone="danger"
              title={t("暂时无法继续", "Unable to continue")}
              body={error}
            />
          ) : null}
          <ActionButton
            disabled={saving || answer === ""}
            label={
              saving
                ? t("正在评分…", "Checking…")
                : retryNotice
                  ? t("再次提交答案", "Submit another attempt")
                  : t("提交独立答案", "Submit independent answer")
            }
            onPress={() => void submit()}
          />
          <ActionButton
            variant="secondary"
            disabled={saving || hints.length >= 3}
            label={t("给我一个最小提示", "Give me one small hint")}
            onPress={() => void requestHint()}
          />
        </>
      ) : (
        <>
          <Surface
            style={{
              borderLeftColor: result.isCorrect
                ? theme.success
                : theme.amber,
              borderLeftWidth: 5,
            }}
          >
            <Text
              style={[
                styles.verdict,
                { color: result.isCorrect ? theme.success : theme.amber },
              ]}
            >
              {result.isCorrect
                ? t("本次答案正确", "Correct this time")
                : t("这次还未通过", "Not passed yet")}
            </Text>
            <Text style={[styles.bandTitle, { color: theme.ink }]}>
              {t(
                bandLabels[result.masteryBand]?.[0] ?? "正在建立",
                bandLabels[result.masteryBand]?.[1] ?? "Building",
              )}
            </Text>
            <View style={styles.resultBlock}>
              <Text style={[styles.resultLabel, { color: theme.muted }]}>
                {t("正确答案", "Correct answer")}
              </Text>
              <Text style={[styles.resultText, { color: theme.ink }]}>
                {result.correctAnswer}
              </Text>
            </View>
            <View style={styles.resultBlock}>
              <Text style={[styles.resultLabel, { color: theme.muted }]}>
                {t("为什么", "Why")}
              </Text>
              <Text style={[styles.resultText, { color: theme.ink }]}>
                {result.explanation}
              </Text>
            </View>
            <View style={styles.resultBlock}>
              <Text style={[styles.resultLabel, { color: theme.muted }]}>
                {t("下次复测", "Next review")}
              </Text>
              <Text style={[styles.resultText, { color: theme.ink }]}>
                {formatReviewTime(
                  result.nextReviewAt,
                  user?.preferredLanguage ?? "zh-CN",
                  user?.timezone ?? "Australia/Sydney",
                )}
              </Text>
            </View>
          </Surface>

          {!reflectionSaved ? (
            <Surface>
              <Text style={[styles.reflectionTitle, { color: theme.ink }]}>
                {t("记录这次学习证据", "Record this learning evidence")}
              </Text>
              {!result.isCorrect || result.hadIncorrectAttempt ? (
                <View style={styles.choiceSection}>
                  <Text style={[styles.resultLabel, { color: theme.muted }]}>
                    {t("主要错误类型", "Main error type")}
                  </Text>
                  <View style={styles.chipList}>
                    {errorOptions.map(([value, chinese, english]) => {
                      const selected = errorType === value;
                      return (
                        <Pressable
                          accessibilityRole="radio"
                          accessibilityState={{ selected }}
                          key={value}
                          onPress={() => setErrorType(value)}
                          style={[
                            styles.chip,
                            {
                              backgroundColor: selected
                                ? theme.accent
                                : theme.surfaceMuted,
                              borderColor: selected
                                ? theme.accent
                                : theme.line,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.chipText,
                              {
                                color: selected
                                  ? theme.inverted
                                  : theme.ink,
                              },
                            ]}
                          >
                            {t(chinese, english)}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              ) : null}
              <View style={styles.choiceSection}>
                <Text style={[styles.resultLabel, { color: theme.muted }]}>
                  {t("作答后的信心", "Confidence after answering")}
                </Text>
                <View style={styles.confidenceRow}>
                  {[1, 2, 3, 4, 5].map((value) => {
                    const selected = confidenceAfter === value;
                    return (
                      <Pressable
                        accessibilityRole="radio"
                        accessibilityState={{ selected }}
                        key={value}
                        onPress={() => setConfidenceAfter(value)}
                        style={[
                          styles.confidence,
                          {
                            backgroundColor: selected
                              ? theme.accent
                              : theme.surfaceMuted,
                            borderColor: selected
                              ? theme.accent
                              : theme.line,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            {
                              color: selected
                                ? theme.inverted
                                : theme.ink,
                            },
                          ]}
                        >
                          {value}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
              {error ? (
                <InlineNotice
                  tone="danger"
                  title={t("反思尚未保存", "Reflection not saved")}
                  body={error}
                />
              ) : null}
              <ActionButton
                disabled={saving}
                label={
                  saving
                    ? t("正在保存…", "Saving…")
                    : t(
                        "保存错误类型与信心",
                        "Save error type and confidence",
                      )
                }
                onPress={() => void saveReflection()}
              />
            </Surface>
          ) : (
            <>
              <InlineNotice
                title={t("学习证据已保存", "Learning evidence saved")}
                body={t(
                  "掌握阶段和下一次复测安排已经更新。",
                  "Your mastery stage and next review have been updated.",
                )}
              />
              <ActionButton
                label={t("查看掌握度", "View mastery")}
                onPress={() => router.replace("/(tabs)/mastery")}
              />
              <ActionButton
                variant="secondary"
                label={t("返回练习", "Back to practice")}
                onPress={() => router.replace("/(tabs)/practice")}
              />
            </>
          )}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  promptLabel: {
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  prompt: {
    fontSize: 21,
    lineHeight: 30,
    fontWeight: "700",
  },
  option: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
  },
  optionLetter: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
  },
  optionLetterText: {
    fontSize: 14,
    fontWeight: "900",
  },
  optionText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "600",
  },
  verdict: {
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.4,
  },
  bandTitle: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: "800",
  },
  resultBlock: {
    gap: 4,
  },
  resultLabel: {
    fontSize: 12,
    fontWeight: "800",
  },
  resultText: {
    fontSize: 15,
    lineHeight: 23,
  },
  reflectionTitle: {
    fontSize: 20,
    fontWeight: "800",
  },
  choiceSection: {
    gap: 9,
  },
  chipList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    minHeight: 42,
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipText: {
    fontSize: 14,
    fontWeight: "800",
  },
  confidenceRow: {
    flexDirection: "row",
    gap: 8,
  },
  confidence: {
    minHeight: 46,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: 12,
  },
});
